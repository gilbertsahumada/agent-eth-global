/**
 * Documentation Status API
 *
 * Returns the availability of indexed documentation for the agent.
 * Checks for active hackathon and indexed sponsors.
 *
 * GET /api/docs/status
 * Response: {
 *   hasDocumentation: boolean,
 *   hackathon?: { id, name, isActive },
 *   sources: { sponsors: number, projects: number }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // 1. Get active hackathon
    const { data: activeHackathon, error: hackathonError } = await supabase
      .from("hackathons")
      .select("*")
      .eq("is_active", true)
      .single();

    if (hackathonError || !activeHackathon) {
      return NextResponse.json(
        {
          hasDocumentation: false,
          hackathon: null,
          sources: {
            sponsors: 0,
            projects: 0,
          },
          message: "No active hackathon found. Please set an active hackathon first.",
        },
        { status: 200 }
      );
    }

    // 2. Get sponsors for this hackathon
    const { data: sponsorRelations, error: sponsorError } = await supabase
      .from("hackathon_sponsors")
      .select("sponsors(*)")
      .eq("hackathon_id", activeHackathon.id);

    if (sponsorError) {
      throw sponsorError;
    }

    const sponsors = sponsorRelations?.map((rel) => rel.sponsors).filter(Boolean) || [];

    // Filter only active sponsors with indexed documents
    const indexedSponsors = sponsors.filter(
      (s) => s.is_active && s.document_count && s.document_count > 0
    );

    // 3. Get user projects with indexed documents (for future use)
    const { data: indexedProjects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, document_count")
      .eq("is_active", true)
      .gt("document_count", 0);

    const projectCount = indexedProjects?.length || 0;

    // Return status
    const hasDocumentation = indexedSponsors.length > 0 || projectCount > 0;

    return NextResponse.json(
      {
        hasDocumentation,
        hackathon: {
          id: activeHackathon.id,
          name: activeHackathon.name,
          isActive: activeHackathon.is_active,
          location: activeHackathon.location,
        },
        sources: {
          sponsors: indexedSponsors.length,
          projects: projectCount,
        },
        sponsorList: indexedSponsors.map((s) => ({
          id: s.id,
          name: s.name,
          documentCount: s.document_count,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /docs/status GET] Error:", error);
    return NextResponse.json(
      { error: `Failed to get documentation status: ${error}` },
      { status: 500 }
    );
  }
}
