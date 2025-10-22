import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { eq, and } from "drizzle-orm";

// GET sponsors for a hackathon
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const hackathonId = params.id;

        // Get all sponsor relationships for this hackathon
        const relationships = await db
            .select({
                id: schema.hackathonSponsors.id,
                tier: schema.hackathonSponsors.tier,
                prizeAmount: schema.hackathonSponsors.prizeAmount,
                createdAt: schema.hackathonSponsors.createdAt,
                sponsor: schema.sponsors
            })
            .from(schema.hackathonSponsors)
            .innerJoin(
                schema.sponsors,
                eq(schema.hackathonSponsors.sponsorId, schema.sponsors.id)
            )
            .where(eq(schema.hackathonSponsors.hackathonId, hackathonId));

        return NextResponse.json({
            sponsors: relationships,
            count: relationships.length
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
    { params }: { params: { id: string } }
) {
    try {
        const hackathonId = params.id;
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
        const existing = await db
            .select()
            .from(schema.hackathonSponsors)
            .where(
                and(
                    eq(schema.hackathonSponsors.hackathonId, hackathonId),
                    eq(schema.hackathonSponsors.sponsorId, sponsorId)
                )
            );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: "Sponsor already added to this hackathon" },
                { status: 400 }
            );
        }

        const [relationship] = await db
            .insert(schema.hackathonSponsors)
            .values({
                hackathonId,
                sponsorId,
                tier,
                prizeAmount,
            })
            .returning();

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
    { params }: { params: { id: string } }
) {
    try {
        const hackathonId = params.id;
        const searchParams = req.nextUrl.searchParams;
        const sponsorId = searchParams.get('sponsorId');

        if (!sponsorId) {
            return NextResponse.json(
                { error: 'sponsorId query parameter is required' },
                { status: 400 }
            );
        }

        await db
            .delete(schema.hackathonSponsors)
            .where(
                and(
                    eq(schema.hackathonSponsors.hackathonId, hackathonId),
                    eq(schema.hackathonSponsors.sponsorId, sponsorId)
                )
            );

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
