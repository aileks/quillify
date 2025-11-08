ALTER TABLE "quillify"."books" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "quillify"."books" RENAME COLUMN "number_of_pages" TO "numberOfPages";--> statement-breakpoint
ALTER TABLE "quillify"."books" RENAME COLUMN "publish_year" TO "publishYear";--> statement-breakpoint
ALTER TABLE "quillify"."books" RENAME COLUMN "is_read" TO "isRead";--> statement-breakpoint
ALTER TABLE "quillify"."books" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "quillify"."books" DROP CONSTRAINT "books_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "quillify"."users" ADD COLUMN "emailVerifiedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quillify"."books" ADD CONSTRAINT "books_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "quillify"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."users" DROP COLUMN "email_verified_at";