CREATE TABLE "quillify"."book_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"bookId" text NOT NULL,
	"tagId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quillify"."list_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"listId" text NOT NULL,
	"bookId" text NOT NULL,
	"position" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quillify"."lists" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quillify"."tags" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quillify"."up_next_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"bookId" text NOT NULL,
	"position" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quillify"."book_tags" ADD CONSTRAINT "book_tags_bookId_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "quillify"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."book_tags" ADD CONSTRAINT "book_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "quillify"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."list_entries" ADD CONSTRAINT "list_entries_listId_lists_id_fk" FOREIGN KEY ("listId") REFERENCES "quillify"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."list_entries" ADD CONSTRAINT "list_entries_bookId_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "quillify"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."lists" ADD CONSTRAINT "lists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "quillify"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."tags" ADD CONSTRAINT "tags_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "quillify"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."up_next_entries" ADD CONSTRAINT "up_next_entries_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "quillify"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quillify"."up_next_entries" ADD CONSTRAINT "up_next_entries_bookId_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "quillify"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "book_tags_book_tag_unique" ON "quillify"."book_tags" USING btree ("bookId","tagId");--> statement-breakpoint
CREATE INDEX "book_tags_tag_index" ON "quillify"."book_tags" USING btree ("tagId");--> statement-breakpoint
CREATE UNIQUE INDEX "list_entries_list_book_unique" ON "quillify"."list_entries" USING btree ("listId","bookId");--> statement-breakpoint
CREATE INDEX "list_entries_list_position_index" ON "quillify"."list_entries" USING btree ("listId","position");--> statement-breakpoint
CREATE UNIQUE INDEX "lists_user_name_unique" ON "quillify"."lists" USING btree ("userId",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_unique" ON "quillify"."tags" USING btree ("userId",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "up_next_entries_user_book_unique" ON "quillify"."up_next_entries" USING btree ("userId","bookId");--> statement-breakpoint
CREATE INDEX "up_next_entries_user_position_index" ON "quillify"."up_next_entries" USING btree ("userId","position");