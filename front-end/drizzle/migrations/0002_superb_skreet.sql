ALTER TABLE "projects" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "is_active_idx" ON "projects" USING btree ("is_active");