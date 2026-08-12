ALTER TABLE "quillify"."books" ADD COLUMN "isbn10" text;--> statement-breakpoint
ALTER TABLE "quillify"."books" ADD COLUMN "isbn13" text;--> statement-breakpoint
ALTER TABLE "quillify"."books" ADD COLUMN "openLibraryWorkId" text;--> statement-breakpoint
ALTER TABLE "quillify"."books" ADD COLUMN "openLibraryEditionId" text;--> statement-breakpoint
CREATE INDEX "books_user_isbn13_index" ON "quillify"."books" USING btree ("userId","isbn13");--> statement-breakpoint
CREATE INDEX "books_user_open_library_edition_index" ON "quillify"."books" USING btree ("userId","openLibraryEditionId");