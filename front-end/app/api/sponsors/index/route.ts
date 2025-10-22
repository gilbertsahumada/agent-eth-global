import { NextRequest, NextResponse } from "next/server";
import { QdrantIntelligentService } from "@/lib/qdrant-intelligent";
import { db, schema } from "@/lib/db/client";
import { extractMetadata } from "@/lib/agents/metadata-agent-client";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const sponsorId = formData.get('sponsorId') as string;

        // Get all files (support multiple files)
        const files: File[] = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('file') && value instanceof File) {
                files.push(value);
            }
        }

        // Validations
        if (!sponsorId) {
            return NextResponse.json(
                { error: "Sponsor ID is required" },
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

        // Get sponsor from database
        const [sponsor] = await db
            .select()
            .from(schema.sponsors)
            .where(eq(schema.sponsors.id, sponsorId));

        if (!sponsor) {
            return NextResponse.json(
                { error: "Sponsor not found" },
                { status: 404 }
            );
        }

        console.log(`[API /sponsors/index POST] Processing ${files.length} file(s) for sponsor: ${sponsor.name}`);

        // Process all files and extract metadata (in-memory, no filesystem)
        const qdrantService = new QdrantIntelligentService();
        const allMetadata: {
            techStack: Set<string>;
            keywords: Set<string>;
            languages: Set<string>;
            descriptions: string[];
        } = {
            techStack: new Set(),
            keywords: new Set(),
            languages: new Set(),
            descriptions: []
        };

        console.log('[API /sponsors/index POST] Processing files in-memory (serverless-compatible)...');

        // Store file info for later insertion
        const fileInfos: Array<{ name: string; size: number; preview: string }> = [];

        // Process all files in memory
        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Read markdown content directly from buffer (no filesystem write)
            const markdownContent = buffer.toString('utf-8');
            console.log(`[API /sponsors/index POST] Processing: ${file.name} (${markdownContent.length} chars)`);

            // Extract metadata using agent
            console.log(`[API /sponsors/index POST] Calling metadata-agent for ${file.name}...`);
            const extractedMetadata = await extractMetadata(markdownContent, file.name);

            // Map agent metadata to expected format
            const metadataForQdrant = {
                techStack: extractedMetadata.tech_stack,
                keywords: extractedMetadata.keywords,
                domain: extractedMetadata.domain,
                languages: extractedMetadata.languages,
                description: extractedMetadata.description
            };

            // Index in Qdrant with pre-extracted metadata using sponsor's collection
            await qdrantService.indexInCollection(
                sponsor.collectionName,
                markdownContent,
                file.name,
                sponsorId,
                metadataForQdrant
            );

            // Aggregate metadata from all files
            metadataForQdrant.techStack.forEach(tech => allMetadata.techStack.add(tech));
            metadataForQdrant.keywords.forEach(kw => allMetadata.keywords.add(kw));
            metadataForQdrant.languages.forEach(lang => allMetadata.languages.add(lang));
            if (metadataForQdrant.description) allMetadata.descriptions.push(metadataForQdrant.description);

            // Store file info for later
            fileInfos.push({
                name: file.name,
                size: buffer.length,
                preview: markdownContent.slice(0, 500)
            });
        }

        // Update sponsor with aggregated metadata
        const currentDocCount = sponsor.documentCount || 0;
        await db
            .update(schema.sponsors)
            .set({
                techStack: Array.from(allMetadata.techStack),
                tags: Array.from(allMetadata.languages),
                documentCount: currentDocCount + files.length,
                lastIndexedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(schema.sponsors.id, sponsorId));

        console.log('[API /sponsors/index POST] ✅ Sponsor updated with metadata');

        // Insert file records
        console.log('[API /sponsors/index POST] Registering documents in database...');
        for (const fileInfo of fileInfos) {
            await db.insert(schema.sponsorDocuments).values({
                sponsorId: sponsorId,
                fileName: fileInfo.name,
                fileSize: fileInfo.size,
                contentPreview: fileInfo.preview,
            });
            console.log(`[API /sponsors/index POST] ✅ Document registered: ${fileInfo.name}`);
        }

        return NextResponse.json({
            message: "Sponsor documentation indexed successfully",
            filesProcessed: files.length,
            sponsor: {
                id: sponsor.id,
                name: sponsor.name,
                documentCount: currentDocCount + files.length,
            }
        }, { status: 200 });

    } catch (error) {
        console.error('[API /sponsors/index POST] Error:', error);
        return NextResponse.json(
            { error: `Failed to process sponsor documentation: ${error}` },
            { status: 500 }
        );
    }
}
