# ETH Global Hacker Assistant

AI-powered documentation assistant for hackathon participants. Search indexed blockchain documentation and get intelligent responses using ASI-1 LLM with optional MeTTa symbolic reasoning.

**Live Demo:** [https://agent-eth-global.vercel.app](https://agent-eth-global.vercel.app)

## 🏗️ Architecture

```
Frontend (Next.js + Vercel)
    ↓
Documentation Upload → Vector Embeddings → Qdrant
Project Management → Supabase (PostgreSQL)
    ↓
API Endpoints → AI Agents (AgentVerse)
    ↓
Main Agent → [MeTTa Reasoning] → ASI-1 LLM → Response
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
- [Main Agent](./agents/main-agent/README_AGENTVERSE.md) - Documentation search and LLM integration
- [MeTTa Agent](./agents/metta-agent/README_AGENTVERSE.md) - Symbolic reasoning service

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

**Agents:**
```bash
cd agents
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your ASI-1 API key
./start-local.sh
# MeTTa Agent: http://localhost:8001
# Main Agent: http://localhost:8000
```

## 🔑 Required API Keys

### For Frontend:
- **Supabase** - Database and auth ([supabase.com](https://supabase.com))
- **Qdrant** - Vector search ([qdrant.tech](https://qdrant.tech))
- **OpenAI** - Embeddings ([platform.openai.com](https://platform.openai.com))

### For Agents:
- **ASI-1** - LLM API ([asi1.ai/dashboard/api-keys](https://asi1.ai/dashboard/api-keys))

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
- **[Agents Setup Guide](./agents/README.md)** - Python agents, local development
- **[Main Agent - AgentVerse](./agents/main-agent/README_AGENTVERSE.md)** - Deployment docs
- **[MeTTa Agent - AgentVerse](./agents/metta-agent/README_AGENTVERSE.md)** - Reasoning service docs

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
- **Address:** `agent1qdxqn3qrsxhsmmxhhjaf2ad4wprgn0jajfdzhhwkq3f5g5q6655cg9nepu4`
- **Platform:** AgentVerse (Mailbox enabled)
- **Port (local):** 8001

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

# Start Agents (Quick)
cd agents && ./start-local.sh

# Start Agents (Manual)
cd agents/metta-agent && python3 metta-agent.py
cd agents/main-agent && python3 agent.py

# Database Management
cd front-end && yarn db:studio

# Install Dependencies
cd front-end && yarn install
cd agents && pip install -r requirements.txt
```
