import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { db } from '@/server/db';
import { emailVerificationTokens } from '@/server/db/schema';
import { createCaller } from '@/server/api/root';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/account/verify-email?status=invalid', request.url));
  }

  // Look up the token with associated user to get email (for error cases)
  let userEmail: string | null = null;
  try {
    const tokenRecord = await db.query.emailVerificationTokens.findFirst({
      where: eq(emailVerificationTokens.token, token),
      with: {
        user: true,
      },
    });

    if (tokenRecord?.user?.email) {
      userEmail = tokenRecord.user.email;
    }
  } catch (error) {
    console.error('Error looking up verification token:', error);
  }

  try {
    // Create tRPC caller
    const caller = createCaller({
      db,
      session: null,
      headers: request.headers,
    });

    // Verify the token
    const result = await caller.auth.verifyEmail({ token });

    if (result.success) {
      // Redirect to verification success page
      return NextResponse.redirect(new URL('/account/verify-email?status=success', request.url));
    }

    // Should not reach here given the response structure, but just in case
    return NextResponse.redirect(new URL('/account/verify-email?status=invalid', request.url));
  } catch (error) {
    console.error('Email verification error:', error);

    let status = 'invalid';

    if (error instanceof TRPCError) {
      if (error.code === 'NOT_FOUND') {
        status = 'invalid';
      } else if (error.code === 'BAD_REQUEST') {
        status = 'expired';
      }
    }

    // Build redirect URL with email if available (for expired tokens)
    const redirectUrl = new URL(`/account/verify-email?status=${status}`, request.url);
    if (userEmail && status === 'expired') {
      redirectUrl.searchParams.set('email', userEmail);
    }

    return NextResponse.redirect(redirectUrl);
  }
}
