# Query Understanding Agent - Local Development

## 🚀 Quick Start

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

### 3. Run the Agent

```bash
python agent.py
```

The agent will start an HTTP server on **http://localhost:8001**

## 📡 Testing the Endpoint

### Using curl:

```bash
curl -X POST http://localhost:8001/understand \
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

## 🔧 Configuring Next.js to Use Local Agent

In your `front-end/.env.local`, set:

```bash
QUERY_AGENT_URL=http://localhost:8001/understand
```

## 📊 Logs

The agent will print logs showing:
- Query analysis
- ASI1 API calls
- Extracted intent
- Processing time

## 🛑 Stopping the Agent

Press `Ctrl+C` in the terminal where the agent is running.
