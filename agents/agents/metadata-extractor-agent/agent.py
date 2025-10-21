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
    endpoint=['http://localhost:8000/submit']
)

# ============================================================================
# Pydantic Models for Request/Response
# ============================================================================

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

METADATA_EXTRACTION_PROMPT = """You are a technical documentation analyzer. Analyze the markdown content and extract metadata.

**Your task:**
Extract the following information from the markdown documentation:

1. **tech_stack**: List ALL technologies, frameworks, libraries, and tools mentioned
   - Examples: Hardhat, Solidity, Chainlink, Ethers.js, React, IPFS, The Graph, etc.
   - Look in code imports, installation instructions, and text mentions
   - Return as array of strings

2. **domain**: Classify into ONE primary category
   - Options: "DeFi", "NFT", "Gaming", "Infrastructure", "Oracles", "Smart Contracts", "Tools", "DAO", "Other"
   - Choose based on main focus of the documentation

3. **keywords**: Extract 15-20 most important technical terms
   - Include: function names, contract types, important concepts, actions (deploy, test, verify, etc.)
   - Focus on terms developers would search for

4. **languages**: List programming languages found in code blocks
   - Examples: solidity, javascript, typescript, python, rust, go, etc.
   - Extract from ```language code blocks

5. **description**: Write a 1-2 sentence summary of what this documentation covers
   - Be specific and actionable
   - Mention the main technology and what it helps accomplish

6. **code_snippets**: Extract ALL code blocks with context
   - For each code block, capture:
     - language: the programming language
     - code: the actual code (keep it complete, max 500 chars)
     - context: 1-2 sentences explaining what this code does (from surrounding text)
     - importance: "high" if it's a main example, "medium" if supporting, "low" if trivial

**IMPORTANT:**
- Return ONLY valid JSON, no markdown formatting, no explanations
- Use exact field names as specified above
- If you can't find something, use empty array [] or "Other" for domain
- For code_snippets, truncate long code to 500 chars with "..." if needed

**JSON Schema:**
{
  "tech_stack": ["..."],
  "domain": "...",
  "keywords": ["..."],
  "languages": ["..."],
  "description": "...",
  "code_snippets": [
    {
      "language": "...",
      "code": "...",
      "context": "...",
      "importance": "high"
    }
  ]
}
"""

# ============================================================================
# Analysis Function
# ============================================================================

def analyze_markdown(markdown_content: str, file_name: str) -> dict:
    """
    Analyzes markdown content using ASI1 API

    Args:
        markdown_content: The markdown text to analyze
        file_name: Original filename for logging

    Returns:
        dict: Extracted metadata
    """
    try:
        # Truncate if too long (ASI1 limit ~8000 tokens)
        max_chars = 25000  # ~8000 tokens approx
        if len(markdown_content) > max_chars:
            markdown_content = markdown_content[:max_chars] + "\n\n[... content truncated ...]"

        # Call ASI1 API
        response = client.chat.completions.create(
            model="asi1-fast-agentic",  # Fast model for metadata extraction
            messages=[
                {
                    "role": "system",
                    "content": METADATA_EXTRACTION_PROMPT
                },
                {
                    "role": "user",
                    "content": f"File: {file_name}\n\nMarkdown Content:\n{markdown_content}"
                }
            ],
            max_tokens=2000,
            temperature=0.3,  # Low temperature for consistent extraction
        )

        # Parse JSON response
        content = response.choices[0].message.content.strip()

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
    ctx.logger.info(f"🧠 Using ASI1 model: asi1-fast-agentic")
    ctx.logger.info(f"📝 Ready to analyze markdown documentation!")

if __name__ == "__main__":
    agent.run()
