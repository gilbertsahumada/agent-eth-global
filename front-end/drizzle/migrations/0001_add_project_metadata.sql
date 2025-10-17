-- Migration: Add metadata fields to projects table
-- Created: 2024-01-15
-- Purpose: Enable intelligent project routing and multi-project search

-- Add new columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS tech_stack TEXT[],
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_indexed_at TIMESTAMP WITH TIME ZONE;

-- Create index on domain for faster filtering
CREATE INDEX IF NOT EXISTS domain_idx ON projects(domain);

-- Update existing projects with default values (optional, customize as needed)
UPDATE projects
SET
  tech_stack = ARRAY[]::TEXT[],
  tags = ARRAY[]::TEXT[],
  keywords = ARRAY[]::TEXT[],
  document_count = 0
WHERE tech_stack IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN projects.tech_stack IS 'Technologies used in this project (e.g., Solidity, Hardhat)';
COMMENT ON COLUMN projects.domain IS 'Project domain category (e.g., DeFi, NFT, Gaming)';
COMMENT ON COLUMN projects.tags IS 'Searchable tags for categorization';
COMMENT ON COLUMN projects.keywords IS 'Keywords for intelligent routing';
COMMENT ON COLUMN projects.document_count IS 'Number of documents indexed for this project';
COMMENT ON COLUMN projects.last_indexed_at IS 'Timestamp of last indexing operation';
