import { NextRequest, NextResponse } from "next/server";
import { QdrantIntelligentService } from "@/lib/qdrant-intelligent";
import { supabase } from "@/lib/supabase";
import { ProjectInsert, ProjectRow, ProjectUpdate } from "@/lib/interfaces";
import { extractMetadata } from "@/lib/agents/metadata-agent-client";
import { randomUUID } from "crypto";

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

        // Process all files and extract metadata (in-memory, no filesystem)
        const qdrantService = new QdrantIntelligentService();
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

        console.log('[API /projects POST] Processing files in-memory (serverless-compatible)...');

        // Store file info for later insertion (after project is created)
        const fileInfos: Array<{ name: string; size: number; preview: string }> = [];

        // Process all files in memory
        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Read markdown content directly from buffer (no filesystem write)
            const markdownContent = buffer.toString('utf-8');
            console.log(`[API /projects POST] Processing: ${file.name} (${markdownContent.length} chars)`);

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

            // Index in Qdrant with pre-extracted metadata (in-memory processing)
            const metadata = await qdrantService.processMarkdownContent(
                markdownContent,
                file.name,
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

            // Store file info for later (after project is created)
            fileInfos.push({
                name: file.name,
                size: buffer.length,
                preview: markdownContent.slice(0, 500)
            });
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
            .single<ProjectRow>();

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

        // Now insert file records (after project exists)
        console.log('[API /projects POST] Registering documents in database...');
        for (const fileInfo of fileInfos) {
            const { error: docError } = await supabase
                .from('project_documents')
                .insert({
                    project_id: projectId,
                    file_name: fileInfo.name,
                    file_size: fileInfo.size,
                    content_preview: fileInfo.preview,
                } as any);

            if (docError) {
                console.error(`[API /projects POST] ⚠️  Warning: Failed to register document ${fileInfo.name}:`, docError.message);
            } else {
                console.log(`[API /projects POST] ✅ Document registered: ${fileInfo.name}`);
            }
        }

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