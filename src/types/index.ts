import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import type { users, books, accounts } from '@/server/db/schema';

/**
 * tRPC error structure based on the error format returned by tRPC procedures
 */
export interface TRPCErrorShape {
  message: string;
  code: TRPC_ERROR_CODE_KEY;
  data?: {
    code: TRPC_ERROR_CODE_KEY;
    httpStatus: number;
    path?: string;
    zodError?: {
      fieldErrors: Record<string, string[]>;
      formErrors: string[];
    } | null;
  };
}

/**
 * Extended User type for NextAuth with rememberMe flag
 * Used during authentication to pass custom properties through the auth flow
 */
export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  rememberMe?: boolean;
}

/**
 * Inferred types from Drizzle schema for type-safe database operations
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
