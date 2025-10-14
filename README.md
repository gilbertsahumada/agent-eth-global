# Singularity MeTTa Agent - RAG Documentation Assistant

An AI agent that searches documentation using RAG (Retrieval-Augmented Generation) with symbolic reasoning powered by Fetch.ai uAgents and Hyperon MeTTa.

## Quick Start

### 1. Setup Frontend

```bash
cd front-end
yarn install
```

Create `.env.local`:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
QDRANT_URL=https://your-cluster.aws.cloud.qdrant.io
QDRANT_API_KEY=your_api_key
OPENAI_API_KEY=your_openai_key
```

Initialize database:
```bash
yarn db:push
```

Start frontend:
```bash
yarn dev
# Runs on http://localhost:3000
```

### 2. Setup Agent

```bash
cd singularity-metta
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Start agent:
```bash
python agent.py
# Runs on http://localhost:8000
```

## How It Works

### Architecture

```
User Upload (.md) → Next.js → Supabase (metadata) + Qdrant (vectors)
                                           ↓
User Query → Python Agent → Next.js API → Search Qdrant
                    ↓
              MeTTa Reasoning → Response
```

### What the Agent Does

1. **Receives query** via `QueryMessage`
2. **Fetches projects** from `http://localhost:3000/api/projects`
3. **Searches docs** in each project via `/api/docs?projectId=X&searchText=Y`
4. **Ranks results** by relevance score
5. **Applies MeTTa reasoning** - symbolic logic over search results
6. **Returns response** with top 3 results + reasoning

### Agent Code Flow

```python
# agent.py
@agent.on_message(model=QueryMessage)
async def handle_query(ctx: Context, sender: str, msg: QueryMessage):
    # 1. Get all projects
    projects = get_projects()

    # 2. Search in each project
    for project in projects:
        results = search_docs(project_id, query)
        all_chunks.extend(results)

    # 3. Sort by score, take top 5
    top_chunks = sorted(all_chunks, key=score)[:5]

    # 4. Generate MeTTa reasoning
    reasoning = metta_reasoning(query, top_chunks)

    # 5. Send response
    await ctx.send(sender, ResponseMessage(response=final_response))
```

## Testing

### Option 1: Full Test (Recommended)

```bash
cd singularity-metta
source venv/bin/activate
python full_test.py
```

**What it does:**
- Fetches all indexed projects
- Searches for "How do I use Chainlink VRF?"
- Generates MeTTa reasoning
- Shows formatted results

**Output:**
```
Query: How do I use Chainlink VRF?
Step 1: Obteniendo proyectos...
1 proyecto(s) encontrado(s): chainlink vrf
Step 2: Buscando...
5 resultados encontrados
Step 3: Generando razonamiento MeTTa...
RESPUESTA FINAL:
1. [chainlink vrf] (Score: 0.6032)
   import { Aside, CodeSample }...
```

### Option 2: Web UI

1. Go to `http://localhost:3000`
2. Upload a `.md` file
3. Navigate to `/search`
4. Enter query and view results

### Option 3: Agent Direct (requires uAgent setup)

```bash
python test_query.py
```

## Project Structure

```
.
├── front-end/              # Next.js app (port 3000)
│   ├── app/
│   │   ├── api/
│   │   │   ├── projects/  # GET (list), POST (index file)
│   │   │   └── docs/      # GET (search)
│   │   ├── page.tsx       # Upload form
│   │   ├── projects/      # List projects
│   │   └── search/        # Search UI
│   └── lib/
│       ├── qdrant-simple.ts   # Vector search
│       └── supabase.ts        # Database client
│
└── singularity-metta/     # Python agent (port 8000)
    ├── agent.py           # Main uAgent with MeTTa
    ├── full_test.py       # Complete workflow test (recommended)
    ├── simple_test.py     # HTTP test
    └── test_query.py      # Inter-agent messaging test
```

## API Endpoints

### GET `/api/projects`
Returns all indexed projects

**Response:**
```json
{
  "projects": [{
    "id": "uuid",
    "name": "chainlink vrf",
    "description": "how to use chainlink vrf"
  }],
  "count": 1
}
```

### POST `/api/projects`
Index a new markdown file

**Request:**
```
Content-Type: multipart/form-data
file: [.md file]
name: "Project Name"
description: "Description"
```

### GET `/api/docs`
Search indexed documentation

**Query params:**
- `projectId`: UUID of project
- `searchText`: Query string

**Response:**
```json
{
  "results": [{
    "id": "chunk-id",
    "score": 0.8532,
    "content": "documentation text...",
    "filePath": "/uploads/file.md"
  }]
}
```

## MeTTa Reasoning Example

The agent converts search results into symbolic facts:

```metta
(bind $q "How do I use Chainlink VRF?")

; Facts from documentation
!(doc chunk-0 "import { Aside } from '@components'...")
!(doc chunk-1 "Create and fund a subscription...")

; Pattern matching
(match &self
    (doc $id $content)
    (if (find $content "contract")
        (print "This section involves smart contracts"))
)
```

MeTTa finds patterns and relationships that pure vector search misses.

## Troubleshooting

**Port in use:**
```bash
lsof -ti:3000 | xargs kill -9  # Kill frontend
lsof -ti:8000 | xargs kill -9  # Kill agent
```

**Agent not finding projects:**
- Ensure frontend is running on port 3000
- Check you've uploaded at least one .md file
- Verify `http://localhost:3000/api/projects` returns data

**No search results:**
- Check project exists in database
- Verify Qdrant collection was created
- Test query is relevant to indexed content

**MeTTa errors:**
- Ensure hyperon is installed: `pip list | grep hyperon`
- Check Python version: `python --version` (needs 3.12+)

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Agent**: Fetch.ai uAgents, Hyperon MeTTa, Python 3.12
- **Storage**: Supabase (PostgreSQL), Qdrant (vectors)
- **AI**: OpenAI embeddings (text-embedding-ada-002)

## Example Usage

**1. Index Chainlink VRF docs:**
```bash
# Frontend running on :3000
# Upload vrf.md file via web UI
# Name: "Chainlink VRF"
# Description: "VRF documentation"
```

**2. Query via agent:**
```bash
cd singularity-metta
source venv/bin/activate
python full_test.py
```

**3. Results:**
```
Top 3 chunks with scores 0.60, 0.55, 0.52
+ MeTTa symbolic reasoning
+ Combined intelligent response
```

## Notes

- Agent uses **local development seed** (commented out wallet funding)
- Frontend uses **server-side rendering** for API routes
- **Vector search** uses cosine similarity
- **Chunk size**: ~500 characters with overlap
- **Top results**: Returns 5 chunks, displays 3

## Built For

ETHGlobal Hackathon - Combining Fetch.ai agents with SingularityNET's symbolic AI

---

**Quick Commands:**
```bash
# Frontend
cd front-end && yarn dev

# Agent
cd singularity-metta && source venv/bin/activate && python agent.py

# Test
cd singularity-metta && source venv/bin/activate && python full_test.py
```
