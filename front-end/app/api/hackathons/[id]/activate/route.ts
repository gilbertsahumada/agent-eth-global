/**
 * Activate Hackathon API
 *
 * Sets a hackathon as the active one (for agent queries).
 * Only ONE hackathon can be active at a time.
 *
 * POST /api/hackathons/[id]/activate
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;

    console.log(`[API /hackathons/${hackathonId}/activate] Setting as active hackathon`);

    // 1. Verify hackathon exists
    const { data: hackathon, error: findError } = await supabase
      .from('hackathons')
      .select('*')
      .eq('id', hackathonId)
      .single();

    if (findError || !hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    // 2. Deactivate all hackathons
    const { error: deactivateError } = await supabase
      .from('hackathons')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records

    if (deactivateError) {
      throw deactivateError;
    }

    console.log(`[API /hackathons/${hackathonId}/activate] Deactivated all hackathons`);

    // 3. Activate this hackathon
    const { error: activateError } = await supabase
      .from('hackathons')
      .update({ is_active: true })
      .eq('id', hackathonId);

    if (activateError) {
      throw activateError;
    }

    console.log(`[API /hackathons/${hackathonId}/activate] Activated ${hackathon.name}`);

    // 4. Get sponsor count for this hackathon
    const { data: sponsorRelations, error: sponsorError } = await supabase
      .from('hackathon_sponsors')
      .select('*')
      .eq('hackathon_id', hackathonId);

    if (sponsorError) {
      throw sponsorError;
    }

    return NextResponse.json({
      success: true,
      hackathon: {
        id: hackathon.id,
        name: hackathon.name,
        isActive: true,
        sponsorCount: sponsorRelations?.length || 0,
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
