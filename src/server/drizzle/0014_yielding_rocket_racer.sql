CREATE TYPE "quillify"."import_source" AS ENUM('goodreads');--> statement-breakpoint
CREATE TABLE "quillify"."book_import_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"bookId" text NOT NULL,
	"source" "quillify"."import_source" NOT NULL,
	"sourceRecordId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quillify"."book_import_sources" ADD CONSTRAINT "book_import_sources_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "quillify"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."book_import_sources" ADD CONSTRAINT "book_import_sources_bookId_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "quillify"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "book_import_sources_user_source_record_unique" ON "quillify"."book_import_sources" USING btree ("userId","source","sourceRecordId");--> statement-breakpoint
CREATE INDEX "book_import_sources_book_index" ON "quillify"."book_import_sources" USING btree ("bookId");