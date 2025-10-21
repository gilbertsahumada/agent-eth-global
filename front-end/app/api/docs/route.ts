import { QdrantIntelligentService } from "@/lib/qdrant-intelligent";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const searchText = url.searchParams.get("searchText");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    if (!searchText) {
      return NextResponse.json(
        { error: "searchText query parameter is required" },
        { status: 400 }
      );
    }

    const qdrantService = new QdrantIntelligentService();
    const searchResults = await qdrantService.searchDocuments(projectId, searchText, { limit: 5 });

    return NextResponse.json({
      results: searchResults,
      query: searchText,
      projectId
    }, { status: 200 });

  } catch (error) {
    console.error('[API /docs GET] Error:', error);
    return NextResponse.json(
      { error: `Failed to search documents: ${error}` },
      { status: 500 }
    );
  }
}
