/**
 * Test Supabase insert directly
 * Run with: npx tsx --env-file=.env.local scripts/test-insert.ts
 */

import { supabase } from '../lib/supabase';
import { randomUUID } from 'crypto';

async function testInsert() {
  console.log('🧪 Testing Supabase inserts...\n');

  const testProjectId = randomUUID();
  const testData = {
    id: testProjectId,
    name: 'TEST_PROJECT_DELETE_ME',
    collection_name: `test_${testProjectId.replace(/-/g, '_')}`,
    description: 'Test project - safe to delete',
    tech_stack: ['JavaScript', 'TypeScript'],
    domain: 'Tools',
    tags: ['test'],
    keywords: ['test', 'debug'],
    document_count: 1,
    is_active: true,
    last_indexed_at: new Date().toISOString()
  };

  console.log('📝 Attempting to insert into projects table...');
  console.log('Data:', JSON.stringify(testData, null, 2));

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert(testData)
    .select()
    .single();

  if (projectError) {
    console.error('\n❌ ERROR inserting project:', projectError);
    console.error('   Code:', projectError.code);
    console.error('   Message:', projectError.message);
    console.error('   Details:', projectError.details);
    console.error('   Hint:', projectError.hint);
    return;
  }

  console.log('\n✅ Project inserted successfully!');
  console.log('   ID:', project.id);
  console.log('   Name:', project.name);

  // Try inserting a document
  console.log('\n📄 Attempting to insert into project_documents table...');

  const docData = {
    project_id: testProjectId,
    file_path: '/test/path/file.md',
    file_name: 'test-file.md'
  };

  console.log('Data:', JSON.stringify(docData, null, 2));

  const { data: doc, error: docError } = await supabase
    .from('project_documents')
    .insert(docData)
    .select()
    .single();

  if (docError) {
    console.error('\n❌ ERROR inserting document:', docError);
    console.error('   Code:', docError.code);
    console.error('   Message:', docError.message);
    console.error('   Details:', docError.details);
    console.error('   Hint:', docError.hint);
  } else {
    console.log('\n✅ Document inserted successfully!');
    console.log('   ID:', doc.id);
    console.log('   File:', doc.file_name);
    console.log('   Path:', doc.file_path);
  }

  // Clean up
  console.log('\n🧹 Cleaning up test data...');

  // Delete document first (FK constraint)
  if (!docError) {
    await supabase.from('project_documents').delete().eq('project_id', testProjectId);
  }

  // Delete project
  await supabase.from('projects').delete().eq('id', testProjectId);

  console.log('✅ Test data deleted');
}

testInsert().then(() => {
  console.log('\n✅ Test complete!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
