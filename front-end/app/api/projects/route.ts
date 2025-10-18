import { NextRequest, NextResponse } from "next/server";
import { QdranSimpleService } from "@/lib/qdrant-simple";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const domain = formData.get('domain') as string;
        const techStackStr = formData.get('techStack') as string;
        const tagsStr = formData.get('tags') as string;
        const keywordsStr = formData.get('keywords') as string;
        const file = formData.get('file') as File;

        // Validaciones
        if (!name || !file) {
            return NextResponse.json(
                { error: "name and file are required" },
                { status: 400 }
            );
        }

        // Parse JSON arrays (if provided)
        let techStack: string[] = [];
        let tags: string[] = [];
        let keywords: string[] = [];

        try {
            if (techStackStr) techStack = JSON.parse(techStackStr);
            if (tagsStr) tags = JSON.parse(tagsStr);
            if (keywordsStr) keywords = JSON.parse(keywordsStr);
        } catch (e) {
            console.warn('[API /projects POST] Error parsing metadata arrays:', e);
            // Continue with empty arrays if parsing fails
        }

        const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.mdx');
        if (!isMarkdown) {
            return NextResponse.json(
                { error: "File must be a .md or .mdx (Markdown) file" },
                { status: 400 }
            );
        }

        // Generar ID único para el proyecto
        const projectId = randomUUID();
        const collectionName = `project_${projectId.replace(/-/g, '_')}`;

        // Crear directorio temporal si no existe
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Guardar archivo temporalmente
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${projectId}_${file.name}`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        console.log('[API /projects POST] File saved:', filePath);

        // 1. Crear proyecto en Supabase con metadata
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                id: projectId,
                name: name,
                collection_name: collectionName,
                description: description || null,
                // Metadata for multi-agent routing
                tech_stack: techStack.length > 0 ? techStack : [],
                domain: domain || null,
                tags: tags.length > 0 ? tags : [],
                keywords: keywords.length > 0 ? keywords : [],
                document_count: 1,  // We're indexing 1 file
                last_indexed_at: new Date().toISOString()
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
        const { error: docError } = await supabase
            .from('project_documents')
            .insert({
                project_id: projectId,
                file_path: filePath,
                file_name: file.name
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

export async function GET(req: NextRequest) {
    try {
        // Allow querying all projects or only active ones
        const searchParams = req.nextUrl.searchParams;
        const includeInactive = searchParams.get('includeInactive') === 'true';

        let query = supabase
            .from('projects')
            .select('*');

        // By default, only return active projects (for agents)
        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data: projects, error } = await query.order('created_at', { ascending: false });

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

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, isActive } = body;

        if (!id || typeof isActive !== 'boolean') {
            return NextResponse.json(
                { error: 'id and isActive (boolean) are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('projects')
            .update({
                is_active: isActive,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[API /projects PATCH] Error:', error);
            return NextResponse.json(
                { error: `Failed to update project: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: `Project ${isActive ? 'activated' : 'deactivated'} successfully`,
            project: data
        }, { status: 200 });

    } catch (error) {
        console.error('[API /projects PATCH] Error:', error);
        return NextResponse.json(
            { error: `Failed to update project: ${error}` },
            { status: 500 }
        );
    }
}