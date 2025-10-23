"""
Query Understanding Agent - ASI1 Powered
Analyzes user queries to extract intent and build dynamic search filters.
Uses ASI1 API for intelligent query interpretation.

REST Endpoint: POST /understand
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
AGENT_NAME = "QueryUnderstandingAgent"
agent = Agent(
    name=AGENT_NAME,
    port=8002,
    #endpoint=['http://localhost:8002/submit'],  # Updated by Agentverse on deploy
    mailbox=True,
)

class ProjectContext(Model):
    """Context about available projects"""
    id: str = Field(description="Project UUID")
    name: str = Field(description="Project name")
    domain: str = Field(description="Project domain", default="")
    tech_stack: list[str] = Field(description="Technologies used", default=[])
    keywords: list[str] = Field(description="Project keywords", default=[])

class QueryAnalysisRequest(Model):
    """Request model for query analysis"""
    query: str = Field(
        description="User's search query to analyze"
    )
    available_projects: list[dict] = Field(
        description="List of available projects with metadata",
        default=[]
    )

class QueryIntent(Model):
    """Response model with extracted query intent and filters"""
    wants_code: bool = Field(
        description="User wants code examples",
        default=False
    )
    languages: list[str] = Field(
        description="Specific programming languages mentioned",
        default=[]
    )
    technologies: list[str] = Field(
        description="Technologies/frameworks mentioned",
        default=[]
    )
    action: str = Field(
        description="Main action verb (deploy/test/compile/setup/install/verify/configure/etc)",
        default=""
    )
    domain: str = Field(
        description="Domain if mentioned (DeFi/NFT/Oracles/etc)",
        default=""
    )
    relevant_project_ids: list[str] = Field(
        description="Project IDs that are relevant to this query",
        default=[]
    )
    search_focus: str = Field(
        description="What aspect to prioritize: code/concepts/procedures/api",
        default="concepts"
    )

QUERY_UNDERSTANDING_PROMPT = """You are a query intent analyzer for technical documentation search.

**Your task:**
Analyze the user's query and extract search intent and filters.

**Available Projects:**
{projects_json}

**User Query:**
"{query}"

**Extract the following:**

1. **wants_code**: Does the user want code examples/snippets?
   - true if query mentions: "code", "example", "snippet", "how to", "implementation", etc.
   - false otherwise

2. **languages**: Which programming languages are mentioned?
   - Examples: solidity, javascript, typescript, python, rust, go, etc.
   - Empty array if none mentioned

3. **technologies**: Which technologies/frameworks are mentioned?
   - Examples: hardhat, chainlink, ethers.js, react, the graph, polygon, etc.
   - Match against tech_stack from available projects
   - Empty array if none mentioned

4. **action**: What is the main action/intent?
   - Common verbs: deploy, test, compile, setup, install, verify, configure, integrate, call, query, etc.
   - Empty string if no clear action

5. **domain**: Which domain is this query about?
   - Options: DeFi, NFT, Gaming, Infrastructure, Oracles, Smart Contracts, Tools, DAO
   - Match against project domains
   - Empty string if not clear

6. **relevant_project_ids**: Which project IDs are most relevant?
   - Analyze query against project metadata (name, domain, tech_stack, keywords)
   - Return array of project IDs that match the query
   - If query is generic, return ALL project IDs
   - If query is specific, return only matching project IDs (max 5)

7. **search_focus**: What to prioritize in search results?
   - "code": If user wants implementation/examples
   - "concepts": If user wants explanation/understanding
   - "procedures": If user wants step-by-step instructions
   - "api": If user wants API reference/function docs

**IMPORTANT:**
- Return ONLY valid JSON, no markdown formatting, no explanations
- Use exact field names as specified
- Be smart about project matching - consider synonyms and related terms
- Empty arrays/strings are valid when nothing is detected

**JSON Schema:**
{
  "wants_code": true/false,
  "languages": ["..."],
  "technologies": ["..."],
  "action": "...",
  "domain": "...",
  "relevant_project_ids": ["uuid1", "uuid2"],
  "search_focus": "code|concepts|procedures|api"
}
"""

# ============================================================================
# Analysis Function
# ============================================================================

def analyze_query(query: str, available_projects: list[dict]) -> dict:
    """
    Analyzes user query using ASI1 API

    Args:
        query: User's search query
        available_projects: List of project metadata dicts

    Returns:
        dict: Extracted query intent and filters
    """
    try:
        # Build projects context
        projects_summary = []
        for p in available_projects:
            projects_summary.append({
                "id": p.get("id", ""),
                "name": p.get("name", ""),
                "domain": p.get("domain", ""),
                "tech_stack": p.get("tech_stack", [])[:5],  # Limit to 5 for context
                "keywords": p.get("keywords", [])[:5]  # Limit to 5 for context
            })

        projects_json = json.dumps(projects_summary, indent=2)

        # Build prompt
        prompt = QUERY_UNDERSTANDING_PROMPT.format(
            projects_json=projects_json,
            query=query
        )

        # Call ASI1 API (asi1-extended for better analysis)
        print(f"🔍 Calling ASI1 API (asi1-extended) for query understanding...")
        response = client.chat.completions.create(
            model="asi1-extended",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=2000  # Sufficient for query analysis
        )

        # Parse JSON response
        content = response.choices[0].message.content.strip()

        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        intent = json.loads(content)

        # Validate and normalize
        result = {
            "wants_code": bool(intent.get("wants_code", False)),
            "languages": intent.get("languages", [])[:3],  # Max 3 languages
            "technologies": intent.get("technologies", [])[:5],  # Max 5 techs
            "action": intent.get("action", "")[:50],  # Max 50 chars
            "domain": intent.get("domain", "")[:50],  # Max 50 chars
            "relevant_project_ids": intent.get("relevant_project_ids", [])[:5],  # Max 5 projects
            "search_focus": intent.get("search_focus", "concepts")
        }

        # If no projects matched, include all (generic query)
        if not result["relevant_project_ids"] and available_projects:
            result["relevant_project_ids"] = [p.get("id") for p in available_projects[:5]]

        return result

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        print(f"Response content: {content[:500]}")
        # Return default intent
        return {
            "wants_code": False,
            "languages": [],
            "technologies": [],
            "action": "",
            "domain": "",
            "relevant_project_ids": [p.get("id") for p in available_projects[:5]],
            "search_focus": "concepts"
        }
    except Exception as e:
        print(f"❌ Error analyzing query: {e}")
        return {
            "wants_code": False,
            "languages": [],
            "technologies": [],
            "action": "",
            "domain": "",
            "relevant_project_ids": [p.get("id") for p in available_projects[:5]],
            "search_focus": "concepts"
        }

# ============================================================================
# REST Endpoint Handler
# ============================================================================

@agent.on_rest_post("/understand", QueryAnalysisRequest, QueryIntent)
async def handle_query_analysis(ctx: Context, req: QueryAnalysisRequest) -> QueryIntent:
    """
    REST endpoint for query understanding

    POST /understand
    Body: { "query": "...", "available_projects": [...] }
    Returns: QueryIntent JSON

    Args:
        ctx: Agent context
        req: The query analysis request

    Returns:
        QueryIntent: Extracted intent and filters as JSON
    """
    ctx.logger.info(f"📨 Received POST /understand request")
    ctx.logger.info(f"🔍 Query: {req.query}")
    ctx.logger.info(f"📚 Available projects: {len(req.available_projects)}")

    # Analyze the query
    intent = analyze_query(req.query, req.available_projects)

    ctx.logger.info(f"✅ Query analysis complete!")
    ctx.logger.info(f"   - Wants code: {intent['wants_code']}")
    ctx.logger.info(f"   - Languages: {intent['languages']}")
    ctx.logger.info(f"   - Technologies: {intent['technologies']}")
    ctx.logger.info(f"   - Action: {intent['action']}")
    ctx.logger.info(f"   - Domain: {intent['domain']}")
    ctx.logger.info(f"   - Relevant projects: {len(intent['relevant_project_ids'])}")
    ctx.logger.info(f"   - Search focus: {intent['search_focus']}")

    # Return response directly (REST endpoint)
    return QueryIntent(**intent)

# ============================================================================
# Startup
# ============================================================================

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 REST endpoint: POST /understand")
    ctx.logger.info(f"🧠 Using ASI1 model: asi1-extended")
    ctx.logger.info(f"🔍 Ready to analyze search queries!")

if __name__ == "__main__":
    agent.run()
