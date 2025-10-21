/**
 * Query Understanding Agent Client
 *
 * HTTP client for calling the query-understanding-agent deployed on Agentverse.
 *
 * Setup:
 * 1. Deploy query-understanding-agent to Agentverse
 * 2. Get the agent's HTTP endpoint URL (Agentverse provides it)
 * 3. Add to .env.local: QUERY_AGENT_URL=https://xxx.agentverse.ai/understand
 *
 * The agent exposes: POST /understand
 */

// Agent REST endpoint (set in .env.local after Agentverse deployment)
// Format: https://{agent-id}.agentverse.ai/understand
const QUERY_AGENT_URL = process.env.QUERY_AGENT_URL || '';

interface ProjectContext {
  id: string;
  name: string;
  domain?: string;
  tech_stack?: string[];
  keywords?: string[];
}

interface QueryAnalysisRequest {
  query: string;
  available_projects: ProjectContext[];
}

export interface QueryIntent {
  wants_code: boolean;
  languages: string[];
  technologies: string[];
  action: string;
  domain: string;
  relevant_project_ids: string[];
  search_focus: 'code' | 'concepts' | 'procedures' | 'api';
}

/**
 * Calls the query-understanding-agent to analyze user query
 *
 * @param query - User's search query
 * @param availableProjects - List of available projects with metadata
 * @returns Query intent and filters
 */
export async function analyzeQuery(
  query: string,
  availableProjects: ProjectContext[] = []
): Promise<QueryIntent> {
  if (!QUERY_AGENT_URL) {
    throw new Error('QUERY_AGENT_URL environment variable not set. Please deploy the agent to Agentverse first.');
  }

  try {
    console.log(`[QueryAgent] Analyzing query: "${query}"`);
    console.log(`[QueryAgent] Available projects: ${availableProjects.length}`);

    const request: QueryAnalysisRequest = {
      query,
      available_projects: availableProjects
    };

    const response = await fetch(QUERY_AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Query agent returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('[QueryAgent] ✅ Analysis complete');
    console.log(`  - Wants code: ${data.wants_code}`);
    console.log(`  - Languages: ${data.languages?.join(', ') || 'None'}`);
    console.log(`  - Technologies: ${data.technologies?.join(', ') || 'None'}`);
    console.log(`  - Action: ${data.action || 'None'}`);
    console.log(`  - Domain: ${data.domain || 'Any'}`);
    console.log(`  - Relevant projects: ${data.relevant_project_ids?.length || 0}`);
    console.log(`  - Search focus: ${data.search_focus}`);

    return {
      wants_code: data.wants_code || false,
      languages: data.languages || [],
      technologies: data.technologies || [],
      action: data.action || '',
      domain: data.domain || '',
      relevant_project_ids: data.relevant_project_ids || availableProjects.map(p => p.id).slice(0, 5),
      search_focus: data.search_focus || 'concepts'
    };

  } catch (error) {
    console.error('[QueryAgent] ❌ Error:', error);

    // Return default intent on error (search all projects)
    return {
      wants_code: false,
      languages: [],
      technologies: [],
      action: '',
      domain: '',
      relevant_project_ids: availableProjects.map(p => p.id).slice(0, 5),
      search_focus: 'concepts'
    };
  }
}

/**
 * Check if the query agent is configured and reachable
 */
export async function checkQueryAgentHealth(): Promise<boolean> {
  if (!QUERY_AGENT_URL) {
    console.warn('[QueryAgent] Agent URL not configured');
    return false;
  }

  try {
    // Try a minimal request
    const response = await fetch(QUERY_AGENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test',
        available_projects: []
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}
