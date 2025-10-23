/**
 * Get Active Hackathon API
 *
 * Returns the currently active hackathon (if any).
 * Used by the agent to determine which sponsors' documentation to search.
 *
 * GET /api/hackathons/active
 */

import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('[API /hackathons/active] Fetching active hackathon');

    // Get the active hackathon
    const [activeHackathon] = await db
      .select()
      .from(schema.hackathons)
      .where(eq(schema.hackathons.isActive, true))
      .limit(1);

    if (!activeHackathon) {
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
    const sponsorRelations = await db
      .select({
        id: schema.hackathonSponsors.id,
        tier: schema.hackathonSponsors.tier,
        sponsor: schema.sponsors
      })
      .from(schema.hackathonSponsors)
      .innerJoin(schema.sponsors, eq(schema.hackathonSponsors.sponsorId, schema.sponsors.id))
      .where(eq(schema.hackathonSponsors.hackathonId, activeHackathon.id));

    const sponsors = sponsorRelations.map(rel => rel.sponsor);

    // Count indexed sponsors (those with documentCount > 0)
    const indexedSponsors = sponsors.filter(s => s.documentCount && s.documentCount > 0);

    console.log(`[API /hackathons/active] Found: ${activeHackathon.name}`);
    console.log(`[API /hackathons/active] Sponsors: ${sponsors.length} total, ${indexedSponsors.length} indexed`);

    return NextResponse.json({
      success: true,
      hackathon: {
        id: activeHackathon.id,
        name: activeHackathon.name,
        location: activeHackathon.location,
        startDate: activeHackathon.startDate,
        endDate: activeHackathon.endDate,
        description: activeHackathon.description,
        website: activeHackathon.website,
        isActive: activeHackathon.isActive,
        sponsorCount: sponsors.length,
        indexedSponsorCount: indexedSponsors.length,
      },
      sponsors: sponsors.map(s => ({
        id: s.id,
        name: s.name,
        collectionName: s.collectionName,
        category: s.category,
        documentCount: s.documentCount,
        lastIndexedAt: s.lastIndexedAt,
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
