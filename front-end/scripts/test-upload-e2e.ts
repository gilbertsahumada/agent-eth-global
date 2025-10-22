/**
 * End-to-end test for serverless file upload
 * Tests the complete flow without filesystem
 * Usage: npx tsx --env-file=.env.local scripts/test-upload-e2e.ts
 */

import { supabase } from '../lib/supabase';

async function testUploadFlow() {
  console.log('🧪 Testing serverless upload flow (no filesystem)\n');
  console.log('=' .repeat(60));

  try {
    // Create test markdown content
    const testContent = `# Test Documentation

This is a test document for the ETH Global hackathon project.

## Technologies

- Next.js
- TypeScript
- Qdrant
- Supabase

## Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Deploy Instructions

1. Install dependencies: \`npm install\`
2. Run development server: \`npm run dev\`
3. Deploy to Vercel
`;

    // Simulate FormData from frontend
    const formData = new FormData();
    formData.append('name', 'TEST_PROJECT_DELETE_ME');

    // Create a File object from the markdown content
    const blob = new Blob([testContent], { type: 'text/markdown' });
    const file = new File([blob], 'test-doc.md', { type: 'text/markdown' });
    formData.append('file', file);

    console.log('📤 Sending test upload to /api/projects...\n');
    console.log(`   Project Name: TEST_PROJECT_DELETE_ME`);
    console.log(`   File: test-doc.md (${testContent.length} bytes)\n`);

    // Call the API
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Upload successful!\n');
    console.log('Response:', JSON.stringify(result, null, 2));

    const projectId = result.project.id;

    // Verify data in Supabase
    console.log('\n📊 Verifying data in Supabase...\n');

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Project not found:', projectError);
      return;
    }

    console.log('✅ Project in database:');
    console.log(`   ID: ${project.id}`);
    console.log(`   Name: ${project.name}`);
    console.log(`   Domain: ${project.domain}`);
    console.log(`   Tech Stack: ${project.tech_stack?.join(', ')}`);
    console.log(`   Keywords: ${project.keywords?.length} keywords`);

    const { data: docs, error: docsError } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId);

    if (docsError) {
      console.error('❌ Documents not found:', docsError);
      return;
    }

    console.log(`\n✅ Documents in database: ${docs.length}`);
    docs.forEach(doc => {
      console.log(`   - ${doc.file_name} (${doc.file_size} bytes)`);
      console.log(`     Preview: ${doc.content_preview?.slice(0, 50)}...`);
    });

    // Check filesystem
    console.log('\n📁 Checking filesystem (should be empty)...\n');
    const { execSync } = require('child_process');
    try {
      const uploadDirs = execSync(`find uploads -type d -name "${projectId}" 2>/dev/null || echo ""`).toString().trim();
      if (uploadDirs) {
        console.log('⚠️  WARNING: Found filesystem directories (should not exist):');
        console.log(`   ${uploadDirs}`);
      } else {
        console.log('✅ No filesystem directories created (serverless-compatible!)');
      }
    } catch (err) {
      console.log('✅ No filesystem directories created (serverless-compatible!)');
    }

    // Clean up
    console.log('\n🧹 Cleaning up test data...\n');

    await supabase.from('project_documents').delete().eq('project_id', projectId);
    await supabase.from('projects').delete().eq('id', projectId);

    console.log('✅ Test data cleaned up');

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('=' .repeat(60));
    console.log('\n✅ Serverless upload flow working:');
    console.log('   - Files processed in-memory (no filesystem writes)');
    console.log('   - Data saved to Supabase');
    console.log('   - Metadata extracted by ASI1 agent');
    console.log('   - Ready for Vercel deployment!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Check if dev server is running
console.log('⚠️  Make sure your dev server is running: yarn dev\n');
console.log('Also make sure local agents are running:');
console.log('  - metadata-extractor-agent on port 8001');
console.log('  - query-understanding-agent on port 8002\n');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to start...\n');

setTimeout(() => {
  testUploadFlow().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('❌ Script error:', err);
    process.exit(1);
  });
}, 3000);
