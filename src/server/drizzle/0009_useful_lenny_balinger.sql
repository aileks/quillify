CREATE TABLE "quillify"."email_verification_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "quillify"."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "quillify"."users"("id") ON DELETE cascade ON UPDATE no action;