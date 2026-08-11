CREATE TYPE "quillify"."ownership_type" AS ENUM('unknown', 'owned', 'borrowed', 'library', 'subscription');--> statement-breakpoint
CREATE TYPE "quillify"."reading_format" AS ENUM('print', 'ebook', 'audiobook');--> statement-breakpoint
CREATE TYPE "quillify"."reading_status" AS ENUM('to_read', 'reading', 'paused', 'finished', 'did_not_finish');--> statement-breakpoint
CREATE TABLE "quillify"."reading_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"bookId" text NOT NULL,
	"status" "quillify"."reading_status" DEFAULT 'to_read' NOT NULL,
	"format" "quillify"."reading_format",
	"startedOn" date,
	"endedOn" date,
	"isCurrent" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quillify"."books" ADD COLUMN "ownershipType" "quillify"."ownership_type" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "quillify"."reading_periods" ADD CONSTRAINT "reading_periods_bookId_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "quillify"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reading_periods_current_book_unique" ON "quillify"."reading_periods" USING btree ("bookId") WHERE "quillify"."reading_periods"."isCurrent" = true;--> statement-breakpoint
INSERT INTO "quillify"."reading_periods" (
	"id",
	"bookId",
	"status",
	"format",
	"startedOn",
	"endedOn",
	"isCurrent",
	"createdAt",
	"updatedAt"
)
SELECT
	"id" || ':reading-period:1',
	"id",
	(CASE WHEN "isRead" THEN 'finished' ELSE 'to_read' END)::"quillify"."reading_status",
	NULL,
	NULL,
	NULL,
	true,
	"createdAt",
	"updatedAt"
FROM "quillify"."books";--> statement-breakpoint
ALTER TABLE "quillify"."books" DROP COLUMN "isRead";
