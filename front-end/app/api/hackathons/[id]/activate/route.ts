/**
 * Activate Hackathon API
 *
 * Sets a hackathon as the active one (for agent queries).
 * Only ONE hackathon can be active at a time.
 *
 * POST /api/hackathons/[id]/activate
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;

    console.log(`[API /hackathons/${hackathonId}/activate] Setting as active hackathon`);

    // 1. Verify hackathon exists
    const [hackathon] = await db
      .select()
      .from(schema.hackathons)
      .where(eq(schema.hackathons.id, hackathonId))
      .limit(1);

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    // 2. Deactivate all hackathons
    await db
      .update(schema.hackathons)
      .set({ isActive: false });

    console.log(`[API /hackathons/${hackathonId}/activate] Deactivated all hackathons`);

    // 3. Activate this hackathon
    await db
      .update(schema.hackathons)
      .set({ isActive: true })
      .where(eq(schema.hackathons.id, hackathonId));

    console.log(`[API /hackathons/${hackathonId}/activate] Activated ${hackathon.name}`);

    // 4. Get sponsor count for this hackathon
    const sponsorRelations = await db
      .select()
      .from(schema.hackathonSponsors)
      .where(eq(schema.hackathonSponsors.hackathonId, hackathonId));

    return NextResponse.json({
      success: true,
      hackathon: {
        id: hackathon.id,
        name: hackathon.name,
        isActive: true,
        sponsorCount: sponsorRelations.length,
      },
      message: `${hackathon.name} is now the active hackathon`
    }, { status: 200 });

  } catch (error) {
    console.error('[API /hackathons/[id]/activate] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to activate hackathon',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
