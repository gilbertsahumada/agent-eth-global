import { NextRequest, NextResponse } from "next/server";
import { QdranSimpleService } from "@/lib/qdrant-simple";

export async function POST(req: NextRequest) { 
    try {
        const { filePath} = await req.json();

        if(!filePath) {
            return NextResponse.json({ error: "filePath is required" }, { status: 400 });
        }

        const qdrantService = new QdranSimpleService();
        await qdrantService.processMarkdownFile(filePath, "1");

        return NextResponse.json({ message: "File processed successfully" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: `Failed to process file: ${error}` }, { status: 500 });
    }
 }