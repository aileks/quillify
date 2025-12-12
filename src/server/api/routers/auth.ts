import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc';
import { users, passwordResetTokens } from '@/server/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from '@/lib/email-templates/password-reset';

const TOKEN_EXPIRY_MINUTES = 30;
const MAX_RESET_REQUESTS_PER_HOUR = 3;

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

      return {
        success: true,
        user: newUser,
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

    // Normalize bcrypt hash format: Laravel uses $2y$ prefix, Node.js bcrypt uses $2b$
    // Both are compatible, but bcrypt.compare requires matching prefix format
    const passwordHash = user.password;
    const normalizedHash =
      passwordHash.startsWith('$2y$') ? passwordHash.replace(/^\$2y\$/, '$2b$') : passwordHash;

    const isValidPassword = await bcrypt.compare(password, normalizedHash);

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

  // Check if an email is already registered
  checkEmail: publicProcedure
    .input(z.object({ email: z.email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      return {
        exists: !!user,
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
      const { newEmail, currentPassword } = input;
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

      // Verify current password (normalize hash format for Laravel compatibility)
      const passwordHash = user.password;
      const normalizedHash =
        passwordHash.startsWith('$2y$') ? passwordHash.replace(/^\$2y\$/, '$2b$') : passwordHash;

      const isValidPassword = await bcrypt.compare(currentPassword, normalizedHash);

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

      // Update email
      try {
        await ctx.db
          .update(users)
          .set({
            email: newEmail,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        return {
          success: true,
          message: 'Email updated successfully',
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error updating email:', errorMessage);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update email',
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

      // Verify current password (normalize hash format for Laravel compatibility)
      const passwordHash = user.password;
      const normalizedHash =
        passwordHash.startsWith('$2y$') ? passwordHash.replace(/^\$2y\$/, '$2b$') : passwordHash;

      const isValidPassword = await bcrypt.compare(currentPassword, normalizedHash);

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
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Store token in database
      try {
        await ctx.db.insert(passwordResetTokens).values({
          userId: user.id,
          token,
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetUrl = `${appUrl}/account/reset-password?token=${token}`;

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
      const { token } = input;

      const resetToken = await ctx.db.query.passwordResetTokens.findFirst({
        where: eq(passwordResetTokens.token, token),
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
      const { token, password } = input;

      // Find and validate token
      const resetToken = await ctx.db.query.passwordResetTokens.findFirst({
        where: eq(passwordResetTokens.token, token),
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

      // Update user password and delete token
      try {
        await ctx.db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(users.id, resetToken.userId));

        // Delete the used token
        await ctx.db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

        // Clean up any other expired tokens for this user
        await ctx.db
          .delete(passwordResetTokens)
          .where(
            and(
              eq(passwordResetTokens.userId, resetToken.userId),
              lt(passwordResetTokens.expiresAt, new Date())
            )
          );

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
   * Cleanup expired password reset tokens (for cron job)
   */
  cleanupExpiredTokens: publicProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await ctx.db
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, new Date()))
        .returning({ id: passwordResetTokens.id });

      return {
        success: true,
        deletedCount: result.length,
      };
    } catch (error: unknown) {
      console.error(
        'Error cleaning up expired tokens:',
        error instanceof Error ? error.message : error
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cleanup expired tokens.',
      });
    }
  }),
});
