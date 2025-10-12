import { QdrantClient } from "@qdrant/js-client-rest";
import fs from 'fs/promises';
import matter from 'gray-matter';
import OpenAI from 'openai';

const VECTOR_SIZE = 1536; // OpenAI text-embedding-3-small vector size
const CHUNK_SIZE = 500; // Number of words per chunk
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!QDRANT_API_KEY || !QDRANT_URL) {
  throw new Error("QDRANT_API_KEY and QDRANT_URL must be set in environment variables");
}

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set in environment variables");
}

export class QdranSimpleService {
  private client: QdrantClient;
  private openai: OpenAI;

  constructor() {
    this.client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY
    });
    this.openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  async initializeProjectCollection(projectId: string) {
    const collectionName = `project_${projectId}`;
    
    try {
      const collections = await this.client.getCollections();
      const existingCollections = collections.collections.map(c => c.name);

      if (!existingCollections.includes(collectionName)) {
        await this.client.createCollection(collectionName, {
          vectors: {
            size: VECTOR_SIZE,
            distance: "Cosine",
          },
        });
      }
      
      return collectionName;
    } catch (error) {
      throw new Error(`Failed to initialize collection for project ${projectId}: ${error}`);
    }
  }



  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private chunkText(text: string, chunkSize: number = 500): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    
    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    
    console.error('Embedding response:', response);
    return response.data[0].embedding;
  }

  async processMarkdownFile(filePath: string, projectId: string) {
    const collectionName = await this.initializeProjectCollection(projectId);
    
    // Convert to absolute path if relative
    const absolutePath = filePath.startsWith('/') 
      ? filePath 
      : `${process.cwd()}/${filePath}`;
      
    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch {
      throw new Error(`File not found: ${absolutePath}`);
    }
    
    const content = await fs.readFile(absolutePath, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);
    
    const chunks = this.chunkText(markdownContent);
    
    const points = await Promise.all(
      chunks.map(async (chunk, index) => ({
        id: this.hashString(`${projectId}-${filePath}-${index}`),
        vector: await this.generateEmbedding(chunk),
        payload: {
          projectId,
          filePath,
          chunkIndex: index,
          content: chunk,
          metadata: frontmatter,
        },
      }))
    );

    await this.client.upsert(collectionName, {
      wait: true,
      points,
    });
  }

  async searchDocuments(projectId: string, query: string, limit: number = 5) {
    const collectionName = `project_${projectId}`;
    
    try {
      // Check if collection exists first
      const collections = await this.client.getCollections();
      const existingCollections = collections.collections.map(c => c.name);
      
      if (!existingCollections.includes(collectionName)) {
        console.log(`Collection ${collectionName} does not exist. Available:`, existingCollections);
        return [];
      }
      
      const queryVector = await this.generateEmbedding(query);
      
      const result = await this.client.search(collectionName, {
        vector: queryVector,
        limit,
        with_payload: true,
      });

      return result.map(point => ({
        content: point.payload?.content,
        filePath: point.payload?.filePath,
        chunkIndex: point.payload?.chunkIndex,
        metadata: point.payload?.metadata,
        score: point.score,
      }));
    } catch (error) {
      throw new Error(`Failed to search in project ${projectId}: ${error}`);
    }
  }
}
