# ETH Global Hacker Assistant - Agents Setup

Multi-agent AI system for hackathon documentation assistance using ASI-1 LLM and MeTTa symbolic reasoning.

## 📊 Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└─────────────────────────────────────────────────────────────┘
              │                                │
      ┌───────▼────────┐              ┌───────▼────────┐
      │  Upload Docs    │              │   Chat Query   │
      └───────┬────────┘              └───────┬────────┘
              │                                │
┌─────────────▼──────────────┐  ┌─────────────▼──────────────┐
│ 📍 LOCAL AGENTS (Required)  │  │ 🌐 AGENTVERSE (Optional)    │
├─────────────────────────────┤  ├─────────────────────────────┤
│ metadata-extractor-agent    │  │ main-agent                  │
│ Port: 8000                  │  │ Chat & search coordination  │
│ Purpose: Auto metadata      │  │                             │
│                             │  │ metta-agent                 │
│ query-understanding-agent   │  │ Symbolic reasoning          │
│ Port: 8001                  │  │                             │
│ Purpose: Intent analysis    │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

## 🎯 Agent Overview

### Required Local Agents

These agents MUST run locally because they receive direct HTTP POST requests from the Next.js frontend:

#### 1. **Metadata Extractor Agent** (`metadata-extractor-agent/`)
- **Port:** 8000
- **Deployment:** LOCAL ONLY
- **Purpose:** Automatically extracts tech stack, keywords, domain, and languages from uploaded markdown files using ASI-1
- **Used By:** `/api/projects` (upload endpoint)
- **Documentation:** [README_LOCAL.md](./agents/metadata-extractor-agent/README_LOCAL.md)

#### 2. **Query Understanding Agent** (`query-understanding-agent/`)
- **Port:** 8001
- **Deployment:** LOCAL ONLY
- **Purpose:** Analyzes search queries to extract intent, technologies, and build dynamic filters using ASI-1
- **Used By:** `/api/docs/smart-search` (search endpoint)
- **Documentation:** [README_LOCAL.md](./agents/query-understanding-agent/README_LOCAL.md)

### Optional Agentverse Agents

These agents can be deployed to Agentverse for chat functionality:

#### 3. **Main Agent** (`main-agent/`)
- **Port:** 8000 (local) or Agentverse
- **Address:** `agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt`
- **Purpose:** Handles user chat queries, searches documentation, coordinates with MeTTa agent
- **Documentation:** [README_AGENTVERSE.md](./agents/main-agent/README_AGENTVERSE.md)

#### 4. **MeTTa Reasoning Agent** (`metta-agent/`)
- **Port:** 8001 (local) or Agentverse (requires Mailbox)
- **Address:** `agent1qdxqn3qrsxhsmmxhhjaf2ad4wprgn0jajfdzhhwkq3f5g5q6655cg9nepu4`
- **Purpose:** Provides symbolic reasoning and dependency detection
- **Documentation:** [README_AGENTVERSE.md](./agents/metta-agent/README_AGENTVERSE.md)

---

## 🚀 Quick Start for Hackathon

### Prerequisites

- Python 3.9+
- pip3
- ASI-1 API key from [asi1.ai/dashboard/api-keys](https://asi1.ai/dashboard/api-keys)

### Option 1: Start Local Agents Only (Recommended)

This is the minimum setup needed for upload and search functionality:

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

✅ **You're ready!** The frontend can now:
- Upload documentation with automatic metadata extraction
- Search with intelligent query understanding

### Option 2: Full Setup (All Agents)

If you also want chat functionality:

```bash
# Start local agents (from Option 1)
# Then also start:

# Terminal 3 - MeTTa Agent
cd agents/metta-agent
python3 metta-agent.py

# Terminal 4 - Main Agent
cd agents/main-agent
python3 agent.py
```

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

### For Local Agents (metadata-agent & query-agent)

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
METTA_AGENT_ADDRESS=agent1qdxqn3qrsxhsmmxhhjaf2ad4wprgn0jajfdzhhwkq3f5g5q6655cg9nepu4

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

1. Start both local agents (ports 8000, 8001)
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

### "Address already in use" (Port 8000 or 8001)

**Solution:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
lsof -ti:8001 | xargs kill -9
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
1. Verify agents are running: `curl http://localhost:8000/` and `curl http://localhost:8001/`
2. Check `.env.local` in frontend has correct URLs
3. Restart Next.js dev server

---

## 📚 Additional Resources

- **[Full Testing Guide](./LOCAL_TESTING_GUIDE.md)** - Complete testing procedures
- **[System Architecture](./ARCHITECTURE.md)** - Detailed system design
- **[Frontend README](../front-end/README.md)** - Frontend setup
- **[Main README](../README.md)** - Project overview

---

## 💡 Tips for Hackathon Judges

**To quickly test the system:**

1. **Clone and setup** (5 minutes):
   ```bash
   git clone <repo>
   cd agents/agents/metadata-extractor-agent
   pip3 install -r requirements.txt
   echo "ASI1_API_KEY=your-key" > .env
   ./run_dev.sh
   ```

2. **In another terminal** (2 minutes):
   ```bash
   cd ../query-understanding-agent
   pip3 install -r requirements.txt
   echo "ASI1_API_KEY=your-key" > .env
   ./run_dev.sh
   ```

3. **Start frontend** (2 minutes):
   ```bash
   cd ../../../front-end
   yarn install
   cp .env.example .env.local
   # Edit .env.local with your keys
   yarn dev
   ```

4. **Test** (1 minute):
   - Go to http://localhost:3000
   - Upload any markdown file
   - See automatic metadata extraction!

**Total setup time: ~10 minutes**

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
