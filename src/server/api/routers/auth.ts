import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc';
import { users, passwordResetTokens, emailVerificationTokens } from '@/server/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from '@/lib/email-templates/password-reset';
import {
  getEmailVerificationHtml,
  getEmailVerificationText,
} from '@/lib/email-templates/email-verification';
import { verifyPassword } from '@/server/auth/password';
import { createOpaqueToken, hashOpaqueToken } from '@/server/auth/token';

const TOKEN_EXPIRY_MINUTES = 30;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const MAX_RESET_REQUESTS_PER_HOUR = 3;
const MAX_VERIFICATION_REQUESTS_PER_HOUR = 3;

const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper function to generate verification URL
function generateVerificationUrl(token: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${appUrl}/api/verify-email?token=${token}`;
}

export const authRouter = createTRPCRouter({
  /**
   * Register a new user with email and password
   */
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await ctx.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'A user with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    try {
      const [newUser] = await ctx.db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name: name || null,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
        });

      if (!newUser) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }

      // Send verification email
      try {
        // Delete any existing tokens for this user (shouldn't exist, but just in case)
        await ctx.db
          .delete(emailVerificationTokens)
          .where(eq(emailVerificationTokens.userId, newUser.id));

        // Generate verification token
        const { rawToken, tokenHash } = createOpaqueToken();
        const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        // Store token in database
        await ctx.db.insert(emailVerificationTokens).values({
          userId: newUser.id,
          tokenHash,
          expiresAt,
        });

        // Build verification URL
        const verificationUrl = generateVerificationUrl(rawToken);

        // Send verification email
        await sendEmail({
          to: newUser.email!,
          subject: 'Verify Your Email Address',
          html: getEmailVerificationHtml({
            verificationUrl,
            userName: newUser.name,
            expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
            isExistingUser: false,
          }),
          text: getEmailVerificationText({
            verificationUrl,
            userName: newUser.name,
            expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
            isExistingUser: false,
          }),
          category: 'Email Verification',
        });
      } catch (emailError: unknown) {
        // Don't fail registration if email fails, but log the error
        console.error(
          'Failed to send verification email:',
          emailError instanceof Error ? emailError.message : emailError
        );
      }

      return {
        success: true,
        user: newUser,
        message: 'Registration successful. Please check your email to verify your account.',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating user:', errorMessage);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
      });
    }
  }),

  /**
   * Verify user credentials
   */
  verifyCredentials: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const { email, password } = input;

    // Find user by email
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    if (!user.password) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This account uses a different sign-in method',
      });
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }),

  /**
   * Update user email (requires current password verification)
   */
  updateEmail: protectedProcedure
    .input(
      z.object({
        newEmail: z.email('Invalid email address'),
        currentPassword: z.string().min(1, 'Current password is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword } = input;
      const newEmail = input.newEmail.trim();
      const userId = ctx.session.user.id;

      // Get current user
      let user;
      try {
        user = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
        });
      } catch (error: unknown) {
        console.error('Error fetching user:', error instanceof Error ? error.message : error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update email. Please try again.',
        });
      }

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This account uses a different sign-in method',
        });
      }

      const currentEmail = (user.email ?? '').trim().toLowerCase();
      const normalizedNewEmail = newEmail.toLowerCase();

      if (currentEmail === normalizedNewEmail) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'New email must be different from current email',
        });
      }

      const isValidPassword = await verifyPassword(currentPassword, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Check if new email is already taken
      let existingUser;
      try {
        existingUser = await ctx.db.query.users.findFirst({
          where: eq(users.email, newEmail),
        });
      } catch (error: unknown) {
        console.error('Error checking email:', error instanceof Error ? error.message : error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update email. Please try again.',
        });
      }

      if (existingUser && existingUser.id !== userId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A user with this email already exists',
        });
      }

      // Generate verification token and email metadata
      const { rawToken, tokenHash } = createOpaqueToken();
      const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
      const verificationUrl = generateVerificationUrl(rawToken);
      const isExistingUser = user.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Keep the database transaction short. Email delivery happens after it commits.
      try {
        await ctx.db.transaction(async (tx) => {
          await tx
            .update(users)
            .set({
              email: newEmail,
              emailVerifiedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          await tx
            .delete(emailVerificationTokens)
            .where(eq(emailVerificationTokens.userId, userId));

          await tx.insert(emailVerificationTokens).values({
            userId,
            tokenHash,
            expiresAt,
          });
        });

        await sendEmail({
          to: newEmail,
          subject:
            isExistingUser ?
              'Action Required: Verify Your Email Address'
            : 'Verify Your Email Address',
          html: getEmailVerificationHtml({
            verificationUrl,
            userName: user.name,
            expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
            isExistingUser,
          }),
          text: getEmailVerificationText({
            verificationUrl,
            userName: user.name,
            expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
            isExistingUser,
          }),
          category: 'Email Verification',
        });

        return {
          success: true,
          message: 'Email updated successfully. Please verify your new email address.',
          requiresEmailVerification: true,
          email: newEmail,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error updating email:', errorMessage);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update email. Please try again.',
        });
      }
    }),

  /**
   * Update user password (requires current password verification)
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input;
      const userId = ctx.session.user.id;

      // Get current user
      let user;
      try {
        user = await ctx.db.query.users.findFirst({
          where: eq(users.id, userId),
        });
      } catch (error: unknown) {
        console.error('Error fetching user:', error instanceof Error ? error.message : error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update password. Please try again.',
        });
      }

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This account uses a different sign-in method',
        });
      }

      const isValidPassword = await verifyPassword(currentPassword, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      try {
        await ctx.db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        return {
          success: true,
          message: 'Password updated successfully',
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error updating password:', errorMessage);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update password',
        });
      }
    }),

  /**
   * Update user name
   */
  updateName: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(2, 'Name must be at least 2 characters')
          .max(25, 'Name must be at most 25 characters')
          .regex(/^[a-zA-Z0-9 ]+$/, 'Name can only contain letters, numbers, and spaces')
          .transform((val) => val.trim()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        await ctx.db
          .update(users)
          .set({
            name: input.name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        return {
          success: true,
          message: 'Name updated successfully',
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error updating name:', errorMessage);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update name',
        });
      }
    }),

  /**
   * Request a password reset email
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.email('Invalid email address') }))
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Find user by email
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return {
          success: true,
          message: 'If an account with that email exists, we sent a password reset link.',
        };
      }

      // Check rate limit: max 3 requests per hour per user
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTokens = await ctx.db.query.passwordResetTokens.findMany({
        where: and(
          eq(passwordResetTokens.userId, user.id),
          gt(passwordResetTokens.createdAt, oneHourAgo)
        ),
      });

      if (recentTokens.length >= MAX_RESET_REQUESTS_PER_HOUR) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many password reset requests. Please try again later.',
        });
      }

      // Generate secure token
      const { rawToken, tokenHash } = createOpaqueToken();
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Store token in database
      try {
        await ctx.db.insert(passwordResetTokens).values({
          userId: user.id,
          tokenHash,
          expiresAt,
        });
      } catch (error: unknown) {
        console.error(
          'Error creating password reset token:',
          error instanceof Error ? error.message : error
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create password reset request. Please try again.',
        });
      }

      // Build reset URL
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
        /\/$/,
        ''
      );
      const resetUrl = `${appUrl}/account/reset-password?token=${rawToken}`;

      // Send email
      try {
        await sendEmail({
          to: email,
          subject: 'Reset Your Password',
          html: getPasswordResetEmailHtml({
            resetUrl,
            userName: user.name,
            expiresInMinutes: TOKEN_EXPIRY_MINUTES,
          }),
          text: getPasswordResetEmailText({
            resetUrl,
            userName: user.name,
            expiresInMinutes: TOKEN_EXPIRY_MINUTES,
          }),
          category: 'Password Reset',
        });
      } catch (error: unknown) {
        console.error(
          'Error sending password reset email:',
          error instanceof Error ? error.message : error
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send password reset email. Please try again.',
        });
      }

      return {
        success: true,
        message: 'If an account with that email exists, we sent a password reset link.',
      };
    }),

  /**
   * Validate a password reset token
   */
  validateResetToken: publicProcedure
    .input(z.object({ token: z.string().min(1, 'Token is required') }))
    .query(async ({ ctx, input }) => {
      const tokenHash = hashOpaqueToken(input.token);

      const resetToken = await ctx.db.query.passwordResetTokens.findFirst({
        where: eq(passwordResetTokens.tokenHash, tokenHash),
      });

      if (!resetToken) {
        return { valid: false, message: 'Invalid or expired reset link.' };
      }

      if (new Date() > resetToken.expiresAt) {
        // Clean up expired token
        await ctx.db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
        return { valid: false, message: 'This reset link has expired. Please request a new one.' };
      }

      return { valid: true };
    }),

  /**
   * Reset password using a valid token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Token is required'),
        password: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { password } = input;
      const tokenHash = hashOpaqueToken(input.token);

      // Find and validate token
      const resetToken = await ctx.db.query.passwordResetTokens.findFirst({
        where: eq(passwordResetTokens.tokenHash, tokenHash),
      });

      if (!resetToken) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired reset link.',
        });
      }

      if (new Date() > resetToken.expiresAt) {
        // Clean up expired token
        await ctx.db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This reset link has expired. Please request a new one.',
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update the password and invalidate every outstanding reset link.
      try {
        await ctx.db.transaction(async (tx) => {
          await tx
            .update(users)
            .set({
              password: hashedPassword,
              updatedAt: new Date(),
            })
            .where(eq(users.id, resetToken.userId));

          await tx
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.userId, resetToken.userId));
        });

        return {
          success: true,
          message: 'Password reset successfully. You can now log in with your new password.',
        };
      } catch (error: unknown) {
        console.error('Error resetting password:', error instanceof Error ? error.message : error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password. Please try again.',
        });
      }
    }),

  /**
   * Send email verification link to user
   */
  sendVerificationEmail: publicProcedure
    .input(z.object({ email: z.email('Invalid email address') }))
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Find user by email
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return {
          success: true,
          message: 'If an account with that email exists, we sent a verification link.',
        };
      }

      // Check if email is already verified
      if (user.emailVerifiedAt) {
        return {
          success: true,
          message: 'Your email is already verified.',
        };
      }

      // Check rate limit: max 3 requests per hour per user
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTokens = await ctx.db.query.emailVerificationTokens.findMany({
        where: and(
          eq(emailVerificationTokens.userId, user.id),
          gt(emailVerificationTokens.createdAt, oneHourAgo)
        ),
        orderBy: [desc(emailVerificationTokens.createdAt)],
      });

      if (recentTokens.length >= MAX_VERIFICATION_REQUESTS_PER_HOUR) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many verification requests. Please try again later.',
        });
      }

      // Generate secure token
      const { rawToken, tokenHash } = createOpaqueToken();
      const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Store token in database
      try {
        await ctx.db.insert(emailVerificationTokens).values({
          userId: user.id,
          tokenHash,
          expiresAt,
        });
      } catch (error: unknown) {
        console.error(
          'Error creating email verification token:',
          error instanceof Error ? error.message : error
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create verification request. Please try again.',
        });
      }

      // Build verification URL
      const verificationUrl = generateVerificationUrl(rawToken);

      // Determine if this is for an existing user (based on account age)
      const isExistingUser = user.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Send email
      try {
        await sendEmail({
          to: email,
          subject:
            isExistingUser ?
              'Action Required: Verify Your Email Address'
            : 'Verify Your Email Address',
          html: getEmailVerificationHtml({
            verificationUrl,
            userName: user.name,
            expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
            isExistingUser,
          }),
          text: getEmailVerificationText({
            verificationUrl,
            userName: user.name,
            expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
            isExistingUser,
          }),
          category: 'Email Verification',
        });
      } catch (error: unknown) {
        console.error(
          'Error sending verification email:',
          error instanceof Error ? error.message : error
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send verification email. Please try again.',
        });
      }

      return {
        success: true,
        message: 'If an account with that email exists, we sent a verification link.',
      };
    }),

  /**
   * Verify email using a valid token
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(1, 'Token is required') }))
    .mutation(async ({ ctx, input }) => {
      const tokenHash = hashOpaqueToken(input.token);

      // Find and validate token
      const verificationToken = await ctx.db.query.emailVerificationTokens.findFirst({
        where: eq(emailVerificationTokens.tokenHash, tokenHash),
      });

      if (!verificationToken) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired verification link.',
        });
      }

      if (new Date() > verificationToken.expiresAt) {
        // Clean up expired token
        await ctx.db
          .delete(emailVerificationTokens)
          .where(eq(emailVerificationTokens.id, verificationToken.id));
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This verification link has expired. Please request a new one.',
        });
      }

      // Verify the email and invalidate every outstanding verification link.
      try {
        await ctx.db.transaction(async (tx) => {
          await tx
            .update(users)
            .set({
              emailVerifiedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.id, verificationToken.userId));

          await tx
            .delete(emailVerificationTokens)
            .where(eq(emailVerificationTokens.userId, verificationToken.userId));
        });

        return {
          success: true,
          message: 'Email verified successfully. You can now log in.',
        };
      } catch (error: unknown) {
        console.error('Error verifying email:', error instanceof Error ? error.message : error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify email. Please try again.',
        });
      }
    }),

  /**
   * Delete user account (requires password verification)
   * Cascade delete will handle all related data (books, tokens, etc.)
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, 'Password is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword } = input;
      const userId = ctx.session.user.id;

      // Get current user
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (!user.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This account uses a different sign-in method',
        });
      }

      const isValidPassword = await verifyPassword(currentPassword, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Incorrect password',
        });
      }

      // Delete user - cascade will handle books, tokens, etc.
      try {
        await ctx.db.delete(users).where(eq(users.id, userId));

        return {
          success: true,
          message: 'Account deleted successfully',
        };
      } catch (error: unknown) {
        console.error('Error deleting account:', error instanceof Error ? error.message : error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account. Please try again.',
        });
      }
    }),
});
