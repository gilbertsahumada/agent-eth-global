# Metadata Extractor Agent - Local Development

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd agents/agents/metadata-extractor-agent
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
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "markdown_content": "# Chainlink VRF Tutorial\n\nThis guide shows how to use Chainlink VRF with Hardhat.\n\n```solidity\ncontract VRFConsumer {\n  // code here\n}\n```",
    "file_name": "chainlink-vrf.md"
  }'
```

### Expected Response:

```json
{
  "tech_stack": ["Chainlink", "Hardhat", "Solidity"],
  "domain": "blockchain",
  "keywords": ["VRF", "smart contracts", "random numbers"],
  "languages": ["solidity"],
  "code_snippets": ["contract VRFConsumer"],
  "description": "Guide for implementing Chainlink VRF with Hardhat"
}
```

## 🔧 Configuring Next.js to Use Local Agent

In your `front-end/.env.local`, set:

```bash
METADATA_AGENT_URL=http://localhost:8001/analyze
```

## 📊 Logs

The agent will print logs showing:
- ASI1 API calls
- Extracted metadata
- Processing time

## 🛑 Stopping the Agent

Press `Ctrl+C` in the terminal where the agent is running.
