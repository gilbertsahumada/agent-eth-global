# 🏗️ Multi-Agent Documentation Assistant - Architecture

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Agent Ecosystem](#agent-ecosystem)
4. [Communication Protocol](#communication-protocol)
5. [Data Models](#data-models)
6. [Sequence Diagrams](#sequence-diagrams)
7. [Implementation Plan](#implementation-plan)
8. [Deployment Strategy](#deployment-strategy)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)

---

## 🎯 Overview

### Problem Statement
Developers need to search and understand documentation across multiple blockchain projects simultaneously. Current solutions provide basic search without intelligent reasoning, multi-project aggregation, or symbolic logic analysis.

### Solution
A **multi-agent system** that combines:
- **Vector search** (Qdrant) for semantic similarity
- **LLM reasoning** (ASI-1) for natural language understanding
- **Symbolic reasoning** (MeTTa) for logical inference and dependency detection
- **Agent orchestration** (uAgents) for distributed task execution

### Key Features
- ✅ Multi-project parallel search
- ✅ Intelligent project routing based on query context
- ✅ Hybrid reasoning (neural + symbolic)
- ✅ Dependency and conflict detection
- ✅ Code example generation
- ✅ Scalable agent architecture

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│                     (Chat via AgentVerse/DeltaV)                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT                              │
│  - Receives user query                                               │
│  - Coordinates all sub-agents                                        │
│  - Manages conversation flow                                         │
│  - Returns final synthesized answer                                  │
│  📍 Deployable on AgentVerse                                         │
└───────────┬─────────────────────────────────────────────────────────┘
            │
            │ Sends ProjectRouteRequest
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PROJECT ROUTER AGENT                             │
│  - Analyzes query to determine relevant projects                     │
│  - Uses keyword matching + semantic understanding                    │
│  - Returns prioritized list of project IDs                           │
│  📍 Deployable on AgentVerse                                         │
└───────────┬─────────────────────────────────────────────────────────┘
            │
            │ Returns ProjectRouteResponse
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SEARCH AGENT                                 │
│  - Performs parallel vector search across selected projects          │
│  - Queries Qdrant via Next.js API                                    │
│  - Aggregates and ranks results by relevance score                   │
│  - Returns top N chunks from all projects                            │
│  📍 Deployable on AgentVerse                                         │
└───────────┬─────────────────────────────────────────────────────────┘
            │
            │ Returns SearchResults
            ├──────────────────────┬──────────────────────┐
            ▼                      ▼                      ▼
┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   METTA REASONING   │  │   ASI-1 LLM      │  │  CODE EXAMPLE        │
│       AGENT         │  │   AGENT          │  │  GENERATOR AGENT     │
│                     │  │                  │  │                      │
│ - Symbolic logic    │  │ - Natural lang   │  │ - Extracts code      │
│ - Dependencies      │  │ - Semantic ans   │  │ - Formats examples   │
│ - Conflicts         │  │ - Explanations   │  │ - Adds comments      │
│ - Prerequisites     │  │                  │  │                      │
│                     │  │                  │  │                      │
│ 📍 LOCAL ONLY       │  │ 📍 Deployable    │  │ 📍 Deployable        │
│ (hyperon dep)       │  │ on AgentVerse    │  │ on AgentVerse        │
└─────────┬───────────┘  └────────┬─────────┘  └──────────┬───────────┘
          │                       │                       │
          │ MeTTaReasoningResponse│ LLMResponse           │ CodeExamples
          └───────────────────────┴───────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SYNTHESIS AGENT                                │
│  - Combines all agent outputs                                        │
│  - Creates coherent, structured response                             │
│  - Formats markdown with sections                                    │
│  - Includes sources and citations                                    │
│  📍 Deployable on AgentVerse                                         │
└───────────┬─────────────────────────────────────────────────────────┘
            │
            │ Returns SynthesizedResponse
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR AGENT                             │
│                  (Sends final answer to user)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Layer

```
┌──────────────────┐
│   PostgreSQL     │ ← Stores project metadata
│   (Supabase)     │   - Project names
│                  │   - Collection names
│                  │   - Tech stack, domains, tags
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Next.js API    │ ← REST API layer
│   (Vercel)       │   - /api/projects (GET all)
│                  │   - /api/docs (GET search)
│                  │   - /api/docs/multi-search (NEW)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     Qdrant       │ ← Vector database
│  (Cloud/Self)    │   - project_${id} collections
│                  │   - 1536-dim embeddings (OpenAI)
└──────────────────┘
```

---

## 🤖 Agent Ecosystem

### 1. **Orchestrator Agent** (Main Entry Point)

**File:** `singularity-metta/orchestrator_agent.py` (refactor from `agent_agentverse.py`)

**Purpose:**
- Receives user queries via ChatProtocol
- Coordinates all sub-agents in proper sequence
- Manages conversation state
- Returns synthesized final answer

**Dependencies (Deployable ✅):**
```python
uagents
uagents_core
requests
datetime
openai  # Only for ASI-1, optional if using dedicated LLM agent
```

**Agent Address:** `agent1q...` (to be generated on deployment)

**Incoming Messages:**
- `ChatMessage` (from user/AgentVerse)

**Outgoing Messages:**
- `ProjectRouteRequest` → Project Router Agent
- `SearchRequest` → Search Agent
- `MeTTaReasoningRequest` → MeTTa Agent (local)
- `LLMRequest` → ASI-1 LLM Agent
- `SynthesisRequest` → Synthesis Agent
- `ChatMessage` → User (final response)

**Key Methods:**
```python
@protocol.on_message(ChatMessage)
async def handle_user_query(ctx: Context, sender: str, msg: ChatMessage):
    # 1. Extract query
    # 2. Send to Project Router
    # 3. Wait for project selection
    # 4. Send to Search Agent
    # 5. Wait for search results
    # 6. Send to MeTTa, LLM, Code Gen in parallel
    # 7. Wait for all responses
    # 8. Send to Synthesis Agent
    # 9. Return final answer to user
```

---

### 2. **Project Router Agent**

**File:** `singularity-metta/project_router_agent.py` (NEW)

**Purpose:**
- Analyzes user query to determine which projects are most relevant
- Uses keyword matching, tech stack analysis, and domain classification
- Returns prioritized list of project IDs to search

**Dependencies (Deployable ✅):**
```python
uagents
uagents_core
requests  # To fetch projects from API
re  # For regex keyword matching
```

**Agent Address:** `agent1qPROJECT_ROUTER...` (to be registered)

**Incoming Messages:**
```python
class ProjectRouteRequest(Model):
    query: str
    user_address: str  # For response routing
```

**Outgoing Messages:**
```python
class ProjectRouteResponse(Model):
    selected_projects: List[Dict[str, str]]  # [{"id": "uuid", "name": "Solidity", "reason": "keyword match"}]
    all_projects_count: int
```

**Algorithm:**
```python
def route_projects(query: str, all_projects: List[Project]) -> List[Project]:
    scores = {}

    # Keyword matching
    keywords = {
        "solidity": ["solidity", "smart contract", "evm", "ethereum"],
        "hardhat": ["hardhat", "deploy", "testing", "compile"],
        "defi": ["defi", "liquidity", "swap", "lending"],
        # ... more
    }

    for project in all_projects:
        score = 0

        # Match query keywords with project tags/techStack
        for kw in extract_keywords(query):
            if kw in project.tags:
                score += 10
            if kw in project.techStack:
                score += 15
            if kw in project.name.lower():
                score += 20

        # Domain matching
        if detect_domain(query) == project.domain:
            score += 25

        scores[project.id] = score

    # Return top 3-5 projects with score > threshold
    sorted_projects = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [p for p, score in sorted_projects if score > 10][:5]
```

---

### 3. **Search Agent**

**File:** `singularity-metta/search_agent.py` (NEW)

**Purpose:**
- Performs parallel vector search across selected projects
- Calls Next.js API endpoints
- Aggregates and ranks results by similarity score
- Returns top N most relevant chunks

**Dependencies (Deployable ✅):**
```python
uagents
uagents_core
requests
asyncio  # For parallel requests
```

**Agent Address:** `agent1qSEARCH...`

**Incoming Messages:**
```python
class SearchRequest(Model):
    query: str
    project_ids: List[str]  # From Project Router
    top_k: int = 5  # Results per project
    user_address: str
```

**Outgoing Messages:**
```python
class SearchResponse(Model):
    chunks: List[Dict[str, Any]]  # Aggregated results
    total_results: int
    projects_searched: List[str]
```

**Chunk Format:**
```python
{
    "content": str,
    "project_name": str,
    "project_id": str,
    "file_path": str,
    "chunk_index": int,
    "score": float,
    "metadata": dict
}
```

**Implementation:**
```python
async def search_all_projects(query: str, project_ids: List[str]) -> List[Dict]:
    # Create parallel requests
    tasks = []
    for project_id in project_ids:
        task = search_single_project(project_id, query, top_k=5)
        tasks.append(task)

    # Execute in parallel
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Aggregate and sort
    all_chunks = []
    for result in results:
        if isinstance(result, list):
            all_chunks.extend(result)

    # Sort by score
    all_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)

    return all_chunks[:20]  # Top 20 overall
```

---

### 4. **MeTTa Reasoning Agent** (LOCAL)

**File:** `singularity-metta/metta_reasoning_agent.py` (enhance existing `metta_service_agentverse.py`)

**Purpose:**
- Performs symbolic reasoning on documentation chunks
- Detects dependencies, conflicts, prerequisites
- Infers execution order for implementation steps
- Identifies missing information or potential issues

**Dependencies (LOCAL ONLY ❌):**
```python
uagents
uagents_core
hyperon  # MeTTa interpreter - NOT available on AgentVerse
requests
```

**Agent Address:** `agent1qMETTA...` (local, must be running)

**Incoming Messages:**
```python
class MeTTaReasoningRequest(Model):
    query: str
    chunks: List[Dict[str, Any]]  # From Search Agent
    user_address: str
```

**Outgoing Messages:**
```python
class MeTTaReasoningResponse(Model):
    dependencies: List[str]  # ["requires web3.js v2.0", "needs Hardhat installed"]
    execution_order: List[str]  # ["1. Install deps", "2. Configure", "3. Deploy"]
    conflicts: List[str]  # ["Version mismatch detected"]
    prerequisites: List[str]  # ["Node.js 18+", "Ethereum wallet"]
    symbolic_facts: List[str]  # Raw MeTTa output
    confidence: float  # 0.0 - 1.0
```

**Enhanced MeTTa Reasoning:**
```python
def advanced_metta_reasoning(query: str, chunks: List[Dict]) -> MeTTaReasoningResponse:
    metta = MeTTa()

    # 1. Extract semantic entities from chunks
    facts = []
    for idx, chunk in enumerate(chunks):
        content = chunk["content"]

        # Detect key entities
        if "import" in content:
            imports = extract_imports(content)
            for imp in imports:
                facts.append(f"(requires chunk-{idx} {imp})")

        if "install" in content or "npm" in content:
            facts.append(f"(installation-step chunk-{idx})")

        if "deploy" in content:
            facts.append(f"(deployment-step chunk-{idx})")

        if "contract" in content:
            contracts = extract_contract_names(content)
            for contract in contracts:
                facts.append(f"(defines-contract chunk-{idx} {contract})")

        # Detect versions
        versions = extract_versions(content)  # regex for "v1.2.3" or "@version 1.0"
        for lib, ver in versions:
            facts.append(f"(uses-version chunk-{idx} {lib} {ver})")

    # 2. Define reasoning rules
    rules = """
    ; Dependency inference
    (= (depends-on $a $b)
       (if (and (requires $a $dep) (defines $b $dep))
           (dependency $a $b)))

    ; Conflict detection
    (= (conflict $a $b)
       (if (and (uses-version $a $lib $v1)
                (uses-version $b $lib $v2)
                (not (= $v1 $v2)))
           (version-conflict $lib $v1 $v2)))

    ; Execution order
    (= (before $a $b)
       (if (and (installation-step $a) (deployment-step $b))
           (must-precede $a $b)))

    ; Prerequisites
    (= (prerequisite $tech)
       (match &self (requires $chunk $tech)
              $tech))
    """

    # 3. Execute reasoning
    program = rules + "\n" + "\n".join(facts)
    results = metta.run(program)

    # 4. Parse results
    return MeTTaReasoningResponse(
        dependencies=parse_dependencies(results),
        execution_order=parse_execution_order(results),
        conflicts=parse_conflicts(results),
        prerequisites=parse_prerequisites(results),
        symbolic_facts=[str(r) for r in results],
        confidence=calculate_confidence(results)
    )
```

---

### 5. **ASI-1 LLM Agent**

**File:** `singularity-metta/llm_agent.py` (NEW)

**Purpose:**
- Generates natural language explanations
- Answers semantic questions about documentation
- Provides context and elaboration

**Dependencies (Deployable ✅):**
```python
uagents
uagents_core
openai  # ASI-1 client
```

**Agent Address:** `agent1qLLM...`

**Incoming Messages:**
```python
class LLMRequest(Model):
    query: str
    context_chunks: List[Dict[str, Any]]
    user_address: str
```

**Outgoing Messages:**
```python
class LLMResponse(Model):
    answer: str
    sources_used: List[str]  # Project names cited
    tokens_used: int
```

---

### 6. **Code Example Generator Agent**

**File:** `singularity-metta/code_generator_agent.py` (NEW)

**Purpose:**
- Extracts code snippets from documentation chunks
- Formats and adds comments
- Validates syntax when possible
- Provides runnable examples

**Dependencies (Deployable ✅):**
```python
uagents
uagents_core
re  # For code extraction
```

**Agent Address:** `agent1qCODEGEN...`

**Incoming Messages:**
```python
class CodeGenRequest(Model):
    query: str
    chunks: List[Dict[str, Any]]
    language: str = "javascript"  # or "solidity", "python"
    user_address: str
```

**Outgoing Messages:**
```python
class CodeGenResponse(Model):
    examples: List[CodeExample]

class CodeExample(Model):
    code: str
    language: str
    description: str
    source_project: str
    file_path: str
```

---

### 7. **Synthesis Agent**

**File:** `singularity-metta/synthesis_agent.py` (NEW)

**Purpose:**
- Combines outputs from MeTTa, LLM, and Code Gen agents
- Creates coherent, well-structured markdown response
- Adds sections, formatting, and citations
- Ensures consistent tone and quality

**Dependencies (Deployable ✅):**
```python
uagents
uagents_core
```

**Agent Address:** `agent1qSYNTHESIS...`

**Incoming Messages:**
```python
class SynthesisRequest(Model):
    query: str
    metta_reasoning: MeTTaReasoningResponse
    llm_response: LLMResponse
    code_examples: CodeGenResponse
    search_results: SearchResponse
    user_address: str
```

**Outgoing Messages:**
```python
class SynthesizedResponse(Model):
    markdown: str  # Formatted response
    structure: Dict[str, str]  # {"answer": "...", "code": "...", "reasoning": "..."}
```

**Output Template:**
```markdown
# Answer to: {query}

## Summary
{llm_response.answer}

## Implementation Steps
{metta_reasoning.execution_order formatted as numbered list}

## Code Examples
```{language}
{code_examples[0].code}
```

## Dependencies & Prerequisites
- {metta_reasoning.dependencies}
- {metta_reasoning.prerequisites}

## Important Considerations
{metta_reasoning.conflicts if any}

## Sources
- {search_results.projects_searched with counts}

---
*Powered by ASI Alliance Multi-Agent System*
```

---

## 📡 Communication Protocol

### Message Routing Strategy

All agents will use **directed messaging** (not broadcast) to specific agent addresses:

```python
# In orchestrator_agent.py
PROJECT_ROUTER_ADDRESS = "agent1qPROJECT_ROUTER..."
SEARCH_AGENT_ADDRESS = "agent1qSEARCH..."
METTA_AGENT_ADDRESS = "agent1qMETTA..." # Local address
LLM_AGENT_ADDRESS = "agent1qLLM..."
CODE_GEN_ADDRESS = "agent1qCODEGEN..."
SYNTHESIS_ADDRESS = "agent1qSYNTHESIS..."

@protocol.on_message(ChatMessage)
async def handle_user_query(ctx: Context, sender: str, msg: ChatMessage):
    # Step 1: Route to Project Router
    await ctx.send(
        PROJECT_ROUTER_ADDRESS,
        ProjectRouteRequest(query=query, user_address=ctx.agent.address)
    )

@protocol.on_message(ProjectRouteResponse)
async def handle_project_route(ctx: Context, sender: str, msg: ProjectRouteResponse):
    # Step 2: Route to Search Agent
    await ctx.send(
        SEARCH_AGENT_ADDRESS,
        SearchRequest(
            query=stored_query,
            project_ids=[p["id"] for p in msg.selected_projects],
            user_address=ctx.agent.address
        )
    )

@protocol.on_message(SearchResponse)
async def handle_search_results(ctx: Context, sender: str, msg: SearchResponse):
    # Step 3: Parallel requests to MeTTa, LLM, CodeGen
    await ctx.send(METTA_AGENT_ADDRESS, MeTTaReasoningRequest(...))
    await ctx.send(LLM_AGENT_ADDRESS, LLMRequest(...))
    await ctx.send(CODE_GEN_ADDRESS, CodeGenRequest(...))

    # Store partial responses, wait for all three

@protocol.on_message(MeTTaReasoningResponse)
async def handle_metta_response(ctx: Context, sender: str, msg: MeTTaReasoningResponse):
    ctx.storage.set("metta_response", msg)
    check_and_synthesize(ctx)

@protocol.on_message(LLMResponse)
async def handle_llm_response(ctx: Context, sender: str, msg: LLMResponse):
    ctx.storage.set("llm_response", msg)
    check_and_synthesize(ctx)

@protocol.on_message(CodeGenResponse)
async def handle_codegen_response(ctx: Context, sender: str, msg: CodeGenResponse):
    ctx.storage.set("codegen_response", msg)
    check_and_synthesize(ctx)

def check_and_synthesize(ctx: Context):
    # Check if all three responses are ready
    if all([
        ctx.storage.get("metta_response"),
        ctx.storage.get("llm_response"),
        ctx.storage.get("codegen_response")
    ]):
        # Step 4: Send to Synthesis Agent
        await ctx.send(
            SYNTHESIS_ADDRESS,
            SynthesisRequest(
                query=ctx.storage.get("query"),
                metta_reasoning=ctx.storage.get("metta_response"),
                llm_response=ctx.storage.get("llm_response"),
                code_examples=ctx.storage.get("codegen_response"),
                search_results=ctx.storage.get("search_response"),
                user_address=ctx.agent.address
            )
        )

@protocol.on_message(SynthesizedResponse)
async def handle_synthesis(ctx: Context, sender: str, msg: SynthesizedResponse):
    # Step 5: Return to user
    original_user = ctx.storage.get("original_user")
    await ctx.send(
        original_user,
        ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[
                TextContent(text=msg.markdown),
                EndSessionContent()
            ]
        )
    )
```

### State Management

Since agents are stateless, the **Orchestrator** must maintain conversation state:

```python
# Using ctx.storage for session management
ctx.storage.set(f"session_{msg.msg_id}", {
    "query": query,
    "original_user": sender,
    "project_route_response": None,
    "search_response": None,
    "metta_response": None,
    "llm_response": None,
    "codegen_response": None,
    "start_time": datetime.now(),
    "status": "routing_projects"
})
```

---

## 📊 Data Models

### Complete Model Definitions

```python
from uagents import Model
from typing import List, Dict, Any, Optional
from datetime import datetime

# ===== PROJECT ROUTING =====
class ProjectRouteRequest(Model):
    query: str
    user_address: str
    max_projects: int = 5

class ProjectRouteResponse(Model):
    selected_projects: List[Dict[str, Any]]  # [{"id": str, "name": str, "reason": str, "score": float}]
    all_projects_count: int
    routing_time_ms: float

# ===== SEARCH =====
class SearchRequest(Model):
    query: str
    project_ids: List[str]
    top_k: int = 5
    user_address: str

class SearchResponse(Model):
    chunks: List[Dict[str, Any]]
    total_results: int
    projects_searched: List[str]
    search_time_ms: float

# ===== METTA REASONING =====
class MeTTaReasoningRequest(Model):
    query: str
    chunks: List[Dict[str, Any]]
    user_address: str

class MeTTaReasoningResponse(Model):
    dependencies: List[str]
    execution_order: List[str]
    conflicts: List[str]
    prerequisites: List[str]
    symbolic_facts: List[str]
    confidence: float
    reasoning_time_ms: float

# ===== LLM =====
class LLMRequest(Model):
    query: str
    context_chunks: List[Dict[str, Any]]
    user_address: str
    max_tokens: int = 2048

class LLMResponse(Model):
    answer: str
    sources_used: List[str]
    tokens_used: int
    response_time_ms: float

# ===== CODE GENERATION =====
class CodeGenRequest(Model):
    query: str
    chunks: List[Dict[str, Any]]
    language: str = "javascript"
    user_address: str

class CodeExample(Model):
    code: str
    language: str
    description: str
    source_project: str
    file_path: str

class CodeGenResponse(Model):
    examples: List[CodeExample]
    generation_time_ms: float

# ===== SYNTHESIS =====
class SynthesisRequest(Model):
    query: str
    metta_reasoning: Optional[MeTTaReasoningResponse]
    llm_response: Optional[LLMResponse]
    code_examples: Optional[CodeGenResponse]
    search_results: SearchResponse
    user_address: str

class SynthesizedResponse(Model):
    markdown: str
    structure: Dict[str, str]
    total_time_ms: float
    agents_used: List[str]
```

---

## 🔄 Sequence Diagrams

### Full Query Flow

```
User                Orchestrator    ProjectRouter    Search    MeTTa    LLM    CodeGen    Synthesis
 |                       |                |            |         |       |        |           |
 |--ChatMessage--------->|                |            |         |       |        |           |
 |                       |                |            |         |       |        |           |
 |                       |--RouteReq----->|            |         |       |        |           |
 |                       |                |            |         |       |        |           |
 |                       |<--RouteResp----|            |         |       |        |           |
 |                       |                             |         |       |        |           |
 |                       |--SearchReq----------------->|         |       |        |           |
 |                       |                             |         |       |        |           |
 |                       |<--SearchResp----------------|         |       |        |           |
 |                       |                                       |       |        |           |
 |                       |--MeTTaReq----------------------------->|       |        |           |
 |                       |--LLMReq-------------------------------------->|        |           |
 |                       |--CodeGenReq------------------------------------------>|           |
 |                       |                                       |       |        |           |
 |                       |<--MeTTaResp----------------------------|       |        |           |
 |                       |<--LLMResp--------------------------------------|        |           |
 |                       |<--CodeGenResp------------------------------------------|           |
 |                       |                                                                    |
 |                       |--SynthesisReq-------------------------------------------------------->|
 |                       |                                                                    |
 |                       |<--SynthesizedResp----------------------------------------------------|
 |                       |                                                                    |
 |<--ChatMessage---------|                                                                    |
```

### Error Handling Flow

```
Orchestrator                 SubAgent
     |                          |
     |--Request---------------->|
     |                          |
     |                          X (timeout/error)
     |                          |
     |<--Error Response---------|
     |                          |
     |--Retry (max 2)---------->|
     |                          |
     |<--Success/Fallback-------|
```

Each agent should implement:
```python
@protocol.on_message(SomeRequest)
async def handle_request(ctx: Context, sender: str, msg: SomeRequest):
    try:
        result = await process_request(msg)
        await ctx.send(msg.user_address, SuccessResponse(...))
    except Exception as e:
        ctx.logger.error(f"Error: {e}")
        await ctx.send(msg.user_address, ErrorResponse(
            error=str(e),
            agent=ctx.agent.name,
            timestamp=datetime.now()
        ))
```

---

## 📝 Implementation Plan

### Phase 1: Core Infrastructure (Day 1 - Morning)

**Priority: HIGHEST**

1. **Update Database Schema** (30 mins)
   ```sql
   ALTER TABLE projects
   ADD COLUMN tech_stack TEXT[],
   ADD COLUMN domain TEXT,
   ADD COLUMN tags TEXT[],
   ADD COLUMN keywords TEXT[],
   ADD COLUMN document_count INTEGER DEFAULT 0;
   ```

2. **Create Multi-Search API Endpoint** (30 mins)
   - File: `front-end/app/api/docs/multi-search/route.ts`
   - Parallel search across multiple `project_${id}` collections
   - Use `Promise.all()` for parallel Qdrant queries

3. **Define All Data Models** (20 mins)
   - File: `singularity-metta/shared_models.py`
   - Import in all agent files

### Phase 2: Agent Implementation (Day 1 - Afternoon)

**Priority: HIGH**

4. **Project Router Agent** (45 mins)
   - Implement keyword + scoring algorithm
   - Test with sample queries
   - Deploy to AgentVerse

5. **Search Agent** (30 mins)
   - Parallel API calls to `/api/docs/multi-search`
   - Result aggregation and ranking
   - Deploy to AgentVerse

6. **Enhanced MeTTa Reasoning Agent** (1 hour)
   - Improve reasoning rules
   - Add entity extraction
   - Better conflict detection
   - Run locally, register address

7. **LLM Agent** (30 mins)
   - Wrapper around ASI-1
   - Context formatting
   - Deploy to AgentVerse

8. **Code Generator Agent** (30 mins)
   - Code extraction regex
   - Syntax detection
   - Deploy to AgentVerse

9. **Synthesis Agent** (45 mins)
   - Response templating
   - Markdown formatting
   - Deploy to AgentVerse

### Phase 3: Orchestration (Day 1 - Evening)

**Priority: CRITICAL**

10. **Refactor Orchestrator Agent** (1.5 hours)
    - State management
    - Sequential + parallel message handling
    - Error handling and retries
    - Timeout management
    - Deploy to AgentVerse

11. **Integration Testing** (1 hour)
    - Test full flow with sample queries
    - Verify all agent communications
    - Check error scenarios

### Phase 4: Polish & Demo (Day 2)

12. **Demo Preparation** (Morning)
    - Create sample queries showcasing multi-agent flow
    - Prepare visualization of agent communications
    - Test with multiple indexed projects

13. **Documentation** (Afternoon)
    - Update README with architecture diagram
    - Create demo video/screenshots
    - Write submission document

---

## 🚀 Deployment Strategy

### AgentVerse Deployable Agents

**Requirements:**
- Must use only these dependencies:
  - `uagents`
  - `uagents_core`
  - `requests`
  - `openai` (ASI-1 client)
  - Standard library (re, asyncio, datetime, etc.)

**Agents to Deploy:**
1. ✅ Orchestrator Agent
2. ✅ Project Router Agent
3. ✅ Search Agent
4. ✅ LLM Agent
5. ✅ Code Generator Agent
6. ✅ Synthesis Agent

**Deployment Steps:**
```bash
# For each agent
cd singularity-metta
python <agent_file>.py

# Get agent address from startup logs
# Register on agentverse.ai
# Update address constants in orchestrator
```

### Local-Only Agents

**MeTTa Reasoning Agent:**
```bash
cd singularity-metta
python metta_reasoning_agent.py

# Keep running on local machine
# Ensure orchestrator knows local address
```

**Environment Variables:**
```bash
# .env file
NEXT_API_BASE_URL=https://agent-eth-global.vercel.app/api
ASI1_API_KEY=your_asi1_key
METTA_AGENT_LOCAL_ADDRESS=agent1qMETTA...  # From local startup logs
```

---

## 🗄️ Database Schema

### Enhanced Projects Table

```typescript
// front-end/lib/db/schema.ts
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  collectionName: text('collection_name').notNull().unique(),
  description: text('description'),

  // NEW FIELDS
  techStack: text('tech_stack').array(),  // ['Solidity', 'Hardhat', 'OpenZeppelin']
  domain: text('domain'),  // 'DeFi', 'NFT', 'Gaming', 'Infrastructure'
  tags: text('tags').array(),  // ['smart-contracts', 'testing', 'deployment']
  keywords: text('keywords').array(),  // For quick routing: ['deploy', 'compile', 'test']
  documentCount: integer('document_count').default(0),
  lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('name_idx').on(table.name),
  collectionNameIdx: uniqueIndex('collection_name_idx').on(table.collectionName),
  domainIdx: index('domain_idx').on(table.domain),  // NEW: for faster domain queries
}));
```

### Migration Script

```typescript
// front-end/lib/db/migrations/add_project_metadata.ts
export async function up(db) {
  await db.schema
    .alterTable('projects')
    .addColumn('tech_stack', 'text[]')
    .addColumn('domain', 'text')
    .addColumn('tags', 'text[]')
    .addColumn('keywords', 'text[]')
    .addColumn('document_count', 'integer', (col) => col.defaultTo(0))
    .addColumn('last_indexed_at', 'timestamp with time zone')
    .execute();

  await db.schema
    .createIndex('domain_idx')
    .on('projects')
    .column('domain')
    .execute();
}
```

---

## 🌐 API Endpoints

### Existing Endpoints

#### GET `/api/projects`
Returns all indexed projects with metadata.

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Solidity Docs",
      "collectionName": "project_uuid",
      "description": "Official Solidity documentation",
      "techStack": ["Solidity", "EVM"],
      "domain": "Smart Contracts",
      "tags": ["language", "compiler"],
      "keywords": ["contract", "solidity", "pragma"],
      "documentCount": 150,
      "lastIndexedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### GET `/api/docs?projectId=...&searchText=...`
Searches a single project collection.

**Response:**
```json
{
  "results": [
    {
      "content": "...",
      "filePath": "...",
      "chunkIndex": 0,
      "metadata": {},
      "score": 0.95
    }
  ],
  "query": "how to deploy",
  "projectId": "uuid",
  "count": 5
}
```

### New Endpoints

#### POST `/api/docs/multi-search`

**Purpose:** Search across multiple project collections in parallel.

**Request:**
```json
{
  "projectIds": ["uuid1", "uuid2", "uuid3"],
  "searchText": "how to deploy smart contract",
  "topK": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "content": "...",
      "projectId": "uuid1",
      "projectName": "Hardhat Docs",
      "filePath": "...",
      "chunkIndex": 0,
      "score": 0.95,
      "metadata": {}
    }
  ],
  "totalResults": 15,
  "projectsSearched": ["Hardhat Docs", "Solidity Docs"],
  "searchTimeMs": 234
}
```

**Implementation:**
```typescript
// front-end/app/api/docs/multi-search/route.ts
import { QdranSimpleService } from "@/lib/qdrant-simple";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { projectIds, searchText, topK = 5 } = await req.json();

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: "projectIds array is required" },
        { status: 400 }
      );
    }

    if (!searchText) {
      return NextResponse.json(
        { error: "searchText is required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Fetch project details
    const projectDetails = await db
      .select()
      .from(projects)
      .where(inArray(projects.id, projectIds));

    const projectMap = new Map(
      projectDetails.map(p => [p.id, p.name])
    );

    // Parallel search across all projects
    const qdrantService = new QdranSimpleService();
    const searchPromises = projectIds.map(async (projectId) => {
      try {
        const results = await qdrantService.searchDocuments(
          projectId,
          searchText,
          topK
        );

        return results.map(r => ({
          ...r,
          projectId,
          projectName: projectMap.get(projectId) || "Unknown"
        }));
      } catch (error) {
        console.error(`Error searching project ${projectId}:`, error);
        return [];
      }
    });

    const allResults = await Promise.all(searchPromises);
    const flatResults = allResults.flat();

    // Sort by score
    flatResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    const searchTimeMs = Date.now() - startTime;

    return NextResponse.json({
      results: flatResults,
      totalResults: flatResults.length,
      projectsSearched: Array.from(new Set(flatResults.map(r => r.projectName))),
      searchTimeMs
    }, { status: 200 });

  } catch (error) {
    console.error('[API /docs/multi-search POST] Error:', error);
    return NextResponse.json(
      { error: `Failed to perform multi-search: ${error}` },
      { status: 500 }
    );
  }
}
```

---

## ✅ Testing Strategy

### Unit Tests (Per Agent)

```python
# test_project_router_agent.py
async def test_route_projects():
    query = "How to deploy a Solidity smart contract with Hardhat?"
    projects = [
        {"id": "1", "name": "Solidity", "techStack": ["Solidity"], "tags": ["language"]},
        {"id": "2", "name": "Hardhat", "techStack": ["Hardhat"], "tags": ["deployment"]},
        {"id": "3", "name": "React", "techStack": ["React"], "tags": ["frontend"]},
    ]

    selected = route_projects(query, projects)

    assert len(selected) == 2
    assert selected[0]["id"] in ["1", "2"]
    assert "3" not in [p["id"] for p in selected]
```

### Integration Tests

```python
# test_full_flow.py
async def test_orchestrator_flow():
    """Test complete user query → final answer flow"""

    # Start all agents locally
    # Send ChatMessage to orchestrator
    # Wait for final ChatMessage response
    # Assert response contains expected sections
    pass
```

### Manual Test Cases

1. **Single Project Query**
   - Query: "How to compile Solidity code?"
   - Expected: Routes to Solidity project only

2. **Multi-Project Query**
   - Query: "How to deploy smart contracts with Hardhat?"
   - Expected: Routes to both Solidity + Hardhat projects

3. **Complex Query with Dependencies**
   - Query: "Create an ERC20 token and deploy to testnet"
   - Expected: MeTTa detects execution order (create → compile → test → deploy)

4. **Error Handling**
   - Simulate MeTTa agent offline
   - Expected: Orchestrator returns answer without MeTTa reasoning

---

## 🎯 Success Metrics

### For Hackathon Judging

1. **Agent Count:** 6+ specialized agents (✅ Multi-agent requirement)
2. **MeTTa Integration:** Advanced symbolic reasoning (✅ ASI Alliance tech)
3. **ASI-1 LLM:** Used for semantic understanding (✅ ASI Alliance tech)
4. **Real Value:** Solves multi-project documentation search (✅ Practical use case)
5. **Scalability:** Can handle 10+ projects easily (✅ Architecture supports it)
6. **Demo Quality:** Clear visualization of agent communication (🎯 To be created)

### Technical KPIs

- **Response Time:** < 10 seconds end-to-end
- **Accuracy:** Top-3 results relevant in 90%+ of queries
- **Agent Uptime:** 99%+ (with fallback handling)
- **MeTTa Reasoning Quality:** Detects dependencies in 80%+ of cases

---

## 🔮 Future Enhancements

1. **Agent Learning:** Store successful query patterns to improve routing
2. **Caching Layer:** Cache frequent queries for faster responses
3. **Real-time Indexing:** Auto-index new documentation when added
4. **Multi-language Support:** Support docs in Spanish, Chinese, etc.
5. **Code Execution Agent:** Actually run code examples and verify outputs
6. **Visualization Dashboard:** Real-time agent communication graph
7. **User Feedback Loop:** Learn from user ratings of responses

---

## 📚 References

- [uAgents Documentation](https://fetch.ai/docs/guides/agents/getting-started/whats-an-agent)
- [AgentVerse Platform](https://agentverse.ai/)
- [MeTTa Language Spec](https://github.com/trueagi-io/hyperon-experimental)
- [ASI-1 LLM API](https://asi1.ai/docs)
- [Qdrant Vector Database](https://qdrant.tech/documentation/)

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Authors:** Gilbert Sahumada
**Status:** Ready for Implementation 🚀
