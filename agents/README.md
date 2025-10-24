# ETH Global Hacker Assistant - Agents Setup

Multi-agent AI system for hackathon documentation assistance using ASI-1 LLM and MeTTa symbolic reasoning.

## Deployment URLs & Addresses

| Component | Deployment | Production URL | Agent Address | Agentverse Profile |
|-----------|------------|----------------|---------------|-------------------|
| **Front-end** | Vercel | https://agent-eth-global.vercel.app | - | - |
| **query-understanding-agent** | Render | https://agent-eth-global.onrender.com/understand | `agent1qfmp9p3pu30dytavsv874nlthn7rstgpqjmvpld0jh6nsduydqxpqqqkynr` | [View Profile](https://agentverse.ai/agents/details/agent1qfmp9p3pu30dytavsv874nlthn7rstgpqjmvpld0jh6nsduydqxpqqqkynr/profile) |
| **metadata-extractor-agent** | Local | http://localhost:8001/analyze | - | - |
| **main-agent** | Agentverse | Chat Protocol | `agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt` | [View Profile](https://agentverse.ai/agents/details/agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt/profile) |
| **metta-agent** | Agentverse | Chat Protocol | `agent1q28esldytcauznk5tex8ryx5u5xdcg97p85wcttyk437zz035pl8g0pt8sv` | [View Profile](https://agentverse.ai/agents/details/agent1q28esldytcauznk5tex8ryx5u5xdcg97p85wcttyk437zz035pl8g0pt8sv/profile) |

### Quick Access

- **Live App**: https://agent-eth-global.vercel.app
- **Query Understanding API**: https://agent-eth-global.onrender.com/understand
- **Query Understanding Agent (Agentverse)**: https://agentverse.ai/agents/details/agent1qfmp9p3pu30dytavsv874nlthn7rstgpqjmvpld0jh6nsduydqxpqqqkynr/profile
- **Main Agent Chat (Agentverse)**: https://agentverse.ai/agents/details/agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt/profile
- **Metadata Extraction API**: http://localhost:8001/analyze (requires local setup)

## 📊 Agent Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              USER INTERACTION (Vercel Frontend)              │
│           https://agent-eth-global.vercel.app                │
└──────────────────────────────────────────────────────────────┘
              │                                │
      ┌───────▼────────┐              ┌───────▼────────┐
      │  Upload Docs    │              │   Search Query │
      └───────┬────────┘              └───────┬────────┘
              │                                │
┌─────────────▼──────────────┐  ┌─────────────▼──────────────┐
│ 📍 HTTP API AGENTS          │  │ 🌐 AGENTVERSE (Optional)    │
├─────────────────────────────┤  ├─────────────────────────────┤
│ metadata-extractor-agent    │  │ main-agent                  │
│ Local: Port 8001            │  │ Chat & search coordination  │
│ Purpose: Auto metadata      │  │ Address: agent1qf26...      │
│                             │  │                             │
│ query-understanding-agent   │  │ metta-agent                 │
│ Render (Production)         │  │ Symbolic reasoning          │
│ https://...onrender.com     │  │ Address: agent1q28e...      │
│ Purpose: Intent analysis    │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

## 🎯 Agent Overview

### HTTP API Agents

These agents expose REST endpoints and can be deployed to cloud or run locally:

#### 1. **Query Understanding Agent** (`query-understanding-agent/`)
- **Port:** 8002
- **Deployment:** Render (Production) | Local (Development)
- **Production URL:** https://agent-eth-global.onrender.com/understand
- **Purpose:** Analyzes search queries to extract intent, technologies, and build dynamic filters using ASI-1
- **Used By:** `/api/docs/smart-search` (search endpoint)
- **Documentation:**
  - [README_AGENTVERSE.md](./agents/query-understanding-agent/README_AGENTVERSE.md) - Complete API reference
  - [README_LOCAL.md](./agents/query-understanding-agent/README_LOCAL.md) - Local development

#### 2. **Metadata Extractor Agent** (`metadata-extractor-agent/`)
- **Port:** 8001
- **Deployment:** Local (can be deployed to Render/Agentverse)
- **Purpose:** Automatically extracts tech stack, keywords, domain, and languages from uploaded markdown files using ASI-1
- **Used By:** `/api/sponsors` (upload endpoint)
- **Documentation:**
  - [README_AGENTVERSE.md](./agents/metadata-extractor-agent/README_AGENTVERSE.md) - Complete API reference
  - [README_LOCAL.md](./agents/metadata-extractor-agent/README_LOCAL.md) - Local development

### Optional Agentverse Agents

These agents can be deployed to Agentverse for chat functionality:

#### 3. **Main Agent** (`main-agent/`)
- **Port:** 8000 (local) or Agentverse
- **Address:** `agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt`
- **Purpose:** Handles user chat queries, searches documentation, coordinates with MeTTa agent
- **Documentation:** [README_AGENTVERSE.md](./agents/main-agent/README_AGENTVERSE.md)

#### 4. **MeTTa Reasoning Agent** (`metta-agent/`)
- **Port:** 8001 (local) or Agentverse (requires Mailbox)
- **Address:** `agent1q28esldytcauznk5tex8ryx5u5xdcg97p85wcttyk437zz035pl8g0pt8sv`
- **Purpose:** Provides symbolic reasoning and dependency detection
- **Documentation:** [README_AGENTVERSE.md](./agents/metta-agent/README_AGENTVERSE.md)

---

## 🚀 Quick Start for Hackathon

### Prerequisites

- Python 3.9+
- pip3
- ASI-1 API key from [asi1.ai/dashboard/api-keys](https://asi1.ai/dashboard/api-keys)

### Option 1: Use Production Services (Easiest)

The **query-understanding-agent** is already deployed on Render. You only need to run:

```bash
# Terminal 1 - Metadata Extractor Agent (for file uploads)
cd agents/metadata-extractor-agent
pip3 install -r requirements.txt
cp .env.example .env
# Edit .env and add: ASI1_API_KEY=your-key-here
./run_dev.sh
```

Then configure your frontend `.env.local`:
```bash
# Use production query understanding agent
QUERY_AGENT_URL=https://agent-eth-global.onrender.com/understand

# Use local metadata extractor
METADATA_AGENT_URL=http://localhost:8001/analyze
```

✅ **You're ready!** The frontend can now:
- Upload documentation with automatic metadata extraction (local agent)
- Search with intelligent query understanding (production agent on Render)

### Option 2: Run Everything Locally (Development)

If you want to modify the query-understanding-agent:

```bash
# Terminal 1 - Metadata Extractor Agent
cd agents/metadata-extractor-agent
pip3 install -r requirements.txt
cp .env.example .env
# Edit .env and add: ASI1_API_KEY=your-key-here
./run_dev.sh

# Terminal 2 - Query Understanding Agent
cd agents/query-understanding-agent
pip3 install -r requirements.txt
cp .env.example .env
# Edit .env and add: ASI1_API_KEY=your-key-here
./run_dev.sh
```

Then use local URLs in frontend `.env.local`:
```bash
QUERY_AGENT_URL=http://localhost:8002/understand
METADATA_AGENT_URL=http://localhost:8001/analyze
```

### Option 3: Full Setup with Chat Agents

If you also want chat functionality with Agentverse agents:

```bash
# Start local agents (from Option 1 or 2)
# Then also start:

# Terminal 3 - MeTTa Agent (optional, for symbolic reasoning)
cd agents/metta-agent
python3 metta-agent.py

# Terminal 4 - Main Agent (for chat interface)
cd agents/main-agent
python3 agent.py
```

Note: For production chat, deploy main-agent and metta-agent to Agentverse using the addresses from the table above.

---

## 📁 Directory Structure

```
agents/
├── agents/
│   ├── metadata-extractor-agent/
│   │   ├── agent.py                    # Metadata extraction agent
│   │   ├── requirements.txt            # Dependencies
│   │   ├── .env.example                # Environment template
│   │   ├── run_dev.sh                  # Hot-reload runner
│   │   ├── test_agent.sh               # Test script
│   │   └── README_LOCAL.md             # Setup docs
│   │
│   ├── query-understanding-agent/
│   │   ├── agent.py                    # Query analysis agent
│   │   ├── requirements.txt            # Dependencies
│   │   ├── .env.example                # Environment template
│   │   ├── run_dev.sh                  # Hot-reload runner
│   │   ├── test_agent.sh               # Test script
│   │   └── README_LOCAL.md             # Setup docs
│   │
│   ├── main-agent/
│   │   ├── agent.py                    # Main chat agent
│   │   └── README_AGENTVERSE.md        # Agentverse deployment
│   │
│   └── metta-agent/
│       ├── metta-agent.py              # Symbolic reasoning agent
│       └── README_AGENTVERSE.md        # Agentverse deployment
│
├── LOCAL_TESTING_GUIDE.md             # Complete testing guide
├── ARCHITECTURE.md                     # System architecture
└── README.md                           # This file
```

---

## 🔑 Environment Setup

### For Frontend (Next.js)

Create `.env.local` in the `front-end/` directory:

```bash
# Query Understanding Agent (Production on Render)
QUERY_AGENT_URL=https://agent-eth-global.onrender.com/understand

# Metadata Extractor Agent (Local)
METADATA_AGENT_URL=http://localhost:8001/analyze

# Or for local development of query-understanding:
# QUERY_AGENT_URL=http://localhost:8002/understand

# Qdrant, Supabase, etc. (see .env.example for full list)
```

### For Local Agents (metadata-extractor & query-understanding)

Create `.env` in each agent directory:

```bash
# ASI-1 API Key (get from https://asi1.ai/dashboard/api-keys)
ASI1_API_KEY=your_asi1_api_key_here
```

That's it! No other config needed for local agents.

### For Agentverse Agents (main-agent & metta-agent)

Create `.env` in the `agents/` root directory:

```bash
# ASI-1 LLM API Key
ASI1_API_KEY=your-asi1-api-key-here

# Next.js API base URL (deployed frontend)
NEXT_API_BASE_URL=https://agent-eth-global.vercel.app/api

# Main Agent Address (deployed on AgentVerse)
MAIN_AGENT_ADDRESS=agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt

# MeTTa Reasoning Agent Address
METTA_AGENT_ADDRESS=agent1q28esldytcauznk5tex8ryx5u5xdcg97p85wcttyk437zz035pl8g0pt8sv

# Enable/disable MeTTa reasoning
ENABLE_METTA_REASONING=true
```

---

## 🧪 Testing

### Test Metadata Extractor Agent

```bash
cd agents/metadata-extractor-agent
./test_agent.sh
```

Expected output: JSON with extracted metadata (tech_stack, domain, keywords, etc.)

### Test Query Understanding Agent

```bash
cd agents/query-understanding-agent
./test_agent.sh
```

Expected output: JSON with query intent (wants_code, languages, technologies, etc.)

### Test End-to-End

1. Start both local agents (ports 8001, 8002)
2. Start Next.js frontend (port 3000)
3. Upload a markdown file at http://localhost:3000
4. Check logs in agent terminals - you should see requests being processed

---

## 🛠️ Development Features

### Hot Reload

Both local agents include hot-reload scripts (`run_dev.sh`):
- Auto-restarts when you modify `agent.py`
- Perfect for iterative development
- No need to manually restart

### Logging

All agents include detailed logging:
- 📊 Token estimation and limits
- 🔍 Request/response details
- ⚠️ Warnings for truncation or errors
- ✅ Success confirmations

### Error Handling

- Automatic fallback to empty metadata if ASI-1 fails
- Truncation for oversized content (>208k chars)
- JSON parsing error recovery
- Network timeout handling

---

## ⚡ Performance

### Metadata Extractor Agent
- Model: `asi1-extended`
- Max tokens: 10,000 (output)
- Input limit: ~208,000 chars (~52k tokens)
- Average time: 3-7 seconds per file

### Query Understanding Agent
- Model: `asi1-extended`
- Max tokens: 2,000 (output)
- Average time: 1-3 seconds per query

---

## 🐛 Troubleshooting

### "ASI1_API_KEY not found"

**Solution:**
1. Create `.env` file in the agent directory
2. Add `ASI1_API_KEY=your-key-here`
3. Restart agent

### "Address already in use" (Port 8001 or 8002)

**Solution:**
```bash
# Find and kill process on port 8001 (metadata-extractor)
lsof -ti:8001 | xargs kill -9

# Or port 8002 (query-understanding, if running locally)
lsof -ti:8002 | xargs kill -9
```

### "Empty metadata returned"

**Possible causes:**
- ASI-1 API key invalid
- Content too large (check for truncation warning)
- Network issues

**Solution:**
- Verify API key
- Check agent logs for specific errors
- Try with smaller test file

### Frontend can't connect to agents

**Solution:**
1. **For production query-understanding-agent:**
   - URL is: `https://agent-eth-global.onrender.com/understand`
   - Test with: `curl https://agent-eth-global.onrender.com/understand -X POST -H "Content-Type: application/json" -d '{"query":"test","available_projects":[]}'`

2. **For local metadata-extractor-agent:**
   - Verify it's running: `curl http://localhost:8001/`
   - Check logs in terminal where agent is running

3. **Check `.env.local` in frontend:**
   ```bash
   QUERY_AGENT_URL=https://agent-eth-global.onrender.com/understand
   METADATA_AGENT_URL=http://localhost:8001/analyze
   ```

4. Restart Next.js dev server

---

## 📚 Additional Resources

- **[Full Testing Guide](./LOCAL_TESTING_GUIDE.md)** - Complete testing procedures
- **[System Architecture](./ARCHITECTURE.md)** - Detailed system design
- **[Frontend README](../front-end/README.md)** - Frontend setup
- **[Main README](../README.md)** - Project overview

---

## 💡 Tips for Hackathon Judges

**To quickly test the system:**

**Option A: Use Live Production System (0 setup required)**
- Visit https://agent-eth-global.vercel.app
- Browse pre-indexed hackathon sponsor documentation
- Test search with queries like "How do I deploy with Hardhat?"
- **Total time: 1 minute**

**Option B: Test File Upload Locally (5 minutes)**

1. **Setup metadata agent** (3 minutes):
   ```bash
   git clone <repo>
   cd agents/agents/metadata-extractor-agent
   pip3 install -r requirements.txt
   echo "ASI1_API_KEY=your-key" > .env
   ./run_dev.sh
   ```

2. **Start frontend** (2 minutes):
   ```bash
   cd ../../../front-end
   yarn install
   cp .env.example .env.local
   # Edit .env.local - use production query agent URL:
   # QUERY_AGENT_URL=https://agent-eth-global.onrender.com/understand
   # METADATA_AGENT_URL=http://localhost:8001/analyze
   yarn dev
   ```

3. **Test** (1 minute):
   - Go to http://localhost:3000
   - Upload any markdown file
   - See automatic metadata extraction!

**Total setup time: ~5-6 minutes** (reduced because query-understanding is already deployed)

---

## 🤝 Contributing

When adding new features to agents:
1. Test locally first with hot-reload
2. Update relevant README
3. Add tests if adding new functionality
4. Document any new environment variables

---

## 📝 License

Built for ETH Global Hackathon

## 👨‍💻 Credits

**Developed by [@gilbertsahumada](https://x.com/gilbertsahumada)**

Powered by ASI Alliance (ASI-1 LLM + MeTTa Reasoning)
