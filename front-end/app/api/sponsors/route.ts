import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

// GET all sponsors
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const includeInactive = searchParams.get('includeInactive') === 'true';

        // By default, only return active sponsors
        let query = supabase.from('sponsors').select('*');

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data: sponsors, error } = await query;

        if (error) {
            throw error;
        }

        // Transform snake_case to camelCase for frontend
        const transformedSponsors = sponsors?.map(s => ({
            id: s.id,
            name: s.name,
            collectionName: s.collection_name,
            description: s.description,
            website: s.website,
            logo: s.logo,
            docUrl: s.doc_url,
            techStack: s.tech_stack,
            category: s.category,
            tags: s.tags,
            documentCount: s.document_count,
            lastIndexedAt: s.last_indexed_at,
            isActive: s.is_active,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        })) || [];

        return NextResponse.json({
            sponsors: transformedSponsors,
            count: transformedSponsors.length
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

        const { data: sponsor, error } = await supabase
            .from('sponsors')
            .insert({
                id: sponsorId,
                name,
                collection_name: collectionName,
                description,
                website,
                logo,
                doc_url: docUrl,
                tech_stack: techStack || [],
                category,
                tags: tags || [],
                document_count: 0,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Transform to camelCase
        const transformedSponsor = {
            id: sponsor.id,
            name: sponsor.name,
            collectionName: sponsor.collection_name,
            description: sponsor.description,
            website: sponsor.website,
            logo: sponsor.logo,
            docUrl: sponsor.doc_url,
            techStack: sponsor.tech_stack,
            category: sponsor.category,
            tags: sponsor.tags,
            documentCount: sponsor.document_count,
            lastIndexedAt: sponsor.last_indexed_at,
            isActive: sponsor.is_active,
            createdAt: sponsor.created_at,
            updatedAt: sponsor.updated_at,
        };

        return NextResponse.json({
            message: "Sponsor created successfully",
            sponsor: transformedSponsor
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

        const { data: updated, error } = await supabase
            .from('sponsors')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Sponsor not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        // Transform to camelCase
        const transformedSponsor = {
            id: updated.id,
            name: updated.name,
            collectionName: updated.collection_name,
            description: updated.description,
            website: updated.website,
            logo: updated.logo,
            docUrl: updated.doc_url,
            techStack: updated.tech_stack,
            category: updated.category,
            tags: updated.tags,
            documentCount: updated.document_count,
            lastIndexedAt: updated.last_indexed_at,
            isActive: updated.is_active,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        };

        return NextResponse.json({
            message: "Sponsor updated successfully",
            sponsor: transformedSponsor
        }, { status: 200 });

    } catch (error) {
        console.error('[API /sponsors PATCH] Error:', error);
        return NextResponse.json(
            { error: `Failed to update sponsor: ${error}` },
            { status: 500 }
        );
    }
}
