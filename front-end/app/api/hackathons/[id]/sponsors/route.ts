import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET sponsors for a hackathon
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: hackathonId } = await params;

        // Get all sponsor relationships for this hackathon
        const { data: relationships, error } = await supabase
            .from('hackathon_sponsors')
            .select('id, tier, prize_amount, created_at, sponsors(*)')
            .eq('hackathon_id', hackathonId);

        if (error) {
            throw error;
        }

        // Transform to camelCase
        const transformedRelationships = relationships?.map(rel => ({
            id: rel.id,
            tier: rel.tier,
            prizeAmount: rel.prize_amount,
            createdAt: rel.created_at,
            sponsors: rel.sponsors ? {
                id: rel.sponsors.id,
                name: rel.sponsors.name,
                collectionName: rel.sponsors.collection_name,
                description: rel.sponsors.description,
                website: rel.sponsors.website,
                logo: rel.sponsors.logo,
                docUrl: rel.sponsors.doc_url,
                techStack: rel.sponsors.tech_stack,
                category: rel.sponsors.category,
                tags: rel.sponsors.tags,
                documentCount: rel.sponsors.document_count,
                lastIndexedAt: rel.sponsors.last_indexed_at,
                isActive: rel.sponsors.is_active,
                createdAt: rel.sponsors.created_at,
                updatedAt: rel.sponsors.updated_at,
            } : null
        })) || [];

        return NextResponse.json({
            sponsors: transformedRelationships,
            count: transformedRelationships.length
        }, { status: 200 });

    } catch (error) {
        console.error('[API /hackathons/:id/sponsors GET] Error:', error);
        return NextResponse.json(
            { error: `Failed to fetch sponsors: ${error}` },
            { status: 500 }
        );
    }
}

// POST add a sponsor to a hackathon
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: hackathonId } = await params;
        const body = await req.json();
        const { sponsorId, tier, prizeAmount } = body;

        // Validations
        if (!sponsorId) {
            return NextResponse.json(
                { error: "sponsorId is required" },
                { status: 400 }
            );
        }

        // Check if relationship already exists
        const { data: existing, error: checkError } = await supabase
            .from('hackathon_sponsors')
            .select('*')
            .eq('hackathon_id', hackathonId)
            .eq('sponsor_id', sponsorId);

        if (checkError) {
            throw checkError;
        }

        if (existing && existing.length > 0) {
            return NextResponse.json(
                { error: "Sponsor already added to this hackathon" },
                { status: 400 }
            );
        }

        const { data: relationship, error: insertError } = await supabase
            .from('hackathon_sponsors')
            .insert({
                hackathon_id: hackathonId,
                sponsor_id: sponsorId,
                tier,
                prize_amount: prizeAmount,
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json({
            message: "Sponsor added to hackathon successfully",
            relationship
        }, { status: 201 });

    } catch (error) {
        console.error('[API /hackathons/:id/sponsors POST] Error:', error);
        return NextResponse.json(
            { error: `Failed to add sponsor: ${error}` },
            { status: 500 }
        );
    }
}

// DELETE remove a sponsor from a hackathon
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: hackathonId } = await params;
        const searchParams = req.nextUrl.searchParams;
        const sponsorId = searchParams.get('sponsorId');

        if (!sponsorId) {
            return NextResponse.json(
                { error: 'sponsorId query parameter is required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('hackathon_sponsors')
            .delete()
            .eq('hackathon_id', hackathonId)
            .eq('sponsor_id', sponsorId);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            message: "Sponsor removed from hackathon successfully"
        }, { status: 200 });

    } catch (error) {
        console.error('[API /hackathons/:id/sponsors DELETE] Error:', error);
        return NextResponse.json(
            { error: `Failed to remove sponsor: ${error}` },
            { status: 500 }
        );
    }
}
