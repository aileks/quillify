import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

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
});
