/**
 * Smart Search API - ASI1 Powered Query Understanding
 *
 * Endpoint for intelligent document search with dynamic filtering.
 * Uses query-understanding-agent to extract intent and build filters on-the-fly.
 *
 * POST /api/docs/smart-search
 * Body: {
 *   query: string,
 *   limit?: number,
 *   includeInactive?: boolean
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { QdrantIntelligentService } from "@/lib/qdrant-intelligent";
import { supabase } from "@/lib/supabase";
import { analyzeQuery } from "@/lib/agents/query-agent-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, limit = 10, includeInactive = false } = body;

    // Validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: "query is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "limit must be a number between 1 and 50" },
        { status: 400 }
      );
    }

    console.log(`[SmartSearch] Query: "${query}"`);
    console.log(`[SmartSearch] Limit: ${limit}`);

    // 1. Get available projects from database
    let projectsQuery = supabase.from('projects').select('*');

    if (!includeInactive) {
      projectsQuery = projectsQuery.eq('is_active', true);
    }

    const { data: projects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      console.error('[SmartSearch] Database error:', projectsError);
      return NextResponse.json(
        { error: `Failed to fetch projects: ${projectsError.message}` },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        results: [],
        totalResults: 0,
        query,
        message: "No projects indexed yet"
      }, { status: 200 });
    }

    console.log(`[SmartSearch] Found ${projects.length} active project(s)`);

    // 2. Call query-understanding-agent to analyze query intent
    console.log(`[SmartSearch] Calling query-agent to understand intent...`);

    const projectContexts = projects.map(p => ({
      id: p.id,
      name: p.name,
      domain: p.domain || '',
      tech_stack: p.tech_stack || [],
      keywords: p.keywords || []
    }));

    const queryIntent = await analyzeQuery(query, projectContexts);

    console.log(`[SmartSearch] Query intent extracted:`);
    console.log(`  - Wants code: ${queryIntent.wants_code}`);
    console.log(`  - Languages: ${queryIntent.languages.join(', ') || 'None'}`);
    console.log(`  - Technologies: ${queryIntent.technologies.join(', ') || 'None'}`);
    console.log(`  - Action: ${queryIntent.action || 'None'}`);
    console.log(`  - Domain: ${queryIntent.domain || 'Any'}`);
    console.log(`  - Relevant projects: ${queryIntent.relevant_project_ids.length}`);
    console.log(`  - Search focus: ${queryIntent.search_focus}`);

    // 3. Search only in relevant projects
    const relevantProjectIds = queryIntent.relevant_project_ids.length > 0
      ? queryIntent.relevant_project_ids
      : projects.map(p => p.id);

    console.log(`[SmartSearch] Searching in ${relevantProjectIds.length} project(s)`);

    // 4. Build dynamic filters for Qdrant based on intent
    const qdrantFilters: any = {};

    if (queryIntent.wants_code) {
      qdrantFilters.hasCode = true;
    }

    if (queryIntent.languages.length > 0) {
      qdrantFilters.codeLanguage = queryIntent.languages[0]; // Primary language
    }

    // Note: chunkType filter can be added based on search_focus
    // - code → ChunkType.CODE_SNIPPET
    // - procedures → ChunkType.PROCEDURE
    // - api → ChunkType.API_REFERENCE
    // - concepts → ChunkType.CONCEPT

    console.log(`[SmartSearch] Applying filters:`, qdrantFilters);

    // 5. Search across relevant projects with dynamic filters
    const qdrantService = new QdrantIntelligentService();
    const allResults = [];

    for (const projectId of relevantProjectIds) {
      try {
        const results = await qdrantService.searchDocuments(
          projectId,
          query,
          {
            limit: Math.ceil(limit / relevantProjectIds.length), // Distribute limit across projects
            filter: Object.keys(qdrantFilters).length > 0 ? qdrantFilters : undefined
          }
        );

        // Enrich with project info
        const project = projects.find(p => p.id === projectId);
        const enrichedResults = results.map(r => ({
          ...r,
          projectId,
          projectName: project?.name || 'Unknown',
          projectDomain: project?.domain,
          projectTechStack: project?.tech_stack || []
        }));

        allResults.push(...enrichedResults);
      } catch (error) {
        console.error(`[SmartSearch] Error searching project ${projectId}:`, error);
        // Continue with other projects
      }
    }

    // 6. Sort by relevance score and limit
    allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    const topResults = allResults.slice(0, limit);

    console.log(`[SmartSearch] Found ${allResults.length} total results, returning top ${topResults.length}`);

    // 7. Return results with metadata
    return NextResponse.json({
      results: topResults,
      totalResults: allResults.length,
      query,
      queryIntent: {
        wantsCode: queryIntent.wants_code,
        languages: queryIntent.languages,
        technologies: queryIntent.technologies,
        action: queryIntent.action,
        domain: queryIntent.domain,
        searchFocus: queryIntent.search_focus
      },
      appliedFilters: qdrantFilters,
      projectsSearched: relevantProjectIds.length
    }, { status: 200 });

  } catch (error) {
    console.error('[SmartSearch] Error:', error);
    return NextResponse.json(
      {
        error: "Failed to perform smart search",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/health check
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/docs/smart-search",
    description: "Intelligent document search with ASI1-powered query understanding",
    usage: {
      method: "POST",
      body: {
        query: "string (required) - Your search query",
        limit: "number (optional, 1-50, default: 10) - Max results",
        includeInactive: "boolean (optional, default: false) - Include inactive projects"
      }
    },
    example: {
      query: "How to deploy a VRF contract with Hardhat?",
      limit: 10
    },
    features: [
      "Automatic query intent understanding (ASI1-powered)",
      "Dynamic filter generation based on query",
      "Multi-project intelligent routing",
      "Code vs concept detection",
      "Technology and language filtering",
      "Relevance-based ranking"
    ]
  });
}
