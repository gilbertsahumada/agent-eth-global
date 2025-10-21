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
        # Truncate if too long (asi1-extended has larger context)
        # Limit to ~8000 tokens input (24000 chars) to leave room for response
        max_chars = 24000
        if len(markdown_content) > max_chars:
            print(f"⚠️  WARNING: Content truncated from {len(markdown_content)} to {max_chars} chars")
            markdown_content = markdown_content[:max_chars] + "\n\n[... content truncated ...]"

        # Debug logging
        print(f"🔍 DEBUG: Calling ASI1 API")
        print(f"   - Model: asi1-extended")
        print(f"   - Content length: {len(markdown_content)} chars")
        print(f"   - First 200 chars: {markdown_content[:200]}")

        # TEST 1: Try with MINIMAL prompt first
        print(f"\n🧪 TEST: Trying minimal prompt first...")
        test_response = client.chat.completions.create(
            model="asi1-extended",
            messages=[
                {
                    "role": "user",
                    #"content": "Say 'Hello World' and nothing else."
                    "content": f"{METADATA_EXTRACTION_PROMPT}\n\nFile: {file_name}\n\nMarkdown Content:\n{markdown_content}"
                }
            ],
            #temperature=0.1,
            max_tokens=64000
        )
        test_content = test_response.choices[0].message.content
        print(f"✅ TEST Result: '{test_content}' (length: {len(test_content) if test_content else 0})")

        if not test_content:
            print(f"❌ Even simple test failed! ASI1 API issue or config problem.")
            raise ValueError("ASI1 API not responding to simple prompts")

        print(f"✅ ASI1 works! Now trying with actual prompt...\n")

        # Call ASI1 API (asi1-extended for larger context)
        response = client.chat.completions.create(
            model="asi1-extended",
            messages=[
                {
                    "role": "user",
                    "content": f"{METADATA_EXTRACTION_PROMPT}\n\nFile: {file_name}\n\nMarkdown Content:\n{markdown_content}"
                    #"content": "How are you doing?"
                }
            ],
            #temperature=0.1,  # Lower temperature for analytical extraction
            max_tokens=64000
        )

        # DEEP DEBUG: Ver TODO el objeto de respuesta
        print(f"\n{'='*60}")
        print(f"🔍 DEEP DEBUG: Full ASI1 Response Object")
        print(f"{'='*60}")
        print(f"Response type: {type(response)}")
        print(f"Response object: {response}")
        print(f"\nDir(response): {dir(response)}")

        # Check if response has choices
        if hasattr(response, 'choices'):
            print(f"\n✅ Has choices: {len(response.choices)} choice(s)")
            if len(response.choices) > 0:
                choice = response.choices[0]
                print(f"Choice 0 type: {type(choice)}")
                print(f"Choice 0 object: {choice}")
                print(f"Dir(choice): {dir(choice)}")

                if hasattr(choice, 'message'):
                    print(f"\n✅ Has message")
                    msg = choice.message
                    print(f"Message type: {type(msg)}")
                    print(f"Message object: {msg}")
                    print(f"Dir(message): {dir(msg)}")

                    if hasattr(msg, 'content'):
                        print(f"\n✅ Has content: '{msg.content}'")
                    else:
                        print(f"\n❌ NO content attribute")
                else:
                    print(f"\n❌ NO message attribute")
        else:
            print(f"\n❌ NO choices attribute")

        print(f"{'='*60}\n")

        # Parse JSON response
        raw_content = response.choices[0].message.content

        # Debug logging
        print(f"🔍 DEBUG: ASI1 Response Content:")
        print(f"   - Raw content type: {type(raw_content)}")
        print(f"   - Raw content length: {len(raw_content) if raw_content else 0}")
        print(f"   - Raw content (first 500 chars): {raw_content[:500] if raw_content else 'EMPTY'}")

        if not raw_content:
            raise ValueError("ASI1 returned empty response")

        content = raw_content.strip()

        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        print(f"🔍 DEBUG: After cleanup:")
        print(f"   - Content (first 500 chars): {content[:500]}")

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
