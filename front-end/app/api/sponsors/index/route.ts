import { NextRequest, NextResponse } from "next/server";
import { QdrantIntelligentService } from "@/lib/qdrant-intelligent";
import { supabase } from "@/lib/supabase";
import { extractMetadata } from "@/lib/agents/metadata-agent-client";
import { SponsorUpdate } from "@/lib/interfaces/sponsors.interface";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sponsorId = formData.get("sponsorId") as string;

    // Get all files (support multiple files)
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file") && value instanceof File) {
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
    const invalidFiles = files.filter(
      (f) => !f.name.endsWith(".md") && !f.name.endsWith(".mdx")
    );
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid files: ${invalidFiles
            .map((f) => f.name)
            .join(", ")}. Only .md or .mdx files are allowed`,
        },
        { status: 400 }
      );
    }

    // Get sponsor from database
    const { data: sponsor, error: sponsorError } = await supabase
      .from("sponsors")
      .select("*")
      .eq("id", sponsorId)
      .single();

    if (sponsorError || !sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    console.log(
      `[API /sponsors/index POST] Processing ${files.length} file(s) for sponsor: ${sponsor.name}`
    );

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
      descriptions: [],
    };

    console.log(
      "[API /sponsors/index POST] Processing files in-memory (serverless-compatible)..."
    );

    // Store file info for later insertion
    const fileInfos: Array<{ name: string; size: number; preview: string }> =
      [];

    // Process all files in memory
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Read markdown content directly from buffer (no filesystem write)
      const markdownContent = buffer.toString("utf-8");
      console.log(
        `[API /sponsors/index POST] Processing: ${file.name} (${markdownContent.length} chars)`
      );

      // Extract metadata using agent
      console.log(
        `[API /sponsors/index POST] Calling metadata-agent for ${file.name}...`
      );
      const extractedMetadata = await extractMetadata(
        markdownContent,
        file.name
      );

      // Map agent metadata to expected format
      const metadataForQdrant = {
        techStack: extractedMetadata.tech_stack,
        keywords: extractedMetadata.keywords,
        domain: extractedMetadata.domain,
        languages: extractedMetadata.languages,
        description: extractedMetadata.description,
      };

      // Index in Qdrant with pre-extracted metadata using sponsor's collection
      await qdrantService.indexInCollection(
        sponsor.collection_name,
        markdownContent,
        file.name,
        sponsorId,
        metadataForQdrant
      );

      // Aggregate metadata from all files
      metadataForQdrant.techStack.forEach((tech) =>
        allMetadata.techStack.add(tech)
      );
      metadataForQdrant.keywords.forEach((kw) => allMetadata.keywords.add(kw));
      metadataForQdrant.languages.forEach((lang) =>
        allMetadata.languages.add(lang)
      );
      if (metadataForQdrant.description)
        allMetadata.descriptions.push(metadataForQdrant.description);

      // Store file info for later
      fileInfos.push({
        name: file.name,
        size: buffer.length,
        preview: markdownContent.slice(0, 500),
      });
    }
    // Update sponsor with aggregated metadata
    const currentDocCount = sponsor.document_count || 0;
    const updateSponsor: SponsorUpdate = {
      tech_stack: Array.from(allMetadata.techStack),
      tags: Array.from(allMetadata.languages),
      document_count: currentDocCount + files.length,
      last_indexed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("sponsors")
      .update(updateSponsor)
      .eq("id", sponsorId);

    if (updateError) {
      console.error(
        "[API /sponsors/index POST] Error updating sponsor:",
        updateError
      );
      throw new Error(`Failed to update sponsor: ${updateError.message}`);
    }

    console.log("[API /sponsors/index POST] ✅ Sponsor updated with metadata");

    // Insert file records (upsert to handle duplicates)
    console.log(
      "[API /sponsors/index POST] Registering documents in database..."
    );
    for (const fileInfo of fileInfos) {
      const { error: docError } = await supabase
        .from("sponsor_documents")
        .upsert(
          {
            sponsor_id: sponsorId,
            file_name: fileInfo.name,
            file_size: fileInfo.size,
            content_preview: fileInfo.preview,
            indexed_at: new Date().toISOString(),
          },
          {
            onConflict: "sponsor_id,file_name", // Use unique constraint
          }
        );

      if (docError) {
        console.error(
          `[API /sponsors/index POST] ⚠️ Warning: Failed to register document ${fileInfo.name}:`,
          docError.message
        );
      } else {
        console.log(
          `[API /sponsors/index POST] ✅ Document registered: ${fileInfo.name}`
        );
      }
    }

    return NextResponse.json(
      {
        message: "Sponsor documentation indexed successfully",
        filesProcessed: files.length,
        sponsor: {
          id: sponsor.id,
          name: sponsor.name,
          documentCount: currentDocCount + files.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /sponsors/index POST] Error:", error);
    return NextResponse.json(
      { error: `Failed to process sponsor documentation: ${error}` },
      { status: 500 }
    );
  }
}
