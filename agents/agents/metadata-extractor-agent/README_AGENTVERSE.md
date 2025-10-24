# Metadata Extractor Agent

![domain:ai-analysis](https://img.shields.io/badge/ai--analysis-3498DB?style=flat)
![tech:asi1](https://img.shields.io/badge/asi1-E85D2E?style=flat)
![tech:nlp](https://img.shields.io/badge/nlp-9B59B6?style=flat)
[![live](https://img.shields.io/badge/Live-8A2BE2?style=flat)](https://agentverse.ai)

An AI-powered metadata extraction service that automatically analyzes markdown documentation and extracts technical metadata including tech stack, programming languages, keywords, and code snippets. Powered by ASI-1 for intelligent content understanding.

## Features

- **Intelligent Markdown Analysis**: Automatically extracts structured metadata from documentation
- **Tech Stack Detection**: Identifies frameworks, libraries, and technologies mentioned
- **Code Snippet Extraction**: Finds and categorizes code blocks with context
- **Smart Keyword Extraction**: Identifies important technical keywords (up to 20)
- **Domain Classification**: Categorizes content (DeFi, NFT, Oracles, etc.)
- **ASI-1 Powered**: Uses advanced LLM for accurate metadata extraction
- **Fast Processing**: Handles documents up to ~8000 tokens

## REST API Endpoint

**POST `/analyze`**

This agent exposes a REST endpoint that can be called directly:

```bash
curl -X POST https://{{agent-url}}/analyze \
-H "Content-Type: application/json" \
-d '{
"markdown_content": "# Chainlink VRF\n\nChainlink VRF provides verifiable randomness...\n\n```solidity\ncontract VRFConsumer {...}\n```",
"file_name": "chainlink-vrf.md"
}'
```

## Example Input

```json
{
"markdown_content": "# Chainlink VRF Tutorial\n\nThis guide shows how to use Chainlink VRF with Hardhat.\n\n```solidity\ncontract VRFConsumer {\n // Request randomness\n function requestRandomness() external {\n // code here\n }\n}\n```",
"file_name": "chainlink-vrf.md"
}
```

## Example Output

```json
{
"tech_stack": ["Chainlink", "Hardhat", "Solidity", "VRF"],
"domain": "Oracles",
"keywords": [
"randomness",
"VRF",
"smart contracts",
"verifiable",
"chainlink oracle",
"hardhat deployment",
"solidity"
],
"languages": ["solidity"],
"description": "Tutorial for implementing Chainlink VRF to generate verifiable random numbers in Solidity smart contracts using Hardhat.",
"code_snippets": [
{
"language": "solidity",
"code": "contract VRFConsumer {\n function requestRandomness() external {...}",
"context": "Request randomness from Chainlink VRF",
"importance": "high"
}
]
}
```

## Usage from Next.js/Node.js

```typescript
// lib/agents/metadata-agent-client.ts
const METADATA_AGENT_URL = 'https://{{your-agent-url}}/analyze';

async function extractMetadata(markdown: string, fileName: string) {
const response = await fetch(METADATA_AGENT_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
markdown_content: markdown,
file_name: fileName
})
});

if (!response.ok) {
throw new Error(`Metadata extraction failed: ${response.statusText}`);
}

return await response.json();
}

// Usage
const metadata = await extractMetadata(markdownContent, 'chainlink.md');
console.log('Tech Stack:', metadata.tech_stack);
console.log('Domain:', metadata.domain);
console.log('Keywords:', metadata.keywords);
```

## Domain Classification

The agent automatically categorizes documentation into these domains:

- **DeFi**: Decentralized Finance protocols and applications
- **NFT**: Non-Fungible Token standards and marketplaces
- **Oracles**: Chainlink and other oracle solutions
- **Infrastructure**: Layer 2, scaling, blockchain infrastructure
- **DAO**: Decentralized Autonomous Organizations
- **Gaming**: Blockchain gaming and metaverse
- **Tools**: Development tools, frameworks, libraries
- **Smart Contracts**: General smart contract development
- **Other**: Other blockchain technologies

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `tech_stack` | string[] | Technologies, frameworks, protocols detected |
| `domain` | string | Primary domain/category of the content |
| `keywords` | string[] | Important technical keywords (max 20) |
| `languages` | string[] | Programming languages from code blocks |
| `description` | string | Auto-generated 1-2 sentence summary |
| `code_snippets` | object[] | Extracted code with context and importance |

## Code Snippet Structure

Each code snippet includes:

```typescript
{
language: string; // e.g., "solidity", "javascript", "typescript"
code: string; // The actual code snippet
context: string; // Explanation of what the code does
importance: string; // "high", "medium", or "low"
}
```

## Performance

- **Average Processing Time**: 2-5 seconds per document
- **Max Document Size**: ~8000 tokens (~6000 words)
- **Concurrent Requests**: Handles multiple requests simultaneously
- **Accuracy**: 90%+ for tech stack and language detection

## Use Cases

Perfect for:
- **Documentation Indexing**: Automatically tag and categorize documentation
- **Search Enhancement**: Extract keywords for better search results
- **Content Organization**: Auto-classify documentation by domain
- **Quick Summaries**: Generate descriptions from long documents
- **Code Discovery**: Find and catalog code examples
- **Hackathon Tools**: Organize sponsor documentation efficiently

## Integration Example

**Scenario**: Indexing sponsor documentation for a hackathon

```typescript
// Upload and index sponsor docs
async function indexSponsorDocs(sponsorName: string, files: File[]) {
for (const file of files) {
const markdown = await file.text();

// 1. Extract metadata using this agent
const metadata = await fetch('https://{{agent-url}}/analyze', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
markdown_content: markdown,
file_name: file.name
})
}).then(r => r.json());

// 2. Store in database with extracted metadata
await db.sponsors.update({
where: { name: sponsorName },
data: {
tech_stack: metadata.tech_stack,
domain: metadata.domain,
keywords: metadata.keywords,
description: metadata.description
}
});

// 3. Index in vector database for search
await qdrant.index({
collection: sponsorName,
content: markdown,
metadata: metadata
});
}
}
```

## Error Handling

The agent handles errors gracefully:

```json
// Error Response (400)
{
"error": "markdown_content is required"
}

// Error Response (500)
{
"error": "Failed to extract metadata",
"details": "ASI1 API timeout"
}
```

## Limitations

- Maximum document size: ~8000 tokens
- Processes one document at a time (sequential)
- Requires valid markdown format
- Code detection limited to markdown code blocks
- Tech stack extraction based on mentions (not deep code analysis)

## Environment Requirements

When deploying to Agentverse:

**Environment Variables:**
```bash
ASI1_API_KEY=your_asi1_api_key_here
```

**Dependencies:**
```bash
uagents>=0.12.0
openai>=1.0.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

## Response Time Breakdown

Typical processing for a 2000-word document:

- Markdown parsing: <100ms
- ASI-1 API call: 2-4s
- Response formatting: <100ms
- **Total**: ~2-5 seconds

## Privacy & Security

- No document storage (processes in-memory only)
- No data logging or persistence
- Secure ASI-1 API communication
- Stateless operation (no history)
- Input validation and sanitization

## Testing the Agent

**Health Check:**
```bash
curl https://{{agent-url}}/health
```

**Simple Test:**
```bash
curl -X POST https://{{agent-url}}/analyze \
-H "Content-Type: application/json" \
-d '{
"markdown_content": "# Test\n\n```python\nprint(\"hello\")\n```",
"file_name": "test.md"
}'
```

---

**Built for ETH Global Hackathon** | Powered by ASI Alliance (ASI-1 LLM)

**Developed by [@gilbertsahumada](https://x.com/gilbertsahumada)**
