/**
 * Script to check Supabase tables data
 * Run with: npx tsx scripts/check-supabase.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { supabase } from '../lib/supabase';

async function checkSupabase() {
  console.log('🔍 Checking Supabase tables...\n');

  try {
    // Check projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
    } else {
      console.log(`✅ Projects table: ${projects?.length || 0} projects found`);
      if (projects && projects.length > 0) {
        console.log('\n📋 Recent projects:');
        projects.forEach(p => {
          console.log(`  - ${p.name} (${p.id})`);
          console.log(`    Domain: ${p.domain}`);
          console.log(`    Tech Stack: ${p.tech_stack?.join(', ')}`);
          console.log(`    Documents: ${p.document_count}`);
          console.log('');
        });
      }
    }

    // Check project_documents table
    console.log('---\n');
    const { data: documents, error: docsError } = await supabase
      .from('project_documents')
      .select('*')
      .order('indexed_at', { ascending: false })
      .limit(10);

    if (docsError) {
      console.error('❌ Error fetching project_documents:', docsError);
    } else {
      console.log(`✅ Project Documents table: ${documents?.length || 0} documents found`);
      if (documents && documents.length > 0) {
        console.log('\n📄 Recent documents:');
        documents.forEach(doc => {
          console.log(`  - ${doc.file_name}`);
          console.log(`    Project ID: ${doc.project_id}`);
          console.log(`    Path: ${doc.file_path}`);
          console.log(`    Indexed: ${doc.indexed_at}`);
          console.log('');
        });
      } else {
        console.log('\n⚠️  No documents found in project_documents table!');
        console.log('   This table should have one entry per uploaded file.');
      }
    }

    // Count documents per project
    console.log('---\n');
    if (projects && projects.length > 0) {
      console.log('📊 Documents per project:');
      for (const project of projects) {
        const { count, error } = await supabase
          .from('project_documents')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);

        if (!error) {
          console.log(`  - ${project.name}: ${count || 0} documents in DB (should be ${project.document_count})`);
          if (count !== project.document_count) {
            console.log(`    ⚠️  MISMATCH! Expected ${project.document_count} but found ${count}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSupabase().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
