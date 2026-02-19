import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { db } from '@/server/db';
import { createCaller } from '@/server/api/root';
import type { AuthUser } from '@/types';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      emailVerified: boolean;
      // ...other properties
      // role: UserRole;
    } & DefaultSession['user'];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' },
      },
      async authorize(credentials) {
        // Validate credentials schema
        const parsedCredentials = z
          .object({
            email: z.email(),
            password: z.string().min(1),
            rememberMe: z.union([z.boolean(), z.string()]).optional(),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        try {
          // Create tRPC caller
          const caller = createCaller({
            db,
            session: null,
            headers: new Headers(),
          });

          // Verify credentials using our auth router
          const user = await caller.auth.verifyCredentials({
            email: parsedCredentials.data.email,
            password: parsedCredentials.data.password,
          });

          // Check if email is verified
          const userRecord = await db.query.users.findFirst({
            where: eq(users.id, user.id),
          });

          if (!userRecord) {
            return null;
          }

          // If email not verified, mark it so we can track in session
          if (!userRecord.emailVerifiedAt) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              rememberMe:
                parsedCredentials.data.rememberMe === true ||
                parsedCredentials.data.rememberMe === 'true',
              requiresEmailVerification: true,
            };
          }

          // Store rememberMe in the user object to access it in jwt callback
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            rememberMe:
              parsedCredentials.data.rememberMe === true ||
              parsedCredentials.data.rememberMe === 'true',
          };
        } catch (error: unknown) {
          // Return null to indicate authentication failure
          console.error('Authentication error:', error instanceof Error ? error.message : error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      // On log in, store rememberMe preference and check verification
      if (user && trigger === 'signIn') {
        token.id = user.id;
        // Store rememberMe as a custom property on the token
        (token as { rememberMe?: boolean }).rememberMe = (user as AuthUser).rememberMe ?? false;

        // Store email verified status based on requiresEmailVerification flag from authorize
        // If requiresEmailVerification is true, email is NOT verified
        const requiresVerification = (user as AuthUser & { requiresEmailVerification?: boolean })
          .requiresEmailVerification;
        (token as { emailVerified?: boolean }).emailVerified = !requiresVerification;

        // Set custom expiry based on rememberMe
        const now = Math.floor(Date.now() / 1000);
        const rememberMe = (token as { rememberMe?: boolean }).rememberMe;
        if (rememberMe) {
          // 30 days
          token.exp = now + 30 * 24 * 60 * 60;
        } else {
          // 1 day
          token.exp = now + 24 * 60 * 60;
        }
      }

      // Refresh token fields after explicit session update() calls
      if (token.id && trigger === 'update') {
        try {
          const userRecord = await db.query.users.findFirst({
            where: eq(users.id, token.id as string),
            columns: { email: true, emailVerifiedAt: true },
          });

          if (userRecord) {
            token.email = userRecord.email;
            (token as { emailVerified?: boolean }).emailVerified = !!userRecord.emailVerifiedAt;
          }
        } catch (error) {
          // Log but don't fail session updates
          console.error('Error refreshing user session state:', error);
        }
      }

      // For unverified users, check if they've verified since login
      // This allows the session to update without requiring re-login
      const emailVerified = (token as { emailVerified?: boolean }).emailVerified;
      if (token.id && emailVerified === false) {
        try {
          const userRecord = await db.query.users.findFirst({
            where: eq(users.id, token.id as string),
            columns: { emailVerifiedAt: true },
          });

          if (userRecord?.emailVerifiedAt) {
            // User has verified their email - update the token
            (token as { emailVerified?: boolean }).emailVerified = true;
          }
        } catch (error) {
          // Log but don't fail - just keep the current state
          console.error('Error checking email verification status:', error);
        }
      }

      return token;
    },
    signIn: async () => {
      // Allow all sign-ins - email verification is handled via in-app notice, not login blocking
      return true;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        email: token.email,
        emailVerified: (token as { emailVerified?: boolean }).emailVerified ?? false,
      },
    }),
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days maximum (will be overridden by JWT exp)
  },
  pages: {
    signIn: '/',
  },
} satisfies NextAuthConfig;
