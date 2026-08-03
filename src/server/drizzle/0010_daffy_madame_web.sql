DELETE FROM "quillify"."email_verification_tokens";--> statement-breakpoint
DELETE FROM "quillify"."password_reset_tokens";--> statement-breakpoint
ALTER TABLE "quillify"."email_verification_tokens" RENAME COLUMN "token" TO "tokenHash";--> statement-breakpoint
ALTER TABLE "quillify"."password_reset_tokens" RENAME COLUMN "token" TO "tokenHash";--> statement-breakpoint
ALTER TABLE "quillify"."email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_token_unique";--> statement-breakpoint
ALTER TABLE "quillify"."password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_token_unique";--> statement-breakpoint
ALTER TABLE "quillify"."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_tokenHash_unique" UNIQUE("tokenHash");--> statement-breakpoint
ALTER TABLE "quillify"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_tokenHash_unique" UNIQUE("tokenHash");
