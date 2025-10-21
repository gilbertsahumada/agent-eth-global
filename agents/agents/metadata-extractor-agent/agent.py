"""
Metadata Extractor Agent - ASI1 Powered
Analyzes markdown documentation and extracts technical metadata automatically.
Uses ASI1 API for intelligent content analysis.

REST Endpoint: POST /analyze
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from uagents import Agent, Context, Model
from openai import OpenAI
from pydantic import Field

# Load .env from the agent's directory
agent_dir = Path(__file__).parent
dotenv_path = agent_dir / '.env'
load_dotenv(dotenv_path=dotenv_path)

# ASI1 Configuration (using OpenAI-compatible interface)
client = OpenAI(
    base_url='https://api.asi1.ai/v1',
    api_key=os.getenv("ASI1_API_KEY")
)

# Agent Configuration
AGENT_NAME = "MetadataExtractorAgent"
agent = Agent(
    name=AGENT_NAME,
    port=8000,
    #endpoint=['http://localhost:8000/submit']
)

class MarkdownAnalysisRequest(Model):
    """Request model for markdown analysis"""
    markdown_content: str = Field(
        description="The markdown content to analyze (max ~8000 tokens)"
    )
    file_name: str = Field(
        description="Original filename for context",
        default="unknown.md"
    )

class CodeSnippet(Model):
    """Extracted code snippet with context"""
    language: str = Field(description="Programming language")
    code: str = Field(description="The code snippet")
    context: str = Field(description="Surrounding explanation/context")
    importance: str = Field(description="high/medium/low")

class ExtractedMetadata(Model):
    """Response model with extracted metadata"""
    tech_stack: list[str] = Field(
        description="Technologies and frameworks detected",
        default=[]
    )
    domain: str = Field(
        description="Primary domain (DeFi/NFT/Oracles/Infrastructure/DAO/Gaming/Tools/Smart Contracts/Other)",
        default="Other"
    )
    keywords: list[str] = Field(
        description="Important keywords (max 20)",
        default=[]
    )
    languages: list[str] = Field(
        description="Programming languages from code blocks",
        default=[]
    )
    description: str = Field(
        description="Auto-generated 1-2 sentence summary",
        default=""
    )
    code_snippets: list[dict] = Field(
        description="Extracted code snippets with context",
        default=[]
    )

# ============================================================================
# Prompt Template for ASI1
# ============================================================================

METADATA_EXTRACTION_PROMPT = """Extract metadata from the markdown documentation as JSON.

Return ONLY valid JSON (no markdown, no explanations) with these fields:

{
  "tech_stack": ["list of technologies, frameworks, libraries mentioned"],
  "domain": "DeFi|NFT|Gaming|Infrastructure|Oracles|Smart Contracts|Tools|DAO|Other",
  "keywords": ["15-20 important technical terms, function names, concepts"],
  "languages": ["programming languages from code blocks"],
  "description": "1-2 sentence summary",
  "code_snippets": [
    {
      "language": "the language",
      "code": "code sample (max 300 chars)",
      "context": "what it does",
      "importance": "high|medium|low"
    }
  ]
}

Rules:
- Extract all technologies from imports, installations, and text
- Identify programming languages from ```language code blocks
- Keywords: function names, concepts, actions (deploy, test, etc.)
- Code snippets: max 5, truncate if needed
- Empty arrays [] if nothing found
"""

# ============================================================================
# Analysis Function
# ============================================================================

def estimate_tokens(text: str) -> int:
    """Estimate token count (rough: 1 token ≈ 4 chars)"""
    return len(text) // 4

def analyze_markdown(markdown_content: str, file_name: str) -> dict:
    """
    Analyzes markdown content using ASI1 API

    Handles large files by chunking if necessary.

    Args:
        markdown_content: The markdown text to analyze
        file_name: Original filename for logging

    Returns:
        dict: Extracted metadata
    """
    try:
        # ASI1 extended limits: ~64k tokens total (input + output)
        # Reserve 10k for output, 2k for prompt = 52k for content (~200k chars)
        MAX_INPUT_TOKENS = 52000
        MAX_INPUT_CHARS = MAX_INPUT_TOKENS * 4  # ~208,000 chars

        content_tokens = estimate_tokens(markdown_content)
        prompt_tokens = estimate_tokens(METADATA_EXTRACTION_PROMPT)

        print(f"📊 Token estimation:")
        print(f"   - Content: ~{content_tokens:,} tokens ({len(markdown_content):,} chars)")
        print(f"   - Prompt: ~{prompt_tokens:,} tokens")
        print(f"   - Total input: ~{content_tokens + prompt_tokens:,} tokens")
        print(f"   - Limit: {MAX_INPUT_TOKENS:,} tokens")

        # Truncate if too long
        if len(markdown_content) > MAX_INPUT_CHARS:
            print(f"⚠️  WARNING: Content too large, truncating from {len(markdown_content):,} to {MAX_INPUT_CHARS:,} chars")
            markdown_content = markdown_content[:MAX_INPUT_CHARS] + "\n\n[... content truncated due to size ...]"

        # Call ASI1 API
        print(f"🔍 Calling ASI1 API (asi1-extended)...")
        response = client.chat.completions.create(
            model="asi1-extended",
            messages=[
                {
                    "role": "user",
                    "content": f"{METADATA_EXTRACTION_PROMPT}\n\nFile: {file_name}\n\nMarkdown Content:\n{markdown_content}"
                }
            ],
            max_tokens=10000  # Reserve for output
        )

        # Parse JSON response
        raw_content = response.choices[0].message.content

        if not raw_content:
            raise ValueError("ASI1 returned empty response")

        content = raw_content.strip()

        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        metadata = json.loads(content)

        # Validate and normalize
        result = {
            "tech_stack": metadata.get("tech_stack", [])[:30],  # Max 30
            "domain": metadata.get("domain", "Other"),
            "keywords": metadata.get("keywords", [])[:20],  # Max 20
            "languages": metadata.get("languages", []),
            "description": metadata.get("description", "")[:300],  # Max 300 chars
            "code_snippets": metadata.get("code_snippets", [])[:10]  # Max 10 snippets
        }

        return result

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        print(f"Response content: {content[:500]}")
        # Return empty metadata
        return {
            "tech_stack": [],
            "domain": "Other",
            "keywords": [],
            "languages": [],
            "description": "",
            "code_snippets": []
        }
    except Exception as e:
        print(f"❌ Error analyzing markdown: {e}")
        return {
            "tech_stack": [],
            "domain": "Other",
            "keywords": [],
            "languages": [],
            "description": "",
            "code_snippets": []
        }

# ============================================================================
# REST Endpoint Handler
# ============================================================================

@agent.on_rest_post("/analyze", MarkdownAnalysisRequest, ExtractedMetadata)
async def handle_analysis_request(ctx: Context, req: MarkdownAnalysisRequest) -> ExtractedMetadata:
    """
    REST endpoint for markdown analysis

    POST /analyze
    Body: { "markdown_content": "...", "file_name": "..." }
    Returns: ExtractedMetadata JSON

    Args:
        ctx: Agent context
        req: The markdown analysis request

    Returns:
        ExtractedMetadata: Extracted metadata as JSON
    """
    ctx.logger.info(f"📨 Received POST /analyze request")
    ctx.logger.info(f"📄 File: {req.file_name} ({len(req.markdown_content)} chars)")

    # Analyze the markdown
    metadata = analyze_markdown(req.markdown_content, req.file_name)

    ctx.logger.info(f"✅ Analysis complete!")
    ctx.logger.info(f"   - Tech Stack: {len(metadata['tech_stack'])} items")
    ctx.logger.info(f"   - Domain: {metadata['domain']}")
    ctx.logger.info(f"   - Keywords: {len(metadata['keywords'])} items")
    ctx.logger.info(f"   - Languages: {metadata['languages']}")
    ctx.logger.info(f"   - Code Snippets: {len(metadata['code_snippets'])} items")

    # Return response directly (REST endpoint)
    return ExtractedMetadata(**metadata)

# ============================================================================
# Startup
# ============================================================================

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 REST endpoint: POST /analyze")
    ctx.logger.info(f"🧠 Using ASI1 model: asi1-extended")
    ctx.logger.info(f"📝 Ready to analyze markdown documentation!")

if __name__ == "__main__":
    agent.run()
