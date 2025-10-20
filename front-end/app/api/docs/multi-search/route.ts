import { QdrantIntelligentService } from "@/lib/qdrant-intelligent";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// @

/**
 * POST /api/docs/multi-search
 *
 * Performs parallel vector search across multiple project collections in Qdrant.
 * This is optimized for multi-agent systems where multiple projects need to be searched simultaneously.
 *
 * Request Body:
 * {
 *   "projectIds": ["uuid1", "uuid2", "uuid3"],
 *   "searchText": "how to deploy smart contract",
 *   "topK": 5  // optional, defaults to 5
 * }
 *
 * Response:
 * {
 *   "results": [
 *     {
 *       "content": "...",
 *       "projectId": "uuid1",
 *       "projectName": "Hardhat Docs",
 *       "filePath": "...",
 *       "chunkIndex": 0,
 *       "score": 0.95,
 *       "metadata": {}
 *     }
 *   ],
 *   "totalResults": 15,
 *   "projectsSearched": ["Hardhat Docs", "Solidity Docs"],
 *   "searchTimeMs": 234
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectIds, searchText, topK = 5 } = body;

    // Validation
    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: "projectIds array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!searchText || typeof searchText !== 'string' || searchText.trim().length === 0) {
      return NextResponse.json(
        { error: "searchText is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof topK !== 'number' || topK < 1 || topK > 50) {
      return NextResponse.json(
        { error: "topK must be a number between 1 and 50" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Fetch project details from database
    const { data: projectDetails, error: dbError } = await supabase
      .from('projects')
      .select('id, name, domain, tech_stack')
      .in('id', projectIds);

    if (dbError) {
      console.error('[multi-search] Database error:', dbError);
      return NextResponse.json(
        { error: `Failed to fetch project details: ${dbError}` },
        { status: 500 }
      );
    }

    if (!projectDetails || projectDetails.length === 0) {
      return NextResponse.json(
        { error: "No valid projects found for the provided IDs" },
        { status: 404 }
      );
    }
    // Create a map for quick project name lookup
    const projectMap = new Map(
      projectDetails.map((p: any) => [p.id, {
        name: p.name,
        domain: p.domain,
        techStack: p.tech_stack
      }])
    );

    // Initialize Qdrant service with intelligent semantic search
    const qdrantService = new QdrantIntelligentService();

    // Perform parallel searches across all projects
    const searchPromises = projectIds.map(async (projectId) => {
      try {
        const results = await qdrantService.searchDocuments(
          projectId,
          searchText,
          { limit: topK }
        );

        // Enrich results with project information and maintain backward compatibility
        return results.map(r => ({
          content: r.content,
          filePath: r.metadata?.filePath || '', // Extract from nested metadata
          chunkIndex: 0, // Not used in intelligent service, set to 0 for compatibility
          metadata: r.metadata?.frontmatter || {},
          score: r.score,
          // New intelligent features
          type: r.type,
          hierarchy: r.hierarchy,
          language: r.language,
          section: r.section,
          hasCode: r.hasCode,
          keywords: r.keywords,
          importance: r.importance,
          // Project enrichment
          projectId,
          projectName: projectMap.get(projectId)?.name || "Unknown",
          projectDomain: projectMap.get(projectId)?.domain || null,
          projectTechStack: projectMap.get(projectId)?.techStack || []
        }));
      } catch (error) {
        console.error(`[multi-search] Error searching project ${projectId}:`, error);
        // Return empty array for failed searches instead of crashing
        return [];
      }
    });

    // Wait for all searches to complete
    const allResults = await Promise.all(searchPromises);

    // Flatten results and filter out empty arrays
    const flatResults = allResults.flat();

    // Sort by relevance score (highest first)
    flatResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Calculate search time
    const searchTimeMs = Date.now() - startTime;

    // Get unique project names that returned results
    const projectsWithResults = Array.from(
      new Set(flatResults.map(r => r.projectName))
    );

    // Build response
    return NextResponse.json({
      results: flatResults,
      totalResults: flatResults.length,
      projectsSearched: projectsWithResults,
      searchTimeMs,
      query: searchText,
      topKPerProject: topK
    }, { status: 200 });

  } catch (error) {
    console.error('[API /docs/multi-search POST] Error:', error);
    return NextResponse.json(
      {
        error: "Failed to perform multi-search",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/docs/multi-search
 *
 * Returns information about the multi-search endpoint.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/docs/multi-search",
    description: "Performs parallel vector search across multiple project collections",
    parameters: {
      projectIds: "Array of project UUIDs to search",
      searchText: "The search query text",
      topK: "Number of results per project (1-50, default: 5)"
    },
    example: {
      projectIds: ["uuid1", "uuid2"],
      searchText: "how to deploy smart contract",
      topK: 5
    }
  });
}
