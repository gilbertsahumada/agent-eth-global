import { NextRequest, NextResponse } from "next/server";
import { QdrantIntelligentService } from "@/lib/qdrant-intelligent";
import { supabase } from "@/lib/supabase";
import { ProjectInsert, ProjectUpdate } from "@/lib/interfaces";
import { extractMetadata } from "@/lib/agents/metadata-agent-client";
import { randomUUID } from "crypto";
import path from "path";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const name = formData.get('name') as string;

        // Get all files (support multiple files)
        const files: File[] = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('file') && value instanceof File) {
                files.push(value);
            }
        }

        // Validaciones
        if (!name) {
            return NextResponse.json(
                { error: "Project name is required" },
                { status: 400 }
            );
        }

        if (files.length === 0) {
            return NextResponse.json(
                { error: "At least one markdown file is required" },
                { status: 400 }
            );
        }

        // Validate all files are markdown
        const invalidFiles = files.filter(f => !f.name.endsWith('.md') && !f.name.endsWith('.mdx'));
        if (invalidFiles.length > 0) {
            return NextResponse.json(
                { error: `Invalid files: ${invalidFiles.map(f => f.name).join(', ')}. Only .md or .mdx files are allowed` },
                { status: 400 }
            );
        }

        console.log(`[API /projects POST] Processing ${files.length} file(s) for project: ${name}`);

        // Generar ID único para el proyecto
        const projectId = randomUUID();
        const collectionName = `project_${projectId.replace(/-/g, '_')}`;

        // Crear directorio temporal si no existe
        const uploadDir = path.join(process.cwd(), 'uploads', projectId);
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Process all files and extract metadata
        const qdrantService = new QdrantIntelligentService();
        const filePaths: string[] = [];
        const allMetadata: {
            techStack: Set<string>;
            keywords: Set<string>;
            domains: Map<string, number>;
            languages: Set<string>;
            descriptions: string[];
        } = {
            techStack: new Set(),
            keywords: new Set(),
            domains: new Map(),
            languages: new Set(),
            descriptions: []
        };

        console.log('[API /projects POST] Processing files...');

        // Save and process all files
        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = path.join(uploadDir, fileName);

            await writeFile(filePath, buffer);
            console.log(`[API /projects POST] Saved: ${filePath}`);

            // Read markdown content
            const markdownContent = buffer.toString('utf-8');

            // Extract metadata using agent (ASI1-powered)
            console.log(`[API /projects POST] Calling metadata-agent for ${file.name}...`);
            const extractedMetadata = await extractMetadata(markdownContent, file.name);

            // Map agent metadata to expected format
            const metadataForQdrant = {
                techStack: extractedMetadata.tech_stack,
                keywords: extractedMetadata.keywords,
                domain: extractedMetadata.domain,
                languages: extractedMetadata.languages,
                description: extractedMetadata.description
            };

            // Index in Qdrant with pre-extracted metadata
            const metadata = await qdrantService.processMarkdownFile(
                filePath,
                projectId,
                metadataForQdrant // Pass agent-extracted metadata
            );

            // Aggregate metadata from all files
            metadata.techStack.forEach(tech => allMetadata.techStack.add(tech));
            metadata.keywords.forEach(kw => allMetadata.keywords.add(kw));
            metadata.languages.forEach(lang => allMetadata.languages.add(lang));
            if (metadata.description) allMetadata.descriptions.push(metadata.description);

            // Count domain occurrences
            if (metadata.domain) {
                const count = allMetadata.domains.get(metadata.domain) || 0;
                allMetadata.domains.set(metadata.domain, count + 1);
            }

            filePaths.push(filePath);

            // Register document in Supabase
            const { error: docError } = await supabase
                .from('project_documents')
                .insert({
                    project_id: projectId,
                    file_path: filePath,
                    file_name: file.name
                }).select().single();

            if (docError) {
                console.warn(`[API /projects POST] Warning: Failed to register document ${file.name}:`, docError);
            }
        }

        // Determine primary domain (most frequent)
        let primaryDomain: string | null = null;
        if (allMetadata.domains.size > 0) {
            const sortedDomains = Array.from(allMetadata.domains.entries()).sort((a, b) => b[1] - a[1]);
            primaryDomain = sortedDomains[0][0];
        }

        // Create project with aggregated auto-detected metadata
        const projectData: ProjectInsert = {
            id: projectId,
            name: name,
            collection_name: collectionName,
            description: allMetadata.descriptions[0] || null, // Use first description
            // Auto-detected metadata
            tech_stack: Array.from(allMetadata.techStack),
            domain: primaryDomain,
            tags: Array.from(allMetadata.languages), // Use languages as tags
            keywords: Array.from(allMetadata.keywords),
            document_count: files.length,
            last_indexed_at: new Date().toISOString()
        };

        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert(projectData)
            .select()
            .single();

        if (projectError) {
            console.error('[API /projects POST] Error creating project:', projectError);
            return NextResponse.json(
                { error: `Failed to create project: ${projectError.message}` },
                { status: 500 }
            );
        }

        console.log('[API /projects POST] ✅ Project created with auto-detected metadata:');
        console.log(`  - Tech Stack: ${projectData.tech_stack?.join(', ')}`);
        console.log(`  - Domain: ${projectData.domain}`);
        console.log(`  - Languages: ${projectData.tags?.join(', ')}`);
        console.log(`  - Keywords: ${projectData.keywords?.length} keywords`);

        return NextResponse.json({
            message: "Project indexed successfully",
            filesProcessed: files.length,
            project: {
                id: project.id,
                name: project.name,
                collection_name: project.collection_name,
                description: project.description,
                tech_stack: project.tech_stack,
                domain: project.domain,
                keywords: project.keywords,
                tags: project.tags,
                document_count: project.document_count,
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

        const updateData: ProjectUpdate = {
            is_active: isActive,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('projects')
            .update(updateData)
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