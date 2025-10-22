# ETH Global Hacker Assistant

AI-powered documentation assistant for hackathon participants. Search indexed blockchain documentation and get intelligent responses using ASI-1 LLM with optional MeTTa symbolic reasoning.

**Live Demo:** [https://agent-eth-global.vercel.app](https://agent-eth-global.vercel.app)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                                │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
         ┌───────▼────────┐              ┌──────▼──────┐
         │  1. UPLOAD     │              │  2. CHAT    │
         │  Documentation │              │  with Agent │
         └───────┬────────┘              └──────┬──────┘
                 │                               │
                 │                               │
┌────────────────▼────────────────────────────────────────────────────────┐
│                         NEXT.JS FRONTEND/BACKEND                        │
└─────────────────────────────────────────────────────────────────────────┘
                 │                               │
         ┌───────▼────────┐              ┌──────▼──────────┐
         │ /api/projects  │              │  main-agent.py  │
         │ (POST)         │              │  (uAgent)       │
         └───────┬────────┘              └──────┬──────────┘
                 │                               │
                 │ 1. Reads .md file             │ 1. Gets user query
                 │ 2. Calls ──────┐              │ 2. Calls ──────┐
                 │                │              │                │
                 ▼                │              ▼                │
    ┌────────────────────────┐   │   ┌────────────────────────┐ │
    │  metadata-agent        │◄──┘   │  /api/docs/smart-search│◄┘
    │  (LOCAL - Port 8000)   │        │  (POST)                │
    │  POST /analyze         │        └──────────┬─────────────┘
    └──────────┬─────────────┘                   │
               │                                 │ 1. Calls ─────┐
        ┌──────▼──────────┐                     │               │
        │  ASI1 API       │                     ▼               │
        │  asi1-extended  │          ┌────────────────────────┐ │
        │                 │          │  query-agent           │◄┘
        │  Extracts:      │          │  (LOCAL - Port 8001)   │
        │  - tech_stack   │          │  POST /understand      │
        │  - keywords     │          └──────────┬─────────────┘
        │  - domain       │                     │
        │  - languages    │              ┌──────▼──────────┐
        │  - code snippets│              │  ASI1 API       │
        └──────────┬──────┘              │  asi1-extended  │
                   │                     │                 │
                   │ Returns metadata    │  Understands:   │
                   │                     │  - wants_code   │
                   ▼                     │  - languages    │
    ┌─────────────────────────┐         │  - technologies │
    │  Qdrant Intelligent     │         │  - action       │
    │  Service                │         │  - domain       │
    │                         │         │  - projects     │
    │  1. Parses markdown     │         └──────────┬──────┘
    │  2. Semantic chunking   │                    │
    │  3. Extracts code       │                    │ Returns intent
    │  4. Generates embeddings│                    │
    │  5. Stores in Qdrant    │                    ▼
    └────┬──────────────┬─────┘         ┌────────────────────────┐
         │              │               │  Qdrant Intelligent    │
         │              │               │  Service               │
         ▼              ▼               │                        │
┌──────────────┐  ┌──────────────┐     │  Searches with:        │
│   Supabase   │  │   Qdrant     │     │  - Dynamic filters     │
│   Database   │  │ Vector Store │     │  - hasCode: true/false │
│              │  │              │     │  - language: solidity  │
│  projects    │  │ Collections: │     │  - Semantic ranking    │
│  └─id        │  │ project_uuid │     └────────────┬───────────┘
│  └─name      │  │              │                  │
│  └─tech_stack│  │ Payloads:    │                  │ Returns chunks
│  └─domain    │  │ - content    │                  │
│  └─keywords  │  │ - type       │                  ▼
│              │  │ - hierarchy  │         ┌────────────────────┐
│project_docs  │  │ - hasCode    │         │  Back to           │
│  └─file_path │  │ - language   │         │  main-agent.py     │
│  └─file_name │  │ - keywords   │         └──────────┬─────────┘
└──────────────┘  └──────────────┘                    │
                                                      │
                                           ┌──────────▼──────────┐
                                           │  MeTTa Agent        │
                                           │  (Optional)         │
                                           │                     │
                                           │  Symbolic reasoning │
                                           │  on chunks          │
                                           └──────────┬──────────┘
                                                      │
                                           ┌──────────▼──────────┐
                                           │  ASI1 API           │
                                           │  asi1-extended      │
                                           │                     │
                                           │  Generates answer   │
                                           │  with context       │
                                           └──────────┬──────────┘
                                                      │
                                                      ▼
                                           ┌────────────────────┐
                                           │  Response to User  │
                                           └────────────────────┘
```

## 📦 Project Structure

This monorepo contains two main components:

### 1. Frontend (`/front-end`)
Next.js application for documentation management and vector search API.

**Tech Stack:**
- Next.js 15.5.4 (App Router + Turbopack)
- Supabase (PostgreSQL + Drizzle ORM)
- Qdrant (Vector Search)
- OpenAI (Embeddings)
- Tailwind CSS 4

**[📖 Frontend README →](./front-end/README.md)**

### 2. AI Agents (`/agents`)
Multi-agent system using Fetch.ai uAgents framework with MeTTa symbolic reasoning.

**Tech Stack:**
- Fetch.ai uAgents + uAgents Core
- ASI-1 LLM (ASI Alliance)
- Hyperon MeTTa (Symbolic AI)
- Python 3.9+

**[📖 Agents README →](./agents/README.md)**

**Individual Agent Documentation:**
- [Main Agent](./agents/agents/main-agent/README_AGENTVERSE.md) - Documentation search and LLM integration (Agentverse)
- [MeTTa Agent](./agents/agents/metta-agent/README_AGENTVERSE.md) - Symbolic reasoning service (Agentverse)
- [Metadata Agent](./agents/agents/metadata-extractor-agent/README_LOCAL.md) - Auto metadata extraction (LOCAL)
- [Query Agent](./agents/agents/query-understanding-agent/README_LOCAL.md) - Query intent analysis (LOCAL)

## 🚀 Quick Start

### Option 1: Use Deployed Version (Recommended)

Interact with the deployed agents on AgentVerse:

**Main Agent:** `agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt`

See [Agent Usage Guide](./agents/README.md#step-4-testing-the-setup) for examples.

### Option 2: Run Locally

**Frontend:**
```bash
cd front-end
yarn install
cp .env.example .env.local
# Edit .env.local with your API keys
yarn db:push
yarn dev
# Runs on http://localhost:3000
```

**Local Agents** (Required for upload/search):
```bash
cd agents/agents

# Terminal 1 - Metadata Extractor Agent
cd metadata-extractor-agent
pip3 install -r requirements.txt
cp .env.example .env
# Edit .env with your ASI1_API_KEY
./run_dev.sh  # Runs on http://localhost:8001

# Terminal 2 - Query Understanding Agent
cd ../query-understanding-agent
pip3 install -r requirements.txt
cp .env.example .env
# Edit .env with your ASI1_API_KEY
./run_dev.sh  # Runs on http://localhost:8001
```

**Agentverse Agents** (Optional for chat functionality):
```bash
cd agents/agents

# Main Agent & MeTTa Agent
# See agents/README.md for deployment instructions
```

## 🔑 Required API Keys

### For Frontend:
- **Supabase** - Database and auth ([supabase.com](https://supabase.com))
- **Qdrant** - Vector search ([qdrant.tech](https://qdrant.tech))
- **OpenAI** - Embeddings ([platform.openai.com](https://platform.openai.com))

### For Local Agents (Required):
- **ASI-1** - LLM API for metadata-agent and query-agent ([asi1.ai/dashboard/api-keys](https://asi1.ai/dashboard/api-keys))
  - Used by metadata-extractor-agent (port 8001)
  - Used by query-understanding-agent (port 8002)

### AgentVerse Deployment Note:
⚠️ If deploying agents to AgentVerse, remember to set environment variables in the AgentVerse UI:
1. Go to your agent settings
2. Add `ASI1_API_KEY` in Environment Variables section
3. Add `NEXT_API_BASE_URL=https://agent-eth-global.vercel.app/api`
4. Enable **Mailbox** for MeTTa agent
5. Redeploy

## 📚 Features

### Documentation Management
- Upload markdown files with project metadata
- Automatic text chunking and embedding generation
- Vector storage for semantic search
- Project organization by tech stack, domain, and tags

### AI-Powered Search
- Semantic search across multiple projects
- MeTTa symbolic reasoning for dependency detection
- ASI-1 LLM for intelligent responses
- Conversation memory per user

### Special Commands
- `/clear`, `/reset`, `/new` - Clear conversation history

## 🎯 Use Cases

Perfect for:
- 🏆 Hackathon participants needing quick implementation guidance
- 📖 Developers learning new blockchain technologies
- 🔧 Debugging and troubleshooting smart contracts
- 💡 Exploring best practices and patterns

## ⚡ Performance

**With MeTTa Reasoning:**
- Response time: ~7-13 seconds
- Includes symbolic analysis, dependency detection

**Without MeTTa Reasoning:**
- Response time: ~5-8 seconds
- Faster responses, basic search only

Set `ENABLE_METTA_REASONING=false` in `.env` for faster responses.

## 📖 Documentation

- **[Frontend Setup Guide](./front-end/README.md)** - Next.js app, database, API endpoints
- **[Agents Setup Guide](./agents/README.md)** - All agents setup and deployment
- **[Metadata Agent - Local](./agents/agents/metadata-extractor-agent/README_LOCAL.md)** - Auto metadata extraction
- **[Query Agent - Local](./agents/agents/query-understanding-agent/README_LOCAL.md)** - Query intent analysis
- **[Main Agent - AgentVerse](./agents/agents/main-agent/README_AGENTVERSE.md)** - Documentation search agent
- **[MeTTa Agent - AgentVerse](./agents/agents/metta-agent/README_AGENTVERSE.md)** - Symbolic reasoning service

## 🛠️ Tech Stack Summary

| Component | Technologies |
|-----------|-------------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Vercel |
| **Database** | Supabase (PostgreSQL), Drizzle ORM |
| **Vector Search** | Qdrant Cloud |
| **AI/LLM** | ASI-1 (ASI Alliance), OpenAI Embeddings |
| **Agents** | Fetch.ai uAgents, uAgents Core |
| **Symbolic AI** | Hyperon MeTTa |
| **Package Manager** | Yarn (Frontend), pip (Agents) |

## 🌐 Deployed Agents

### Main Agent (ETHGlobalHackerAGENT)
- **Address:** `agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt`
- **Platform:** AgentVerse
- **Port (local):** 8000

### MeTTa Reasoning Agent
- **Address:** `agent1q28esldytcauznk5tex8ryx5u5xdcg97p85wcttyk437zz035pl8g0pt8sv`
- **Platform:** AgentVerse (Mailbox enabled)
- **Port (local):** 8000

## 🤝 Contributing

When adding new features:
1. Update schemas and types
2. Test locally first
3. Update relevant README
4. Deploy to staging before production

## 📝 License

Built for ETH Global Hackathon

## 👨‍💻 Credits

**Developed by [@gilbertsahumada](https://x.com/gilbertsahumada)**

Powered by ASI Alliance (ASI-1 LLM + MeTTa Reasoning)

---

## Quick Commands

```bash
# Start Frontend
cd front-end && yarn dev

# Start Local Agents (Required for upload/search)
cd agents/agents/metadata-extractor-agent && ./run_dev.sh  # Terminal 1
cd agents/agents/query-understanding-agent && ./run_dev.sh  # Terminal 2

# Start Agentverse Agents (Optional - for chat)
cd agents/agents/metta-agent && python3 metta-agent.py  # Terminal 3
cd agents/agents/main-agent && python3 agent.py         # Terminal 4

# Database Management
cd front-end && yarn db:studio

# Install Dependencies
cd front-end && yarn install
cd agents/agents/metadata-extractor-agent && pip3 install -r requirements.txt
cd agents/agents/query-understanding-agent && pip3 install -r requirements.txt
```
