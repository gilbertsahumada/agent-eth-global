# MeTTa Reasoning Service + Agent

This project combines a fetch.ai uAgent with a MeTTa symbolic reasoning service for ETHGlobal hackathon documentation queries.

## Architecture

The project is split into two deployable components:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Agentverse.ai  │────────>│  MeTTa Service   │<────────│  Next.js API    │
│  (Agent)        │   HTTP  │  (Render/Railway)│         │  (Vercel)       │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Components

1. **agent_agentverse.py** - Main agent for deployment on agentverse.ai (no MeTTa dependencies)
2. **metta_service.py** - FastAPI service with MeTTa symbolic reasoning (deployed separately)

## Files

- `agent_agentverse.py` - Agent for agentverse.ai deployment
- `metta_service.py` - MeTTa reasoning service (FastAPI)
- `requirements_agentverse.txt` - Dependencies for the agent
- `requirements_metta.txt` - Dependencies for MeTTa service
- `DEPLOYMENT.md` - Full deployment guide (Spanish)
- `build.sh` - Build script for advanced deployments

## Quick Deploy: MeTTa Service on Render

### Prerequisites

1. GitHub account
2. Render account (sign up at https://render.com)

### Deployment Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Deploy MeTTa service"
   git push origin main
   ```

2. **Create new Web Service on Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service**

   | Setting | Value |
   |---------|-------|
   | **Name** | `metta-reasoning-service` |
   | **Root Directory** | `singularity-metta` |
   | **Environment** | `Python 3` |
   | **Build Command** | `pip install --upgrade pip && pip install -r requirements_metta.txt` |
   | **Start Command** | `uvicorn metta_service:app --host 0.0.0.0 --port $PORT` |

4. **Environment Variables** (optional)

   Add in the Environment tab:
   ```
   PYTHON_VERSION=3.11.0
   ```

5. **Select Plan**
   - **Free**: Auto-sleeps after 15 min inactivity (cold starts ~30s)
   - **Starter**: $7/month, always active

6. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for build to complete
   - Copy your service URL (e.g., `https://metta-reasoning-service.onrender.com`)

### Test the Service

```bash
# Health check
curl https://your-service.onrender.com/health

# Test reasoning endpoint
curl -X POST https://your-service.onrender.com/api/reason \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I deploy a smart contract?",
    "chunks": [{"content": "To deploy a contract, use the deploy command..."}]
  }'
```

## Deploy: Agent on Agentverse.ai

1. Go to https://agentverse.ai
2. Create a new agent
3. Copy content from `agent_agentverse.py`
4. Update `METTA_SERVICE_URL` with your Render URL:
   ```python
   METTA_SERVICE_URL = "https://your-service.onrender.com/api/reason"
   ```
5. Add dependencies in agentverse.ai:
   ```
   uagents
   requests
   pydantic
   ```
6. Deploy the agent

## Local Development

### MeTTa Service

```bash
# Install dependencies
pip install -r requirements_metta.txt

# Run service
python metta_service.py

# Service runs on http://localhost:8001
```

### Agent

```bash
# Install dependencies
pip install -r requirements_agentverse.txt

# Update METTA_SERVICE_URL to http://localhost:8001/api/reason
# Run agent
python agent_agentverse.py
```

## API Endpoints

### MeTTa Service

- `GET /` - Service info
- `GET /health` - Health check
- `POST /api/reason` - Symbolic reasoning endpoint
  ```json
  {
    "query": "string",
    "chunks": [
      {
        "content": "string",
        "project_name": "string (optional)"
      }
    ]
  }
  ```

## Troubleshooting

### Render Build Fails on hyperon

If you get `ERROR: Could not find a version that satisfies the requirement hyperon`:

- Ensure `requirements_metta.txt` installs from GitHub:
  ```
  git+https://github.com/trueagi-io/hyperon-experimental.git@main
  ```
- Make sure Build Command includes: `pip install --upgrade pip`

### Service Returns 500 Error

- Check Render logs for Python errors
- Verify all environment variables are set
- Ensure the service has restarted after updates

### Cold Starts (Free Plan)

- Free tier sleeps after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- Upgrade to Starter plan for always-on service

## Tech Stack

- **uAgents** - fetch.ai agent framework
- **FastAPI** - Web framework for MeTTa service
- **Hyperon** - MeTTa symbolic reasoning engine
- **Uvicorn** - ASGI server

## License

MIT

## Contributors

Built for ETHGlobal Hackathon
