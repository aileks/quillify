import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
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

    const hashedPassword = await bcrypt.hash(password, 10);

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

    const isValidPassword = await bcrypt.compare(password, user.password);

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
      emailVerified: user.emailVerified,
      image: user.image,
    };
  }),

  // Check if an email is already registered
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      return {
        exists: !!user,
      };
    }),
});
