ALTER TABLE "projects" ADD COLUMN "tech_stack" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "domain" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "keywords" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "document_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "last_indexed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "domain_idx" ON "projects" USING btree ("domain");