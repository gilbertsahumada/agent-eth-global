/**
 * Metadata Extractor Agent Client
 *
 * HTTP client for calling the metadata-extractor-agent deployed on Agentverse.
 *
 * Setup:
 * 1. Deploy metadata-extractor-agent to Agentverse
 * 2. Get the agent's HTTP endpoint URL (Agentverse provides it)
 * 3. Add to .env.local: METADATA_AGENT_URL=https://xxx.agentverse.ai/analyze
 *
 * The agent exposes: POST /analyze
 */

// Agent REST endpoint (set in .env.local after Agentverse deployment)
// Format: https://{agent-id}.agentverse.ai/analyze
const METADATA_AGENT_URL = process.env.METADATA_AGENT_URL || '';

interface MarkdownAnalysisRequest {
  markdown_content: string;
  file_name: string;
}

interface CodeSnippet {
  language: string;
  code: string;
  context: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ExtractedMetadata {
  tech_stack: string[];
  domain: string;
  keywords: string[];
  languages: string[];
  description: string;
  code_snippets: CodeSnippet[];
}

/**
 * Calls the metadata-extractor-agent to analyze markdown content
 *
 * @param markdownContent - The markdown text to analyze
 * @param fileName - Original filename for context
 * @returns Extracted metadata
 */
export async function extractMetadata(
  markdownContent: string,
  fileName: string = 'document.md'
): Promise<ExtractedMetadata> {
  if (!METADATA_AGENT_URL) {
    throw new Error('METADATA_AGENT_URL environment variable not set. Please deploy the agent to Agentverse first.');
  }

  try {
    console.log(`[MetadataAgent] Analyzing ${fileName} (${markdownContent.length} chars)`);

    const request: MarkdownAnalysisRequest = {
      markdown_content: markdownContent,
      file_name: fileName
    };

    const response = await fetch(METADATA_AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Metadata agent returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('[MetadataAgent] ✅ Analysis complete');
    console.log(`  - Tech Stack: ${data.tech_stack?.length || 0} items`);
    console.log(`  - Domain: ${data.domain || 'Unknown'}`);
    console.log(`  - Keywords: ${data.keywords?.length || 0} items`);
    console.log(`  - Languages: ${data.languages?.join(', ') || 'None'}`);
    console.log(`  - Code Snippets: ${data.code_snippets?.length || 0} items`);

    return {
      tech_stack: data.tech_stack || [],
      domain: data.domain || 'Other',
      keywords: data.keywords || [],
      languages: data.languages || [],
      description: data.description || '',
      code_snippets: data.code_snippets || []
    };

  } catch (error) {
    console.error('[MetadataAgent] ❌ Error calling agent:', error);
    console.error('[MetadataAgent] Agent URL:', METADATA_AGENT_URL);
    console.error('[MetadataAgent] Make sure the agent is running on port 8001');

    // Return empty metadata on error (fallback)
    console.warn('[MetadataAgent] ⚠️ Returning empty metadata as fallback');
    return {
      tech_stack: [],
      domain: 'Other',
      keywords: [],
      languages: [],
      description: '',
      code_snippets: []
    };
  }
}

/**
 * Check if the metadata agent is configured and reachable
 */
export async function checkMetadataAgentHealth(): Promise<boolean> {
  if (!METADATA_AGENT_URL) {
    console.warn('[MetadataAgent] Agent URL not configured');
    return false;
  }

  try {
    // Try a minimal request
    const response = await fetch(METADATA_AGENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown_content: '# Test',
        file_name: 'test.md'
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}
