import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { db } from '@/server/db';
import { createCaller } from '@/server/api/root';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

const silentLogger = {
  debug() {},
  error() {},
  warn() {},
};

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

  interface User {
    rememberMe?: boolean;
    requiresEmailVerification?: boolean;
  }
}

/** Session token claims our sign-in flow writes onto the JWT. */
type SessionToken = JWT & {
  id?: string;
  rememberMe?: boolean;
  emailVerified?: boolean;
};

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  logger: process.env.NODE_ENV === 'production' ? silentLogger : undefined,
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
      // SAFETY: sign-in writes these claims before any later callback reads them.
      const sessionToken = token as SessionToken;

      // On log in, store rememberMe preference and check verification
      if (user && trigger === 'signIn') {
        sessionToken.id = user.id;
        sessionToken.rememberMe = user.rememberMe ?? false;

        // Store email verified status based on requiresEmailVerification flag from authorize
        // If requiresEmailVerification is true, email is NOT verified
        sessionToken.emailVerified = !user.requiresEmailVerification;

        // Set custom expiry based on rememberMe
        const now = Math.floor(Date.now() / 1000);
        if (sessionToken.rememberMe) {
          // 30 days
          token.exp = now + 30 * 24 * 60 * 60;
        } else {
          // 1 day
          token.exp = now + 24 * 60 * 60;
        }
      }

      // Refresh token fields after explicit session update() calls
      if (sessionToken.id && trigger === 'update') {
        try {
          const userRecord = await db.query.users.findFirst({
            where: eq(users.id, sessionToken.id),
            columns: { name: true, email: true, emailVerifiedAt: true },
          });

          if (userRecord) {
            token.name = userRecord.name;
            token.email = userRecord.email;
            sessionToken.emailVerified = !!userRecord.emailVerifiedAt;
          }
        } catch (error) {
          // Log but don't fail session updates
          console.error('Error refreshing user session state:', error);
        }
      }

      // For unverified users, check if they've verified since login
      // This allows the session to update without requiring re-login
      if (sessionToken.id && sessionToken.emailVerified === false) {
        try {
          const userRecord = await db.query.users.findFirst({
            where: eq(users.id, sessionToken.id),
            columns: { emailVerifiedAt: true },
          });

          if (userRecord?.emailVerifiedAt) {
            // User has verified their email - update the token
            sessionToken.emailVerified = true;
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
    session: ({ session, token }) => {
      // SAFETY: the jwt callback sets these claims on every sign-in.
      const sessionToken = token as SessionToken;
      return {
        ...session,
        user: {
          ...session.user,
          id: sessionToken.id ?? session.user.id,
          name: token.name,
          email: token.email,
          emailVerified: sessionToken.emailVerified ?? false,
        },
      };
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days maximum (will be overridden by JWT exp)
  },
  pages: {
    signIn: '/',
  },
} satisfies NextAuthConfig;
