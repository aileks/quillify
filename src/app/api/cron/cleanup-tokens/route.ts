import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { emailVerificationTokens, passwordResetTokens } from '@/server/db/schema';
import { lt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const [passwordTokens, verificationTokens] = await Promise.all([
      db
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, now))
        .returning({ id: passwordResetTokens.id }),
      db
        .delete(emailVerificationTokens)
        .where(lt(emailVerificationTokens.expiresAt, now))
        .returning({ id: emailVerificationTokens.id }),
    ]);

    return NextResponse.json({
      success: true,
      deletedCount: passwordTokens.length + verificationTokens.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error(
      'Error cleaning up expired tokens:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ error: 'Failed to cleanup tokens' }, { status: 500 });
  }
}
