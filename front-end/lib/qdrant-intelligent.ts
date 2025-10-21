/**
 * Intelligent Qdrant Service - Semantic Chunking Strategy
 *
 * This service implements advanced document processing for better RAG performance:
 * - Semantic chunking (respects document structure)
 * - Code snippet extraction (complete, not fragmented)
 * - Hierarchical context preservation
 * - Rich metadata for hybrid search
 * - Late chunking for better recall
 *
 * @author Senior AI Engineer approach
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import fs from 'fs/promises';
import matter from 'gray-matter';
import OpenAI from 'openai';
import { MetadataExtractor } from './metadata-extractor';

const VECTOR_SIZE = 1536; // OpenAI text-embedding-3-small
const MAX_CHUNK_TOKENS = 400; // ~300 words (more precise than word count)
const CODE_MAX_TOKENS = 800; // Code snippets can be longer
const OVERLAP_TOKENS = 50; // Overlap for conceptual text only

const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!QDRANT_API_KEY || !QDRANT_URL) {
  throw new Error("QDRANT_API_KEY and QDRANT_URL must be set");
}

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

// Chunk types for semantic understanding
enum ChunkType {
  TITLE = 'title',
  CODE_SNIPPET = 'code',
  PROCEDURE = 'procedure', // Step-by-step instructions
  CONCEPT = 'concept', // Explanatory text
  API_REFERENCE = 'api', // Function/API definitions
  WARNING = 'warning', // Important notes
  EXAMPLE = 'example', // Usage examples
}

interface SemanticChunk {
  content: string;
  type: ChunkType;
  hierarchy: string[]; // [H1, H2, H3] for context inheritance
  language?: string; // For code blocks
  metadata: {
    title?: string;
    section?: string;
    subsection?: string;
    hasCode: boolean;
    codeLanguage?: string;
    keywords?: string[];
    importance?: 'high' | 'medium' | 'low';
  };
}

interface MarkdownSection {
  level: number; // H1=1, H2=2, etc.
  title: string;
  content: string;
  codeBlocks: CodeBlock[];
  children: MarkdownSection[];
}

interface CodeBlock {
  language: string;
  code: string;
  context: string; // Surrounding explanation
}

export class QdrantIntelligentService {
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

  /**
   * Estimate token count (rough approximation: 1 token ≈ 0.75 words)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).length * 1.33);
  }

  /**
   * Parse Markdown into hierarchical sections
   */
  private parseMarkdownStructure(content: string): MarkdownSection[] {
    const lines = content.split('\n');
    const sections: MarkdownSection[] = [];
    let currentSection: MarkdownSection | null = null;
    let currentContent: string[] = [];
    let inCodeBlock = false;
    let currentCodeBlock: { lang: string; code: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start code block
          const lang = line.slice(3).trim() || 'text';
          currentCodeBlock = { lang, code: [] };
          inCodeBlock = true;
        } else {
          // End code block
          if (currentSection && currentCodeBlock) {
            currentSection.codeBlocks.push({
              language: currentCodeBlock.lang,
              code: currentCodeBlock.code.join('\n'),
              context: currentContent.slice(-3).join('\n') // Last 3 lines before code
            });
          }
          currentCodeBlock = null;
          inCodeBlock = false;
        }
        continue;
      }

      if (inCodeBlock && currentCodeBlock) {
        currentCodeBlock.code.push(line);
        continue;
      }

      // Detect headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }

        // Create new section
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();

        currentSection = {
          level,
          title,
          content: '',
          codeBlocks: [],
          children: []
        };
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract code snippets as complete semantic units
   */
  private extractCodeSnippets(sections: MarkdownSection[]): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];

    for (const section of sections) {
      const hierarchy = [section.title];

      for (const codeBlock of section.codeBlocks) {
        // Include context before code
        const fullContent = `${codeBlock.context}\n\n\`\`\`${codeBlock.language}\n${codeBlock.code}\n\`\`\``;

        chunks.push({
          content: fullContent,
          type: ChunkType.CODE_SNIPPET,
          hierarchy,
          language: codeBlock.language,
          metadata: {
            title: section.title,
            hasCode: true,
            codeLanguage: codeBlock.language,
            keywords: this.extractKeywordsFromCode(codeBlock.code, codeBlock.language),
            importance: 'high', // Code snippets are high priority
          }
        });
      }
    }

    return chunks;
  }

  /**
   * Extract keywords from code (function names, classes, imports, etc.)
   */
  private extractKeywordsFromCode(code: string, language: string): string[] {
    const keywords: string[] = [];

    // Common patterns across languages
    const patterns = [
      /function\s+(\w+)/g,        // function declarations
      /class\s+(\w+)/g,           // class declarations
      /const\s+(\w+)/g,           // const declarations
      /let\s+(\w+)/g,             // let declarations
      /import\s+.*?from\s+['"](.+?)['"]/g, // imports
      /def\s+(\w+)/g,             // Python functions
      /contract\s+(\w+)/g,        // Solidity contracts
      /interface\s+(\w+)/g,       // TypeScript interfaces
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (match[1] && match[1].length > 2) {
          keywords.push(match[1]);
        }
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Chunk conceptual text with intelligent overlapping
   */
  private chunkConceptualText(
    text: string,
    hierarchy: string[],
    maxTokens: number = MAX_CHUNK_TOKENS
  ): SemanticChunk[] {
    const sentences = text.split(/[.!?]\s+/);
    const chunks: SemanticChunk[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);

      if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: currentChunk.join('. ') + '.',
          type: this.detectChunkType(currentChunk.join('. ')),
          hierarchy,
          metadata: {
            section: hierarchy[hierarchy.length - 1],
            hasCode: false,
            importance: 'medium',
          }
        });

        // Start new chunk with overlap (last sentence)
        currentChunk = [currentChunk[currentChunk.length - 1], sentence];
        currentTokens = this.estimateTokens(currentChunk.join('. '));
      } else {
        currentChunk.push(sentence);
        currentTokens += sentenceTokens;
      }
    }

    // Save last chunk
    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.join('. ') + '.',
        type: this.detectChunkType(currentChunk.join('. ')),
        hierarchy,
        metadata: {
          section: hierarchy[hierarchy.length - 1],
          hasCode: false,
          importance: 'medium',
        }
      });
    }

    return chunks;
  }

  /**
   * Detect chunk type from content
   */
  private detectChunkType(text: string): ChunkType {
    const lower = text.toLowerCase();

    // Check for procedures (step-by-step)
    if (/\d+\.\s|step\s+\d+|first|second|then|finally|next/.test(lower)) {
      return ChunkType.PROCEDURE;
    }

    // Check for warnings
    if (/warning|caution|important|note|⚠️|danger/.test(lower)) {
      return ChunkType.WARNING;
    }

    // Check for API references
    if (/function|method|parameter|returns|api|endpoint/.test(lower)) {
      return ChunkType.API_REFERENCE;
    }

    // Check for examples
    if (/example|for instance|such as|e\.g\.|usage/.test(lower)) {
      return ChunkType.EXAMPLE;
    }

    return ChunkType.CONCEPT;
  }

  /**
   * Process sections into semantic chunks
   */
  private processSection(section: MarkdownSection, parentHierarchy: string[] = []): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    const hierarchy = [...parentHierarchy, section.title];

    // 1. Create title chunk (for navigation and context)
    if (section.level <= 3) { // Only H1, H2, H3 as separate chunks
      chunks.push({
        content: `# ${section.title}\n${section.content.slice(0, 200)}...`,
        type: ChunkType.TITLE,
        hierarchy,
        metadata: {
          title: section.title,
          section: section.title,
          hasCode: section.codeBlocks.length > 0,
          importance: section.level === 1 ? 'high' : 'medium',
        }
      });
    }

    // 2. Chunk conceptual content
    if (section.content.trim()) {
      chunks.push(...this.chunkConceptualText(section.content, hierarchy));
    }

    // 3. Process child sections recursively
    for (const child of section.children) {
      chunks.push(...this.processSection(child, hierarchy));
    }

    return chunks;
  }

  /**
   * Main intelligent processing pipeline with automatic metadata extraction
   * Returns extracted metadata for database storage
   *
   * @param filePath - Path to markdown file
   * @param projectId - Project UUID
   * @param preExtractedMetadata - Optional pre-extracted metadata from agent (preferred)
   */
  async processMarkdownFile(
    filePath: string,
    projectId: string,
    preExtractedMetadata?: {
      techStack: string[];
      keywords: string[];
      domain: string | null;
      languages: string[];
      description: string;
    }
  ): Promise<{
    techStack: string[];
    keywords: string[];
    domain: string | null;
    languages: string[];
    description: string;
  }> {
    const collectionName = await this.initializeProjectCollection(projectId);

    // Read file
    const absolutePath = filePath.startsWith('/')
      ? filePath
      : `${process.cwd()}/${filePath}`;

    const content = await fs.readFile(absolutePath, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);

    console.log(`[INTELLIGENT] Processing: ${filePath}`);

    // Use pre-extracted metadata if available (from agent), otherwise extract locally
    let finalMetadata;
    if (preExtractedMetadata) {
      console.log(`[INTELLIGENT] Using pre-extracted metadata from agent`);
      finalMetadata = preExtractedMetadata;
    } else {
      console.log(`[INTELLIGENT] Extracting metadata locally (fallback)`);
      const extractedMetadata = MetadataExtractor.extract(markdownContent, frontmatter);
      finalMetadata = MetadataExtractor.mergeFrontmatter(extractedMetadata, frontmatter);
    }

    console.log(`[INTELLIGENT] Metadata:`);
    console.log(`  - Tech Stack: ${finalMetadata.techStack.join(', ')}`);
    console.log(`  - Domain: ${finalMetadata.domain || 'Unknown'}`);
    console.log(`  - Languages: ${finalMetadata.languages.join(', ')}`);
    console.log(`  - Keywords: ${finalMetadata.keywords.length} keywords`);

    // 1. Parse document structure
    const sections = this.parseMarkdownStructure(markdownContent);
    console.log(`[INTELLIGENT] Found ${sections.length} sections`);

    // 2. Extract code snippets (complete, not fragmented)
    const codeChunks = this.extractCodeSnippets(sections);
    console.log(`[INTELLIGENT] Extracted ${codeChunks.length} code snippets`);

    // 3. Process sections into semantic chunks
    const conceptChunks: SemanticChunk[] = [];
    for (const section of sections) {
      conceptChunks.push(...this.processSection(section));
    }
    console.log(`[INTELLIGENT] Created ${conceptChunks.length} conceptual chunks`);

    // 4. Combine all chunks
    const allChunks = [...codeChunks, ...conceptChunks];
    console.log(`[INTELLIGENT] Total chunks: ${allChunks.length}`);

    // 5. Generate embeddings and store
    const points = await Promise.all(
      allChunks.map(async (chunk, index) => {
        const embedding = await this.generateEmbedding(chunk.content);

        return {
          id: this.hashString(`${projectId}-${filePath}-${chunk.type}-${index}`),
          vector: embedding,
          payload: {
            projectId,
            filePath,
            content: chunk.content,
            type: chunk.type,
            hierarchy: chunk.hierarchy,
            language: chunk.language,
            // Metadata for hybrid search (vector + filtering)
            section: chunk.hierarchy[0] || null,
            subsection: chunk.hierarchy[1] || null,
            hasCode: chunk.metadata.hasCode,
            codeLanguage: chunk.metadata.codeLanguage || null,
            keywords: chunk.metadata.keywords || [],
            importance: chunk.metadata.importance || 'medium',
            // Original frontmatter
            frontmatter,
          },
        };
      })
    );

    await this.client.upsert(collectionName, {
      wait: true,
      points,
    });

    console.log(`[INTELLIGENT] ✅ Indexed ${points.length} semantic chunks`);

    // Return extracted metadata
    return finalMetadata;
  }

  /**
   * Initialize collection with payload schema
   */
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

        // Create payload indexes for hybrid search
        await this.client.createPayloadIndex(collectionName, {
          field_name: 'type',
          field_schema: 'keyword'
        });

        await this.client.createPayloadIndex(collectionName, {
          field_name: 'hasCode',
          field_schema: 'bool'
        });

        await this.client.createPayloadIndex(collectionName, {
          field_name: 'codeLanguage',
          field_schema: 'keyword'
        });

        await this.client.createPayloadIndex(collectionName, {
          field_name: 'importance',
          field_schema: 'keyword'
        });

        console.log(`[INTELLIGENT] Created collection with payload indexes: ${collectionName}`);
      }

      return collectionName;
    } catch (error) {
      throw new Error(`Failed to initialize collection: ${error}`);
    }
  }

  /**
   * Advanced hybrid search with filters
   */
  async searchDocuments(
    projectId: string,
    query: string,
    options: {
      limit?: number;
      filter?: {
        chunkType?: ChunkType;
        hasCode?: boolean;
        codeLanguage?: string;
        importance?: 'high' | 'medium' | 'low';
      };
    } = {}
  ) {
    const collectionName = `project_${projectId}`;
    const limit = options.limit || 5;

    try {
      const collections = await this.client.getCollections();
      const existingCollections = collections.collections.map(c => c.name);

      if (!existingCollections.includes(collectionName)) {
        return [];
      }

      const queryVector = await this.generateEmbedding(query);

      // Build filter conditions
      const filter: any = {};
      if (options.filter) {
        const must: any[] = [];

        if (options.filter.chunkType) {
          must.push({ key: 'type', match: { value: options.filter.chunkType } });
        }
        if (options.filter.hasCode !== undefined) {
          must.push({ key: 'hasCode', match: { value: options.filter.hasCode } });
        }
        if (options.filter.codeLanguage) {
          must.push({ key: 'codeLanguage', match: { value: options.filter.codeLanguage } });
        }
        if (options.filter.importance) {
          must.push({ key: 'importance', match: { value: options.filter.importance } });
        }

        if (must.length > 0) {
          filter.must = must;
        }
      }

      const result = await this.client.search(collectionName, {
        vector: queryVector,
        limit,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        with_payload: true,
      });

      return result.map(point => ({
        content: point.payload?.content,
        type: point.payload?.type,
        hierarchy: point.payload?.hierarchy,
        language: point.payload?.language,
        section: point.payload?.section,
        hasCode: point.payload?.hasCode,
        keywords: point.payload?.keywords,
        importance: point.payload?.importance,
        score: point.score,
        metadata: {
          filePath: point.payload?.filePath,
          frontmatter: point.payload?.frontmatter,
        }
      }));
    } catch (error) {
      throw new Error(`Search failed: ${error}`);
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
