import { config } from 'dotenv';
import { db } from '@/server/db';
import { users, emailVerificationTokens } from '@/server/db/schema';
import { eq, lt } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import {
  getEmailVerificationHtml,
  getEmailVerificationText,
} from '@/lib/email-templates/email-verification';

config();

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

async function sendVerificationToExistingUsers() {
  console.log('Starting email verification process for existing users...\n');

  try {
    // Find all users who haven't verified their email
    const unverifiedUsers = await db.query.users.findMany({
      where: lt(users.emailVerifiedAt, new Date(0)),
      columns: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (unverifiedUsers.length === 0) {
      console.log('✅ No unverified users found.');
      return;
    }

    console.log(`Found ${unverifiedUsers.length} unverified users.\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of unverifiedUsers) {
      try {
        console.log(`Processing user: ${user.email} (${user.name || 'N/A'})`);

        // Delete any existing tokens for this user
        await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));

        // Generate new token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        // Store token in database
        await db.insert(emailVerificationTokens).values({
          userId: user.id,
          token,
          expiresAt,
        });

        // Build verification URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationUrl = `${appUrl}/api/verify-email?token=${token}`;

        // Send verification email (mark as existing user)
        await sendEmail({
          to: user.email!,
          subject: 'Action Required: Verify Your Email Address',
          html: getEmailVerificationHtml({
            verificationUrl,
            userName: user.name,
            expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
            isExistingUser: true,
          }),
          text: getEmailVerificationText({
            verificationUrl,
            userName: user.name,
            expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
            isExistingUser: true,
          }),
          category: 'Email Verification',
        });

        console.log(`✅ Verification email sent to ${user.email}`);
        successCount++;

        // Add delay to avoid rate limits (500ms between emails)
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: unknown) {
        console.error(
          `❌ Error processing user ${user.email}:`,
          error instanceof Error ? error.message : error
        );
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log('SUMMARY:');
    console.log(`✅ Successfully sent: ${successCount} emails`);
    console.log(`❌ Failed: ${errorCount} emails`);
    console.log(`📊 Total processed: ${unverifiedUsers.length} users`);
    console.log('========================================');

    if (errorCount > 0) {
      console.log(
        '\nSome emails failed to send. Check the errors above and consider running the script again.'
      );
      process.exit(1);
    }
  } catch (error: unknown) {
    console.error(
      'Fatal error running verification script:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Run the script
sendVerificationToExistingUsers().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
