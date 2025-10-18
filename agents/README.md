# ETH Global Hacker Assistant - Local Development Setup

A multi-agent AI system that helps hackathon participants with blockchain development by searching indexed documentation and providing intelligent responses using ASI-1 LLM with optional MeTTa symbolic reasoning.

## Architecture

```
User Query → Main Agent → Documentation Search → [MeTTa Reasoning] → ASI-1 LLM → Response
                ↓                                       ↑
           (AgentVerse)                          (Local/Mailbox)
```

## Components

### 1. Main Agent (ETHGlobalHackerAGENT)
- **Location**: `agents/main-agent/`
- **Deployment**: AgentVerse (deployed)
- **Address**: `agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt`
- **Port**: 8000 (when running locally)
- **Function**: Handles user queries, searches documentation, coordinates with MeTTa agent

### 2. MeTTa Reasoning Agent
- **Location**: `agents/metta-agent/`
- **Deployment**: Local or AgentVerse with **Mailbox enabled**
- **Address**: `agent1qdxqn3qrsxhsmmxhhjaf2ad4wprgn0jajfdzhhwkq3f5g5q6655cg9nepu4`
- **Port**: 8001 (when running locally)
- **Function**: Provides symbolic reasoning, dependency detection, execution order inference

### 3. Frontend & API
- **Repository**: Separate Next.js application
- **Deployment**: Vercel
- **URL**: https://agent-eth-global.vercel.app
- **Endpoints**:
  - `/api/projects` - Get indexed projects
  - `/api/search` - Search documentation

## Prerequisites

- Python 3.9+
- pip or poetry
- ASI-1 API key from [ASI-1 Dashboard](https://asi1.ai/dashboard/api-keys)
- Frontend deployed and accessible

## Local Development Setup

### Step 1: Clone and Install Dependencies

```bash
cd agents
pip install -r requirements.txt
```

**Required packages:**
```bash
pip install uagents uagents_core hyperon requests python-dotenv
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# ===================================
# API Keys
# ===================================

# ASI-1 LLM API Key (get from https://asi1.ai/dashboard/api-keys)
ASI1_API_KEY=your-asi1-api-key-here

# ===================================
# Next.js API Configuration
# ===================================

# Next.js API base URL (deployed frontend)
NEXT_API_BASE_URL=https://agent-eth-global.vercel.app/api

# ===================================
# Agent Addresses
# ===================================

# Main Agent Address (deployed on AgentVerse)
MAIN_AGENT_ADDRESS=agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt

# MeTTa Reasoning Agent Address (local or AgentVerse with mailbox)
METTA_AGENT_ADDRESS=agent1qdxqn3qrsxhsmmxhhjaf2ad4wprgn0jajfdzhhwkq3f5g5q6655cg9nepu4

# ===================================
# MeTTa Configuration
# ===================================

# Enable/disable MeTTa reasoning (set to false for faster responses)
# MeTTa adds symbolic reasoning but increases response time by ~5-10s
ENABLE_METTA_REASONING=true
```

### Step 3: Running the Agents

#### Option A: Quick Start with Startup Script (Recommended)

The easiest way to start both agents locally:

```bash
./start-local.sh
```

This script will:
- ✅ Check if `.env` file exists and is configured
- ✅ Verify Python 3 is installed
- ✅ Check/install dependencies from `requirements.txt`
- ✅ Start both agents in separate terminal tabs/windows
- ✅ Show helpful info about ports and addresses

**Supported platforms:**
- macOS: Opens new Terminal.app tabs
- Linux: Uses gnome-terminal or tmux
- Fallback: Runs in background with log files

#### Option B: Manual Start (Advanced)

**Terminal 1 - MeTTa Agent:**
```bash
cd agents/metta-agent
python3 metta-agent.py
```

**Expected output:**
```
🤖 MeTTaReasoningAgent started!
📍 Agent address: agent1qdxqn3qrsxhsmmxhhjaf2ad4wprgn0jajfdzhhwkq3f5g5q6655cg9nepu4
🌐 Listening on port 8001
🧠 MeTTa reasoning engine initialized
✅ Ready to process reasoning requests
```

**Terminal 2 - Main Agent:**
```bash
cd agents/main-agent
python3 agent.py
```

**Expected output:**
```
🤖 ETHGlobalHackerAGENT started!
📍 Agent address: agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt
🌐 Listening on port 8000
🧠 MeTTa reasoning: ENABLED
✅ Main agent configured
```

#### Option C: Use Deployed Agents (Production)

If both agents are deployed on AgentVerse with mailbox enabled, you don't need to run anything locally. Just interact with the main agent through AgentVerse or your client application.

### Step 4: Testing the Setup

Create a test script `test_agent.py`:

```python
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import (
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    EndSessionContent,
    chat_protocol_spec
)
from datetime import datetime, timezone
from uuid import uuid4

# Test agent
agent = Agent(
    name="test_user",
    endpoint="http://localhost:8000/submit",  # For local testing
)

# Main agent address
MAIN_AGENT_ADDRESS = "agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt"

@agent.on_event("startup")
async def send_test_query(ctx: Context):
    query = ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=[
            TextContent(text="How do I deploy a Solidity contract with Hardhat?")
        ]
    )
    await ctx.send(MAIN_AGENT_ADDRESS, query)
    ctx.logger.info("✅ Test query sent")

@agent.on_message(ChatMessage)
async def handle_response(ctx: Context, sender: str, msg: ChatMessage):
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info(f"📥 Response: {item.text}")

@agent.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"✅ Message acknowledged")

if __name__ == "__main__":
    agent.run()
```

Run the test:
```bash
python test_agent.py
```

## Important Notes

### MeTTa Agent - Mailbox Requirement

⚠️ **The MeTTa agent MUST have mailbox enabled** because:
- It needs to receive messages from the main agent asynchronously
- Mailbox allows it to work even when not continuously running
- Without mailbox, messages will be lost if the agent is offline

**To enable mailbox on AgentVerse:**
1. Go to your agent settings on AgentVerse
2. Enable "Mailbox" option
3. Redeploy the agent

### Running Modes

| Mode | Main Agent | MeTTa Agent | Use Case |
|------|------------|-------------|----------|
| **Production** | AgentVerse | AgentVerse (Mailbox) | Live deployment |
| **Development** | Local | Local | Full local testing |
| **Hybrid** | AgentVerse | Local | Test MeTTa changes |

### Performance Settings

**With MeTTa Reasoning:**
- Response time: ~7-13 seconds
- Includes symbolic analysis, dependency detection, execution order

**Without MeTTa Reasoning:**
- Response time: ~5-8 seconds
- Faster responses, but no symbolic reasoning

To disable MeTTa reasoning:
```bash
ENABLE_METTA_REASONING=false
```

## Frontend Setup

The frontend must be deployed and accessible. It provides:
- Documentation upload interface
- Project management
- Vector search API endpoints

**Current deployment:** https://agent-eth-global.vercel.app

**Required endpoints:**
- `GET /api/projects` - Returns list of indexed projects
- `GET /api/search?projectId=X&searchText=Y` - Searches documentation

## Special Commands

When interacting with the main agent, you can use:

- `/clear` or `/reset` or `/new` - Clear conversation history and start fresh

## Directory Structure

```
agents/
├── main-agent/
│   ├── agent.py                    # Main agent
│   └── README_AGENTVERSE.md        # AgentVerse deployment docs
├── metta-agent/
│   ├── metta-agent.py              # MeTTa reasoning agent
│   └── README_AGENTVERSE.md        # AgentVerse deployment docs
├── .env                            # Environment variables (create this)
├── .env.example                    # Environment template
├── requirements.txt                # Python dependencies
├── start-local.sh                  # Quick start script
└── README.md                       # This file
```

## Troubleshooting

### Error: "ASI1_API_KEY not configured"

**Solution:**
1. Get API key from https://asi1.ai/dashboard/api-keys
2. Add to `.env`: `ASI1_API_KEY=your-key-here`
3. Restart agents

### Error: "MeTTa agent timeout"

**Possible causes:**
- MeTTa agent not running
- MeTTa agent address incorrect
- Mailbox not enabled on AgentVerse

**Solution:**
1. Verify MeTTa agent is running (check logs)
2. Verify address in `.env` matches agent address
3. Enable mailbox on AgentVerse if deployed
4. Or set `ENABLE_METTA_REASONING=false` to bypass

### Error: "No projects found"

**Possible causes:**
- Frontend not accessible
- NEXT_API_BASE_URL incorrect
- No documentation uploaded yet

**Solution:**
1. Verify frontend is accessible: `curl https://agent-eth-global.vercel.app/api/projects`
2. Check NEXT_API_BASE_URL in `.env`
3. Upload documentation through frontend interface

### Response too slow

**Solution:**
- Disable MeTTa reasoning: `ENABLE_METTA_REASONING=false`
- Check network latency to frontend API
- Verify MeTTa agent is responsive

## Agent Communication Flow

```
1. User sends query to Main Agent
   ↓
2. Main Agent fetches projects from Frontend API
   ↓
3. Main Agent searches documentation via Frontend API
   ↓
4. Main Agent sends chunks to MeTTa Agent (if enabled)
   ↓
5. MeTTa Agent performs symbolic reasoning
   ↓
6. Main Agent receives reasoning results
   ↓
7. Main Agent sends everything to ASI-1 LLM
   ↓
8. Main Agent returns formatted response to User
```

## Development Tips

1. **Start with MeTTa disabled** for faster iteration:
   ```bash
   ENABLE_METTA_REASONING=false
   ```

2. **Monitor logs** to see timing breakdown:
   - Project fetching
   - Document search
   - MeTTa reasoning
   - LLM call

3. **Test locally first** before deploying to AgentVerse

4. **Use conversation memory** - the agent remembers context within a session

## API Endpoints Reference

### Frontend API

**Get Projects:**
```bash
GET https://agent-eth-global.vercel.app/api/projects
```

Response:
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "Hardhat Documentation",
      "description": "Smart contract development framework"
    }
  ],
  "count": 1
}
```

**Search Documentation:**
```bash
GET https://agent-eth-global.vercel.app/api/search?projectId=proj_123&searchText=deploy
```

Response:
```json
{
  "results": [
    {
      "content": "To deploy your contract...",
      "metadata": {
        "project_id": "proj_123",
        "section": "deployment"
      },
      "score": 0.95
    }
  ]
}
```

## Deployed Agents

### Main Agent (ETHGlobalHackerAGENT)
- **Address**: `agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt`
- **Platform**: AgentVerse
- **Documentation**: [agents/main-agent/README_AGENTVERSE.md](agents/main-agent/README_AGENTVERSE.md)

### MeTTa Reasoning Agent
- **Address**: `agent1qdxqn3qrsxhsmmxhhjaf2ad4wprgn0jajfdzhhwkq3f5g5q6655cg9nepu4`
- **Platform**: AgentVerse (Mailbox enabled) or Local
- **Documentation**: [agents/metta-agent/README_AGENTVERSE.md](agents/metta-agent/README_AGENTVERSE.md)

## License

Built for ETH Global Hackathon

## Credits

**Developed by [@gilbertsahumada](https://x.com/gilbertsahumada)**

Powered by ASI Alliance (ASI-1 LLM + MeTTa Reasoning)
