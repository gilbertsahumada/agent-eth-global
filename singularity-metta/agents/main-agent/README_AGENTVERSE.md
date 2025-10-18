# ETH Global Hacker Assistant Agent

![domain:hackathon](https://img.shields.io/badge/hackathon-3D8BD3?style=flat)
![tech:llm](https://img.shields.io/badge/llm-E85D2E?style=flat)
![tech:vector-search](https://img.shields.io/badge/vector--search-4A90E2?style=flat)
[![live](https://img.shields.io/badge/Live-8A2BE2?style=flat)](https://agentverse.ai)

An AI-powered documentation assistant specialized in blockchain technologies and smart contract development. This agent helps hackathon participants by searching through indexed project documentation and providing intelligent, context-aware responses using ASI-1 LLM with optional MeTTa symbolic reasoning.

## Features

- 📚 **Multi-Project Documentation Search**: Searches across multiple indexed blockchain projects simultaneously
- 🧠 **ASI-1 LLM Integration**: Generates intelligent responses based on official documentation
- 🔮 **MeTTa Symbolic Reasoning** (Optional): Provides dependency detection, execution order inference, and conflict identification
- 💬 **Conversation Memory**: Maintains context across multiple messages for coherent interactions
- ⚡ **Optimized Performance**: Configurable MeTTa reasoning for faster responses when needed

## Example Input

```python
ChatMessage(
    content=[
        TextContent(text="How do I deploy a Solidity contract with Hardhat?")
    ]
)
```

## Example Output

```python
ChatMessage(
    content=[
        TextContent(text="""
To deploy a Solidity contract with Hardhat, follow these steps:

1. **Install Hardhat**
   ```bash
   npm install --save-dev hardhat
   ```

2. **Initialize your project**
   ```bash
   npx hardhat init
   ```

3. **Create your deployment script** in `scripts/deploy.js`:
   ```javascript
   async function main() {
     const Contract = await ethers.getContractFactory("YourContract");
     const contract = await Contract.deploy();
     await contract.deployed();
     console.log("Contract deployed to:", contract.address);
   }
   main();
   ```

4. **Deploy to network**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

**Prerequisites:** Node.js, npm installed
**Source:** hardhat-docs

```
Happy building! 🚀
        """),
        EndSessionContent()
    ]
)
```

## Usage Example

Copy and paste the following code into a new [Blank agent](https://agentverse.ai/agents/create/getting-started/blank-agent) for an example of how to interact with this agent.

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

agent = Agent(name="user")

ASSISTANT_AGENT_ADDRESS = "{{ .Agent.Address }}"

@agent.on_event("startup")
async def send_message(ctx: Context):
    # Send a query to the assistant
    query = ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=[
            TextContent(text="How do I deploy a Solidity contract with Hardhat?")
        ]
    )
    await ctx.send(ASSISTANT_AGENT_ADDRESS, query)
    ctx.logger.info("Query sent to assistant")

@agent.on_message(ChatMessage)
async def handle_response(ctx: Context, sender: str, msg: ChatMessage):
    # Extract response text
    response_text = ""
    for item in msg.content:
        if isinstance(item, TextContent):
            response_text += item.text

    ctx.logger.info(f"Received response: {response_text[:200]}...")

@agent.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Message acknowledged by {sender}")

if __name__ == "__main__":
    agent.run()
```

### Local Agent

1. Install the necessary packages:

   ```bash
   pip install uagents uagents_core
   ```

2. To interact with this agent from a local agent instead, replace `agent = Agent(name="user")` with:

   ```python
   agent = Agent(
       name="user",
       endpoint="http://localhost:8000/submit",
   )
   ```

3. Run the agent:
   ```bash
   python agent.py
   ```

## Indexed Technologies

The agent currently has documentation for:
- Smart contract frameworks (Hardhat, Truffle, Foundry)
- Blockchain protocols (Chainlink, The Graph, Polygon)
- DeFi protocols
- NFT standards
- And more...

## Performance Settings

- **With MeTTa Reasoning**: ~7-13 seconds per query (includes symbolic analysis)
- **Without MeTTa Reasoning**: ~5-8 seconds per query (faster responses)

## Response Format

Responses include:
- ✅ Step-by-step instructions
- ✅ Code examples with syntax highlighting
- ✅ Prerequisites and dependencies
- ✅ Source project citations
- ✅ Troubleshooting tips

## Use Cases

Perfect for:
- 🏆 Hackathon participants needing quick implementation guidance
- 📖 Developers learning new blockchain technologies
- 🔧 Debugging and troubleshooting smart contracts
- 💡 Exploring best practices and patterns

## Architecture

```
User Query → Documentation Search → Context Retrieval → [Optional: MeTTa Reasoning] → ASI-1 LLM → Response
```

## Limitations

- Responses are based solely on indexed documentation
- Cannot access external URLs or real-time blockchain data
- Conversation history limited to 20 messages per user
- Response time varies based on query complexity

## Privacy

- Each user has isolated conversation history
- No data is shared between users
- Queries are not logged permanently

---

**Built for ETH Global Hackathon** | Powered by ASI Alliance (ASI-1 LLM + MeTTa Reasoning)
