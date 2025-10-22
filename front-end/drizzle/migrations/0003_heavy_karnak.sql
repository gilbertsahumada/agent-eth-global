DROP INDEX "project_id_idx";--> statement-breakpoint
DROP INDEX "unique_file_per_project";--> statement-breakpoint
ALTER TABLE "project_documents" ADD COLUMN "file_size" integer;--> statement-breakpoint
ALTER TABLE "project_documents" ADD COLUMN "content_preview" text;--> statement-breakpoint
CREATE INDEX "project_id_idx" ON "project_documents" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_file_per_project" ON "project_documents" USING btree ("project_id","file_name");--> statement-breakpoint
ALTER TABLE "project_documents" DROP COLUMN "file_path";