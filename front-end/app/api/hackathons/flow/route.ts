import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";

// GET flow data for React Flow visualization
export async function GET(req: NextRequest) {
    try {
        // Get all hackathons
        const hackathons = await db
            .select()
            .from(schema.hackathons)
            .where(eq(schema.hackathons.isActive, true));

        // Get all sponsors
        const sponsors = await db
            .select()
            .from(schema.sponsors)
            .where(eq(schema.sponsors.isActive, true));

        // Get all relationships
        const relationships = await db
            .select()
            .from(schema.hackathonSponsors);

        // Format nodes for React Flow
        const nodes = [
            // Hackathon nodes
            ...hackathons.map((hackathon, index) => ({
                id: hackathon.id,
                type: 'hackathon',
                position: { x: 100, y: index * 200 },
                data: {
                    label: hackathon.name,
                    location: hackathon.location,
                    startDate: hackathon.startDate,
                    endDate: hackathon.endDate,
                    description: hackathon.description,
                    website: hackathon.website,
                },
            })),
            // Sponsor nodes
            ...sponsors.map((sponsor, index) => ({
                id: sponsor.id,
                type: 'sponsor',
                position: { x: 600, y: index * 150 },
                data: {
                    label: sponsor.name,
                    logo: sponsor.logo,
                    category: sponsor.category,
                    description: sponsor.description,
                    website: sponsor.website,
                    docUrl: sponsor.docUrl,
                    documentCount: sponsor.documentCount,
                    lastIndexedAt: sponsor.lastIndexedAt,
                },
            })),
        ];

        // Format edges for React Flow
        const edges = relationships.map((rel) => ({
            id: rel.id,
            source: rel.hackathonId,
            target: rel.sponsorId,
            label: rel.tier || '',
            data: {
                tier: rel.tier,
                prizeAmount: rel.prizeAmount,
            },
        }));

        return NextResponse.json({
            nodes,
            edges,
            hackathonsCount: hackathons.length,
            sponsorsCount: sponsors.length,
            connectionsCount: relationships.length,
        }, { status: 200 });

    } catch (error) {
        console.error('[API /hackathons/flow GET] Error:', error);
        return NextResponse.json(
            { error: `Failed to fetch flow data: ${error}` },
            { status: 500 }
        );
    }
}
