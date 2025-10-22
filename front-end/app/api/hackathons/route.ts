import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";

// GET all hackathons
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const includeInactive = searchParams.get('includeInactive') === 'true';

        let query = db.select().from(schema.hackathons);

        // By default, only return active hackathons
        if (!includeInactive) {
            query = query.where(eq(schema.hackathons.isActive, true));
        }

        const hackathons = await query;

        return NextResponse.json({
            hackathons,
            count: hackathons.length
        }, { status: 200 });

    } catch (error) {
        console.error('[API /hackathons GET] Error:', error);
        return NextResponse.json(
            { error: `Failed to fetch hackathons: ${error}` },
            { status: 500 }
        );
    }
}

// POST create a new hackathon
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, location, startDate, endDate, description, website } = body;

        // Validations
        if (!name) {
            return NextResponse.json(
                { error: "Hackathon name is required" },
                { status: 400 }
            );
        }

        const [hackathon] = await db.insert(schema.hackathons).values({
            name,
            location,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            description,
            website,
        }).returning();

        return NextResponse.json({
            message: "Hackathon created successfully",
            hackathon
        }, { status: 201 });

    } catch (error) {
        console.error('[API /hackathons POST] Error:', error);
        return NextResponse.json(
            { error: `Failed to create hackathon: ${error}` },
            { status: 500 }
        );
    }
}

// PATCH update a hackathon
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            );
        }

        const [updated] = await db
            .update(schema.hackathons)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(schema.hackathons.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { error: 'Hackathon not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Hackathon updated successfully",
            hackathon: updated
        }, { status: 200 });

    } catch (error) {
        console.error('[API /hackathons PATCH] Error:', error);
        return NextResponse.json(
            { error: `Failed to update hackathon: ${error}` },
            { status: 500 }
        );
    }
}
