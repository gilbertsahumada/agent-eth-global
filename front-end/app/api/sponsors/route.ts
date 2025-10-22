import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// GET all sponsors
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const includeInactive = searchParams.get('includeInactive') === 'true';

        let query = db.select().from(schema.sponsors);

        // By default, only return active sponsors
        if (!includeInactive) {
            query = query.where(eq(schema.sponsors.isActive, true));
        }

        const sponsors = await query;

        return NextResponse.json({
            sponsors,
            count: sponsors.length
        }, { status: 200 });

    } catch (error) {
        console.error('[API /sponsors GET] Error:', error);
        return NextResponse.json(
            { error: `Failed to fetch sponsors: ${error}` },
            { status: 500 }
        );
    }
}

// POST create a new sponsor
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, website, logo, docUrl, techStack, category, tags } = body;

        // Validations
        if (!name) {
            return NextResponse.json(
                { error: "Sponsor name is required" },
                { status: 400 }
            );
        }

        // Generate collection name for Qdrant
        const sponsorId = randomUUID();
        const collectionName = `sponsor_${sponsorId.replace(/-/g, '_')}`;

        const [sponsor] = await db.insert(schema.sponsors).values({
            id: sponsorId,
            name,
            collectionName,
            description,
            website,
            logo,
            docUrl,
            techStack: techStack || [],
            category,
            tags: tags || [],
            documentCount: 0,
        }).returning();

        return NextResponse.json({
            message: "Sponsor created successfully",
            sponsor
        }, { status: 201 });

    } catch (error) {
        console.error('[API /sponsors POST] Error:', error);
        return NextResponse.json(
            { error: `Failed to create sponsor: ${error}` },
            { status: 500 }
        );
    }
}

// PATCH update a sponsor
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
            .update(schema.sponsors)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(schema.sponsors.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { error: 'Sponsor not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Sponsor updated successfully",
            sponsor: updated
        }, { status: 200 });

    } catch (error) {
        console.error('[API /sponsors PATCH] Error:', error);
        return NextResponse.json(
            { error: `Failed to update sponsor: ${error}` },
            { status: 500 }
        );
    }
}
