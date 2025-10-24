# MeTTa Symbolic Reasoning Service

![domain:ai-reasoning](https://img.shields.io/badge/ai--reasoning-9B59B6?style=flat)
![tech:metta](https://img.shields.io/badge/metta-E74C3C?style=flat)
![tech:symbolic-ai](https://img.shields.io/badge/symbolic--ai-2ECC71?style=flat)
[![live](https://img.shields.io/badge/Live-8A2BE2?style=flat)](https://agentverse.ai)

A specialized reasoning agent that provides symbolic analysis using MeTTa (Meta Type Talk) for documentation context. This agent performs dependency detection, execution order inference, and conflict identification to enhance documentation search results with structured reasoning.

## Features

- **MeTTa Symbolic Reasoning**: Uses hyperon library for advanced symbolic analysis
- **Dependency Detection**: Identifies dependencies between code snippets and documentation
- **Execution Order Inference**: Determines logical execution sequences from documentation
- **Conflict Identification**: Detects contradictions or conflicts in provided context
- **Context-Aware Analysis**: Processes queries with relevant documentation chunks
- **Chat Protocol Integration**: Seamless communication with other agents

## Example Input

```python
ChatMessage(
 content=[
 TextContent(text="""REASONING_REQUEST:abc-123-def:{
 "query": "How do I deploy a Solidity contract with Hardhat?",
 "chunks": [
 {
 "text": "Initialize your Hardhat project with npx hardhat init",
 "metadata": {"project_id": "hardhat-docs", "section": "setup"}
 },
 {
 "text": "Deploy contracts using npx hardhat run scripts/deploy.js",
 "metadata": {"project_id": "hardhat-docs", "section": "deployment"}
 }
 ]
 }""")
 ]
)
```

## Example Output

```python
ChatMessage(
 content=[
 TextContent(text="""REASONING_RESPONSE:abc-123-def:
 Execution Order:
1. Initialize Hardhat project (npx hardhat init)
2. Create deployment script
3. Deploy contracts (npx hardhat run scripts/deploy.js)

 Dependencies Detected:
- Deployment requires: Project initialization, deployment script creation
- Prerequisites: Node.js, npm installed

 Potential Issues:
- None detected

 Recommendations:
- Follow setup steps sequentially
- Verify Node.js installation before starting
 """),
 EndSessionContent()
 ]
)
```

## Message Format

This agent uses a custom message format within ChatMessage protocol:

### Request Format
```
REASONING_REQUEST:<session_id>:<json_data>
```

Where `json_data` contains:
```json
{
 "query": "User's question",
 "chunks": [
 {
 "text": "Documentation content",
 "metadata": {"project_id": "...", "section": "..."}
 }
 ]
}
```

### Response Format
```
REASONING_RESPONSE:<session_id>:<reasoning_result>
```

The `reasoning_result` includes:
- Execution order of steps
- Detected dependencies
- Potential conflicts or issues
- Recommendations

## Usage Example

This agent is designed to be called by other agents (like the main documentation assistant). Here's how to integrate it:

```python
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import (
 ChatMessage,
 TextContent,
 chat_protocol_spec
)
from datetime import datetime, timezone
from uuid import uuid4
import json

agent = Agent(name="caller_agent")

METTA_AGENT_ADDRESS = "{{ .Agent.Address }}"

# Storage for responses
metta_responses = {}

@agent.on_event("startup")
async def send_reasoning_request(ctx: Context):
 # Prepare reasoning request
 session_id = str(uuid4())
 reasoning_data = {
 "query": "How to deploy a smart contract?",
 "chunks": [
 {
 "text": "First, compile your contracts",
 "metadata": {"project_id": "docs", "section": "compile"}
 },
 {
 "text": "Then deploy using deployment script",
 "metadata": {"project_id": "docs", "section": "deploy"}
 }
 ]
 }

 # Create request message
 request_text = f"REASONING_REQUEST:{session_id}:{json.dumps(reasoning_data)}"
 request_msg = ChatMessage(
 timestamp=datetime.now(timezone.utc),
 msg_id=uuid4(),
 content=[TextContent(text=request_text)]
 )

 await ctx.send(METTA_AGENT_ADDRESS, request_msg)
 ctx.logger.info(f"Sent reasoning request with session: {session_id}")

@agent.on_message(ChatMessage)
async def handle_response(ctx: Context, sender: str, msg: ChatMessage):
 if sender == METTA_AGENT_ADDRESS:
 # Extract response text
 response_text = ""
 for item in msg.content:
 if isinstance(item, TextContent):
 response_text += item.text

 # Parse response
 if response_text.startswith("REASONING_RESPONSE:"):
 parts = response_text.split(":", 2)
 session_id = parts[1]
 reasoning = parts[2]

 ctx.logger.info(f"Received reasoning for session {session_id}")
 ctx.logger.info(f"Reasoning:\n{reasoning}")

 # Store response
 metta_responses[session_id] = reasoning

if __name__ == "__main__":
 agent.run()
```

## Architecture

```
Documentation Assistant → MeTTa Agent
 ↓
 [Symbolic Analysis]
 ↓
 Execution Order + Dependencies + Conflicts
 ↓
 Enhanced Response
```

## MeTTa Reasoning Process

1. **Parse Input**: Extract query and documentation chunks
2. **Symbolic Analysis**: Apply MeTTa reasoning patterns using hyperon
3. **Dependency Detection**: Identify relationships between steps
4. **Order Inference**: Determine logical execution sequence
5. **Conflict Check**: Look for contradictions or issues
6. **Format Output**: Structure reasoning in readable format

## Performance

- **Average Processing Time**: 3-8 seconds per request
- **Concurrent Requests**: Handles multiple sessions simultaneously
- **Timeout**: 5 seconds for MeTTa reasoning computation

## Use Cases

Perfect for:
- **Enhanced Documentation Search**: Add symbolic reasoning to search results
- **Tutorial Generation**: Create step-by-step guides from documentation
- **Troubleshooting**: Identify potential issues in implementation steps
- **Best Practices**: Infer recommended execution patterns
- **Hackathon Assistance**: Provide structured guidance for rapid development

## Limitations

- Reasoning quality depends on input documentation quality
- Works best with structured, sequential documentation
- Limited to provided context (does not access external sources)
- MeTTa analysis may timeout on very complex scenarios

## Integration Requirements

**Environment Variables:**
```bash
# No API keys required - runs locally
# Agent communicates via ChatMessage protocol
```

**Dependencies:**
```bash
pip install uagents uagents_core hyperon
```

## Error Handling

The agent handles errors gracefully:
- **Invalid JSON**: Returns error message with session ID
- **MeTTa Timeout**: Returns partial reasoning or timeout notice
- **Missing Data**: Logs warning and returns available analysis

## Privacy & Security

- Processes only provided documentation context
- No external API calls or data storage
- Session-based processing (no persistent history)
- Isolated execution per request

## Response Timing

Typical response breakdown:
- JSON parsing: <100ms
- MeTTa reasoning: 3-8s
- Response formatting: <100ms
- **Total**: ~3-8 seconds

---

**Built for ETH Global Hackathon** | Powered by ASI Alliance (MeTTa Symbolic Reasoning)

**Developed by [@gilbertsahumada](https://x.com/gilbertsahumada)**
