# Query Understanding Agent

## 📍 Production Deployment

This agent is deployed on Render at:
- **URL**: `https://agent-eth-global.onrender.com/understand`
- **Method**: POST
- **Content-Type**: application/json

## 🚀 Local Development

### 1. Install Dependencies

```bash
cd agents/agents/query-understanding-agent
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your ASI1 API key
# ASI1_API_KEY=your_actual_key_here
```

### 3. Run the Agent Locally

```bash
python agent.py
```

The agent will start an HTTP server on **http://localhost:8002**

## 📡 Testing the Endpoint

### Using curl:

```bash
curl -X POST http://localhost:8002/understand \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I deploy a VRF contract using Hardhat?",
    "available_projects": [
      {
        "id": "123",
        "name": "Chainlink Docs",
        "domain": "blockchain",
        "tech_stack": ["Chainlink", "Hardhat", "Solidity"],
        "keywords": ["VRF", "smart contracts"]
      }
    ]
  }'
```

### Expected Response:

```json
{
  "wants_code": true,
  "languages": ["solidity", "javascript"],
  "technologies": ["chainlink", "hardhat", "vrf"],
  "action": "deploy",
  "domain": "blockchain",
  "relevant_project_ids": ["123"],
  "search_focus": "code"
}
```

## 🔧 Configuring Next.js

### For Production (Render):

In your `front-end/.env.local`, set:

```bash
QUERY_AGENT_URL=https://agent-eth-global.onrender.com/understand
```

### For Local Development:

In your `front-end/.env.local`, set:

```bash
QUERY_AGENT_URL=http://localhost:8002/understand
```

## 🌐 Deploying to Render

This agent is currently deployed on Render. To deploy your own instance:

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure Build & Start Commands**:
   - **Build Command**: `cd agents/agents/query-understanding-agent && pip install -r requirements.txt`
   - **Start Command**: `cd agents/agents/query-understanding-agent && python agent.py`
4. **Add Environment Variables**:
   - `ASI1_API_KEY`: Your ASI1 API key
   - `PORT`: 8002 (or Render's default $PORT)
5. **Deploy**: Render will automatically deploy on push to main branch

## 📊 Logs

The agent will print logs showing:
- Query analysis
- ASI1 API calls
- Extracted intent
- Processing time

## 🛑 Stopping the Agent

Press `Ctrl+C` in the terminal where the agent is running.
