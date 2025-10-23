/**
 * Get Active Hackathon API
 *
 * Returns the currently active hackathon (if any).
 * Used by the agent to determine which sponsors' documentation to search.
 *
 * GET /api/hackathons/active
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('[API /hackathons/active] Fetching active hackathon');

    // Get the active hackathon
    const { data: activeHackathon, error: hackathonError } = await supabase
      .from('hackathons')
      .select('*')
      .eq('is_active', true)
      .single();

    if (hackathonError || !activeHackathon) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active hackathon found',
          hackathon: null
        },
        { status: 200 } // 200 because it's not an error, just no active hackathon
      );
    }

    // Get sponsors for this hackathon
    const { data: sponsorRelations, error: sponsorError } = await supabase
      .from('hackathon_sponsors')
      .select('id, tier, sponsors(*)')
      .eq('hackathon_id', activeHackathon.id);

    if (sponsorError) {
      throw sponsorError;
    }

    const sponsors = sponsorRelations?.map(rel => rel.sponsors).filter(Boolean) || [];

    // Count indexed sponsors (those with document_count > 0)
    const indexedSponsors = sponsors.filter(s => s.document_count && s.document_count > 0);

    console.log(`[API /hackathons/active] Found: ${activeHackathon.name}`);
    console.log(`[API /hackathons/active] Sponsors: ${sponsors.length} total, ${indexedSponsors.length} indexed`);

    return NextResponse.json({
      success: true,
      hackathon: {
        id: activeHackathon.id,
        name: activeHackathon.name,
        location: activeHackathon.location,
        startDate: activeHackathon.start_date,
        endDate: activeHackathon.end_date,
        description: activeHackathon.description,
        website: activeHackathon.website,
        isActive: activeHackathon.is_active,
        sponsorCount: sponsors.length,
        indexedSponsorCount: indexedSponsors.length,
      },
      sponsors: sponsors.map(s => ({
        id: s.id,
        name: s.name,
        collectionName: s.collection_name,
        category: s.category,
        documentCount: s.document_count,
        lastIndexedAt: s.last_indexed_at,
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('[API /hackathons/active] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch active hackathon',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
