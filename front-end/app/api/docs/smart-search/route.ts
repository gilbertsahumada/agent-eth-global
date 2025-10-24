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
    console.log('[SmartSearch] Received request body:', JSON.stringify(body));

    const { query, limit = 10, includeInactive = false } = body;

    // Validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.error('[SmartSearch] Validation failed - Invalid query:', {
        query,
        type: typeof query,
        isEmpty: !query,
        isString: typeof query === 'string',
        trimmedLength: query ? query.trim().length : 0
      });
      return NextResponse.json(
        { error: "query is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 50) {
      console.error('[SmartSearch] Validation failed - Invalid limit:', {
        limit,
        type: typeof limit,
        isNumber: typeof limit === 'number',
        value: limit
      });
      return NextResponse.json(
        { error: "limit must be a number between 1 and 50" },
        { status: 400 }
      );
    }

    console.log(`[SmartSearch] Query: "${query}"`);
    console.log(`[SmartSearch] Limit: ${limit}`);

    // 1. Get active hackathon from database
    const { data: activeHackathon, error: hackathonError } = await supabase
      .from('hackathons')
      .select('*')
      .eq('is_active', true)
      .single();

    if (hackathonError || !activeHackathon) {
      return NextResponse.json({
        results: [],
        totalResults: 0,
        query,
        message: "No active hackathon found. Please set an active hackathon first.",
        error: "NO_ACTIVE_HACKATHON"
      }, { status: 200 });
    }

    console.log(`[SmartSearch] Active hackathon: ${activeHackathon.name}`);

    // 2. Get sponsors for this hackathon
    const { data: sponsorRelations, error: sponsorError } = await supabase
      .from('hackathon_sponsors')
      .select('sponsors(*)')
      .eq('hackathon_id', activeHackathon.id);

    if (sponsorError) {
      throw sponsorError;
    }

    const sponsors = sponsorRelations?.map(rel => rel.sponsors).filter(Boolean) || [];

    // Filter only active sponsors with indexed documents
    const indexedSponsors = sponsors.filter(s =>
      s.is_active && s.document_count && s.document_count > 0
    );

    if (indexedSponsors.length === 0) {
      return NextResponse.json({
        results: [],
        totalResults: 0,
        query,
        message: `No indexed sponsors found for ${activeHackathon.name}. Please index sponsor documentation first.`,
        hackathon: {
          id: activeHackathon.id,
          name: activeHackathon.name
        }
      }, { status: 200 });
    }

    console.log(`[SmartSearch] Found ${indexedSponsors.length} indexed sponsor(s) for ${activeHackathon.name}`);

    // 3. Call query-understanding-agent to analyze query intent
    console.log(`[SmartSearch] Calling query-agent to understand intent...`);

    const sponsorContexts = indexedSponsors.map(s => ({
      id: s.id,
      name: s.name,
      domain: s.category || 'Other',
      tech_stack: s.tech_stack || [],
      keywords: s.tags || []
    }));

    const queryIntent = await analyzeQuery(query, sponsorContexts);

    console.log(`[SmartSearch] Query intent extracted:`);
    console.log(`  - Wants code: ${queryIntent.wants_code}`);
    console.log(`  - Languages: ${queryIntent.languages.join(', ') || 'None'}`);
    console.log(`  - Technologies: ${queryIntent.technologies.join(', ') || 'None'}`);
    console.log(`  - Action: ${queryIntent.action || 'None'}`);
    console.log(`  - Domain: ${queryIntent.domain || 'Any'}`);
    console.log(`  - Relevant sponsors: ${queryIntent.relevant_project_ids.length}`);
    console.log(`  - Search focus: ${queryIntent.search_focus}`);

    // 4. Determine which sponsors to search
    const relevantSponsorIds = queryIntent.relevant_project_ids.length > 0
      ? queryIntent.relevant_project_ids
      : indexedSponsors.map(s => s.id);

    const relevantSponsors = indexedSponsors.filter(s =>
      relevantSponsorIds.includes(s.id)
    );

    console.log(`[SmartSearch] Searching in ${relevantSponsors.length} sponsor(s)`);

    // 5. Build dynamic filters for Qdrant based on intent
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

    // 6. Search across relevant sponsors in parallel (optimized!)
    const qdrantService = new QdrantIntelligentService();

    // Get collection names for all relevant sponsors
    const collectionNames = relevantSponsors.map(s => s.collection_name);

    console.log(`[SmartSearch] Searching collections:`, collectionNames);

    // Use new parallel search method
    const allResults = await qdrantService.searchMultipleCollections(
      collectionNames,
      query,
      {
        limit,
        filter: Object.keys(qdrantFilters).length > 0 ? qdrantFilters : undefined
      }
    );

    // Enrich results with sponsor info
    const enrichedResults = allResults.map(r => {
      const sponsor = relevantSponsors.find(s => s.collection_name === r.collectionName);
      return {
        ...r,
        sponsorId: sponsor?.id || 'Unknown',
        sponsorName: sponsor?.name || 'Unknown',
        sponsorCategory: sponsor?.category,
        sponsorTechStack: sponsor?.tech_stack || []
      };
    });

    console.log(`[SmartSearch] Found ${enrichedResults.length} results from ${relevantSponsors.length} sponsors`);

    // 7. Return results with metadata
    return NextResponse.json({
      results: enrichedResults,
      totalResults: enrichedResults.length,
      query,
      hackathon: {
        id: activeHackathon.id,
        name: activeHackathon.name,
        location: activeHackathon.location,
      },
      queryIntent: {
        wantsCode: queryIntent.wants_code,
        languages: queryIntent.languages,
        technologies: queryIntent.technologies,
        action: queryIntent.action,
        domain: queryIntent.domain,
        searchFocus: queryIntent.search_focus
      },
      appliedFilters: qdrantFilters,
      sponsorsSearched: relevantSponsors.length,
      sponsorNames: relevantSponsors.map(s => s.name)
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
    description: "Intelligent document search with ASI1-powered query understanding - searches only in active hackathon's sponsors",
    usage: {
      method: "POST",
      body: {
        query: "string (required) - Your search query",
        limit: "number (optional, 1-50, default: 10) - Max results",
        includeInactive: "boolean (optional, default: false) - Include inactive sponsors"
      }
    },
    example: {
      query: "How to deploy a Chainlink VRF contract?",
      limit: 10
    },
    features: [
      "Automatic query intent understanding (ASI1-powered)",
      "Dynamic filter generation based on query",
      "Multi-sponsor parallel search (optimized)",
      "Active hackathon filtering (transparent)",
      "Code vs concept detection",
      "Technology and language filtering",
      "Relevance-based ranking"
    ],
    note: "Only searches in sponsors of the currently active hackathon. Set an active hackathon first using POST /api/hackathons/[id]/activate"
  });
}
