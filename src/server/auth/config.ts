import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { db } from '@/server/db';
import { accounts, users } from '@/server/db/schema';
import { createCaller } from '@/server/api/root';
import type { AuthUser } from '@/types';

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
            email: z.string().email(),
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

          // Store rememberMe in the user object to access it in jwt callback
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            rememberMe:
              parsedCredentials.data.rememberMe === true ||
              parsedCredentials.data.rememberMe === 'true',
          };
        } catch (error: unknown) {
          // Return null to indicate authentication failure
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Authentication error:', errorMessage);
          return null;
        }
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  callbacks: {
    jwt: ({ token, user, trigger }) => {
      // On log in, store rememberMe preference
      if (user && trigger === 'signIn') {
        token.id = user.id;
        // Store rememberMe as a custom property on the token
        (token as { rememberMe?: boolean }).rememberMe = (user as AuthUser).rememberMe ?? false;

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
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
      },
    }),
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days maximum (will be overridden by JWT exp)
  },
  pages: {
    signIn: '/account/login',
  },
} satisfies NextAuthConfig;
