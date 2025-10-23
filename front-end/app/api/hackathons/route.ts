import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all hackathons
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const includeInactive = searchParams.get('includeInactive') === 'true';

        let query = supabase.from('hackathons').select('*');

        // By default, only return active hackathons
        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data: hackathons, error } = await query;

        if (error) {
            throw error;
        }

        // Transform snake_case to camelCase for frontend
        const transformedHackathons = hackathons?.map(h => ({
            id: h.id,
            name: h.name,
            location: h.location,
            startDate: h.start_date,
            endDate: h.end_date,
            description: h.description,
            website: h.website,
            isActive: h.is_active,
            createdAt: h.created_at,
            updatedAt: h.updated_at,
        })) || [];

        return NextResponse.json({
            hackathons: transformedHackathons,
            count: transformedHackathons.length
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

        const { data: hackathon, error } = await supabase
            .from('hackathons')
            .insert({
                name,
                location,
                start_date: startDate ? new Date(startDate).toISOString() : null,
                end_date: endDate ? new Date(endDate).toISOString() : null,
                description,
                website,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Transform to camelCase
        const transformedHackathon = {
            id: hackathon.id,
            name: hackathon.name,
            location: hackathon.location,
            startDate: hackathon.start_date,
            endDate: hackathon.end_date,
            description: hackathon.description,
            website: hackathon.website,
            isActive: hackathon.is_active,
            createdAt: hackathon.created_at,
            updatedAt: hackathon.updated_at,
        };

        return NextResponse.json({
            message: "Hackathon created successfully",
            hackathon: transformedHackathon
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

        const { data: updated, error } = await supabase
            .from('hackathons')
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
                    { error: 'Hackathon not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        // Transform to camelCase
        const transformedHackathon = {
            id: updated.id,
            name: updated.name,
            location: updated.location,
            startDate: updated.start_date,
            endDate: updated.end_date,
            description: updated.description,
            website: updated.website,
            isActive: updated.is_active,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        };

        return NextResponse.json({
            message: "Hackathon updated successfully",
            hackathon: transformedHackathon
        }, { status: 200 });

    } catch (error) {
        console.error('[API /hackathons PATCH] Error:', error);
        return NextResponse.json(
            { error: `Failed to update hackathon: ${error}` },
            { status: 500 }
        );
    }
}
