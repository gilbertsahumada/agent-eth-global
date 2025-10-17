# 🔄 Migration Guide - Database Schema Update

## Overview
This guide covers the database schema changes for the multi-agent system enhancement.

## Changes Made

### 1. Database Schema (PostgreSQL/Supabase)

**New fields added to `projects` table:**
- `tech_stack` (text[]) - Array of technologies used
- `domain` (text) - Project domain/category
- `tags` (text[]) - Searchable tags
- `keywords` (text[]) - Keywords for intelligent routing
- `document_count` (integer) - Number of indexed documents
- `last_indexed_at` (timestamp) - Last indexing timestamp

### 2. API Endpoint
- Updated `/api/projects` POST endpoint to accept and store metadata
- Created new `/api/docs/multi-search` POST endpoint for parallel search

### 3. Frontend
- Updated TypeScript interfaces
- Created enhanced form component (optional)

---

## Migration Steps

### Step 1: Run Database Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the content from `front-end/drizzle/migrations/0001_add_project_metadata.sql`
4. Execute the query

**Option B: Via Command Line (if using local Postgres)**

```bash
cd front-end
psql -U your_user -d your_database -f drizzle/migrations/0001_add_project_metadata.sql
```

**Verification:**

Run this query to verify the migration:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

You should see the new columns: `tech_stack`, `domain`, `tags`, `keywords`, `document_count`, `last_indexed_at`

### Step 2: Update Existing Projects (Optional)

If you have existing projects, you can update them with metadata:

```sql
-- Example: Update a specific project
UPDATE projects
SET
  tech_stack = ARRAY['Solidity', 'Hardhat'],
  domain = 'Smart Contracts',
  tags = ARRAY['deployment', 'testing'],
  keywords = ARRAY['deploy', 'compile', 'test'],
  document_count = 1
WHERE name = 'your-project-name';

-- Or update all projects with defaults
UPDATE projects
SET
  tech_stack = ARRAY[]::TEXT[],
  tags = ARRAY[]::TEXT[],
  keywords = ARRAY[]::TEXT[],
  document_count = 1,
  last_indexed_at = NOW()
WHERE tech_stack IS NULL;
```

### Step 3: Deploy Updated Code

**Backend (Next.js API):**

```bash
cd front-end
yarn build
# Deploy to Vercel
vercel --prod
```

**Test the API:**

```bash
# Test multi-search endpoint
curl -X POST https://your-app.vercel.app/api/docs/multi-search \
  -H "Content-Type: application/json" \
  -d '{
    "projectIds": ["project-id-1", "project-id-2"],
    "searchText": "how to deploy",
    "topK": 5
  }'
```

---

## UI Options

### Option 1: Keep Simple Form (Current)

**No changes needed!** The current form will continue to work. New fields will use default values:
- `tech_stack`: `[]`
- `domain`: `null`
- `tags`: `[]`
- `keywords`: `[]`

### Option 2: Use Enhanced Form (Recommended for Hackathon)

Replace the content of `front-end/app/page.tsx` with:

```tsx
'use client';

import EnhancedProjectForm from './components/EnhancedProjectForm';
import { HiDocumentText } from 'react-icons/hi2';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-2">
            <HiDocumentText className="text-4xl text-blue-500" />
            <h1 className="text-3xl font-bold text-white">
              Index Documentation
            </h1>
          </div>
          <p className="text-gray-400 mb-8">
            Upload documentation with metadata for intelligent multi-agent routing
          </p>

          <EnhancedProjectForm />
        </div>
      </div>
    </div>
  );
}
```

---

## Backward Compatibility

✅ **All existing code will continue to work without changes!**

- Existing projects: Will have `NULL` or empty values for new fields
- API calls: Old requests (without metadata) still work fine
- Agents: Will handle missing metadata gracefully

---

## Testing Checklist

### Database
- [ ] Migration executed successfully
- [ ] New columns visible in database
- [ ] Existing projects still loadable

### API
- [ ] POST /api/projects accepts metadata (optional)
- [ ] POST /api/projects works without metadata (backward compatible)
- [ ] POST /api/docs/multi-search returns results
- [ ] GET /api/projects returns new fields

### Frontend
- [ ] Projects list page loads correctly
- [ ] New project form works (simple or enhanced)
- [ ] Projects display metadata (if using enhanced UI)

---

## Rollback Plan

If you need to rollback:

```sql
-- Remove new columns (WARNING: This deletes data!)
ALTER TABLE projects
DROP COLUMN tech_stack,
DROP COLUMN domain,
DROP COLUMN tags,
DROP COLUMN keywords,
DROP COLUMN document_count,
DROP COLUMN last_indexed_at;

DROP INDEX IF EXISTS domain_idx;
```

---

## Next Steps

After migration:

1. ✅ Test uploading a new project with metadata
2. ✅ Test multi-search API endpoint
3. ✅ Deploy agents (Phase 2)
4. ✅ Test full multi-agent flow

---

## Troubleshooting

### "Column does not exist" error

**Problem:** API returns error about missing column

**Solution:**
1. Verify migration ran successfully
2. Check Supabase dashboard for column existence
3. Restart your Next.js dev server

### Type errors in TypeScript

**Problem:** TypeScript complains about missing properties

**Solution:**
1. Run `yarn types:generate` (if using Supabase types)
2. Or manually update the `Project` interface as shown in this migration

### Metadata not saving

**Problem:** New fields stay empty/null

**Solution:**
1. Check browser console for FormData errors
2. Verify API is parsing JSON arrays correctly
3. Check Supabase logs for insert errors

---

## Support

If you encounter issues:
1. Check `ARCHITECTURE.md` for detailed system design
2. Review error logs in Supabase dashboard
3. Verify all migration steps were completed

**Migration Version:** 0001
**Date:** 2024-01-15
**Breaking Changes:** None (fully backward compatible)
