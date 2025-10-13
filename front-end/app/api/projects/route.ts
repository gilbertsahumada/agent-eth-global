import { NextRequest, NextResponse } from "next/server";
import { QdranSimpleService } from "@/lib/qdrant-simple";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const { name, description, filePath } = await req.json();

        // Validaciones
        if (!name || !filePath) {
            return NextResponse.json(
                { error: "name and filePath are required" },
                { status: 400 }
            );
        }

        // Generar ID único para el proyecto
        const projectId = randomUUID();
        const collectionName = `project_${projectId.replace(/-/g, '_')}`;

        // 1. Crear proyecto en Supabase
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                id: projectId,
                name: name,
                collection_name: collectionName,
                description: description || null
            })
            .select()
            .single();

        if (projectError) {
            console.error('[API /projects POST] Error creating project:', projectError);
            return NextResponse.json(
                { error: `Failed to create project: ${projectError.message}` },
                { status: 500 }
            );
        }

        // 2. Indexar en Qdrant
        const qdrantService = new QdranSimpleService();
        await qdrantService.processMarkdownFile(filePath, projectId);

        // 3. Registrar documento en Supabase
        const fileName = path.basename(filePath);
        const { error: docError } = await supabase
            .from('project_documents')
            .insert({
                project_id: projectId,
                file_path: filePath,
                file_name: fileName
            });

        if (docError) {
            console.error('[API /projects POST] Warning: Failed to register document:', docError);
            // No fallar si el documento no se registra, el proyecto ya está indexado
        }

        return NextResponse.json({
            message: "Project indexed successfully",
            project: {
                id: project.id,
                name: project.name,
                collection_name: project.collection_name,
                description: project.description,
                created_at: project.created_at
            }
        }, { status: 200 });

    } catch (error) {
        console.error('[API /projects POST] Error:', error);
        return NextResponse.json(
            { error: `Failed to process project: ${error}` },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API /projects GET] Error:', error);
            return NextResponse.json(
                { error: `Failed to fetch projects: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            projects,
            count: projects?.length || 0
        }, { status: 200 });

    } catch (error) {
        console.error('[API /projects GET] Error:', error);
        return NextResponse.json(
            { error: `Failed to fetch projects: ${error}` },
            { status: 500 }
        );
    }
}