CREATE TABLE "hackathon_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hackathon_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"tier" text,
	"prize_amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"description" text,
	"website" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hackathons_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sponsor_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"content_preview" text,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"collection_name" text NOT NULL,
	"description" text,
	"website" text,
	"logo" text,
	"doc_url" text,
	"tech_stack" text[],
	"category" text,
	"tags" text[],
	"document_count" integer DEFAULT 0,
	"last_indexed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sponsors_name_unique" UNIQUE("name"),
	CONSTRAINT "sponsors_collection_name_unique" UNIQUE("collection_name")
);
--> statement-breakpoint
ALTER TABLE "hackathon_sponsors" ADD CONSTRAINT "hackathon_sponsors_hackathon_id_hackathons_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_sponsors" ADD CONSTRAINT "hackathon_sponsors_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_documents" ADD CONSTRAINT "sponsor_documents_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hackathon_sponsor_hackathon_id_idx" ON "hackathon_sponsors" USING btree ("hackathon_id");--> statement-breakpoint
CREATE INDEX "hackathon_sponsor_sponsor_id_idx" ON "hackathon_sponsors" USING btree ("sponsor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_hackathon_sponsor" ON "hackathon_sponsors" USING btree ("hackathon_id","sponsor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_name_idx" ON "hackathons" USING btree ("name");--> statement-breakpoint
CREATE INDEX "is_active_hackathon_idx" ON "hackathons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sponsor_doc_sponsor_id_idx" ON "sponsor_documents" USING btree ("sponsor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_file_per_sponsor" ON "sponsor_documents" USING btree ("sponsor_id","file_name");--> statement-breakpoint
CREATE UNIQUE INDEX "sponsor_name_idx" ON "sponsors" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_name_sponsor_idx" ON "sponsors" USING btree ("collection_name");--> statement-breakpoint
CREATE INDEX "category_idx" ON "sponsors" USING btree ("category");--> statement-breakpoint
CREATE INDEX "is_active_sponsor_idx" ON "sponsors" USING btree ("is_active");