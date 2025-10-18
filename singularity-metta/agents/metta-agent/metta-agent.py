from datetime import datetime, timezone
import os
import ssl
import certifi
import requests
import json
from typing import Any, Dict, List
from uuid import uuid4
from hyperon import MeTTa
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

# Configure SSL certificates for macOS
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

# API Configuration
NEXT_API_BASE = os.getenv("NEXT_API_BASE_URL", "https://agent-eth-global.vercel.app/api")
PROJECTS_URL = f"{NEXT_API_BASE}/projects"
DOCS_SEARCH_URL = f"{NEXT_API_BASE}/multi-search"


# Initialize agent
AGENT_NAME = "MeTTaReasoningAgent"
agent = Agent(
    name=AGENT_NAME,
    port=8001,
    mailbox=True,  
    #publish_agent_details=False
)

# Function to get available projects
def get_projects():
    """Gets the list of indexed projects from the API"""
    try:
        response = requests.get(PROJECTS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        # The endpoint returns {"projects": [...], "count": N}
        if isinstance(data, dict) and "projects" in data:
            return data["projects"]
        return []
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return []

def text_to_metta_facts(chunks):
    """
    Converts documentation chunks into MeTTa facts
    """
    facts = []
    for idx, chunk in enumerate(chunks):
        content = chunk.get("content", "")
        # Clean text and truncate to avoid overflow
        snippet = content.replace("\n", " ").replace('"', "'")[:400]
        facts.append(f'!(doc chunk-{idx} "{snippet}")')
    return "\n".join(facts)

def metta_reasoning(query: str, chunks: List[Dict[str, Any]]) -> str:
    """
    Generates symbolic reasoning using MeTTa
    """
    try:
        base_facts = text_to_metta_facts(chunks)
        reasoning_template = f"""
    (bind $q "{query}")

    ; Add facts
    {base_facts}

    ; Search for symbolic relationships and dependencies
    (match &self
        (doc $id $content)
        (if (and (find $content "import") (find $content "deploy"))
            (print "This section likely involves both import and deployment steps"))
        (if (find $content "API")
            (print "This section mentions API integration"))
        (if (find $content "contract")
            (print "This section involves smart contracts"))
    )
    """
        result = metta.run(reasoning_template)
        return "\n".join(str(r) for r in result)
    except Exception as e:
        return f"Error in MeTTa reasoning: {str(e)}"

# Initialize MeTTa
metta = MeTTa()

# Protocol setup
chat_proto = Protocol(spec=chat_protocol_spec)

def create_text_chat(text: str, end_session: bool = False) -> ChatMessage:
    """Create a text chat message."""
    content = [TextContent(type="text", text=text)]
    if end_session:
        content.append(EndSessionContent(type="end-session"))
    return ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=content,
    )

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages and process reasoning queries."""
    ctx.logger.info(f"📩 New message from {sender}")
    ctx.storage.set(str(ctx.session), sender)
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id),
    )

    for item in msg.content:
        if isinstance(item, TextContent):
            text = item.text.strip()
            ctx.logger.info(f"🔎 Message received from {sender}: {text[:100]}...")

            # Check if this is a reasoning request
            if text.startswith("REASONING_REQUEST:"):
                # Parse: REASONING_REQUEST:session_id:json_data
                parts = text.split(":", 2)
                if len(parts) != 3:
                    ctx.logger.error("Invalid REASONING_REQUEST format")
                    return

                session_id = parts[1]
                json_data = parts[2]

                ctx.logger.info(f"🧠 Processing reasoning request for session {session_id}")

                try:
                    # Parse JSON data
                    data = json.loads(json_data)
                    query = data.get("query", "")
                    chunks = data.get("chunks", [])

                    ctx.logger.info(f"📝 Query: {query}")
                    ctx.logger.info(f"📚 Analyzing {len(chunks)} chunks")

                    # Perform MeTTa reasoning
                    reasoning = metta_reasoning(query, chunks)
                    ctx.logger.info(f"✅ Reasoning completed")

                    # Send response back with same session_id
                    response_text = f"REASONING_RESPONSE:{session_id}:{reasoning}"
                    response_msg = ChatMessage(
                        timestamp=datetime.now(timezone.utc),
                        msg_id=uuid4(),
                        content=[TextContent(text=response_text)]
                    )

                    await ctx.send(sender, response_msg)
                    ctx.logger.info(f"📤 Sent reasoning response for session {session_id}")

                except json.JSONDecodeError as e:
                    ctx.logger.error(f"❌ Invalid JSON in reasoning request: {e}")
                except Exception as e:
                    ctx.logger.error(f"❌ Error processing reasoning: {e}")
                    # Send error response
                    error_text = f"REASONING_RESPONSE:{session_id}:Error: {str(e)}"
                    error_msg = ChatMessage(
                        timestamp=datetime.now(timezone.utc),
                        msg_id=uuid4(),
                        content=[TextContent(text=error_text)]
                    )
                    await ctx.send(sender, error_msg)
            else:
                ctx.logger.info(f"ℹ️ Non-reasoning message from {sender}: {text[:50]}...")

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle chat acknowledgements."""
    ctx.logger.info(f"Acknowledgement recibido de {sender} para {msg.acknowledged_msg_id}")

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 Agent {AGENT_NAME} listo para razonamiento simbólico!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"📚 Conectado a Next.js API: {NEXT_API_BASE}")
    ctx.logger.info(f"🔍 Projects URL: {PROJECTS_URL}")
    ctx.logger.info(f"📖 Docs Search URL: {DOCS_SEARCH_URL}")

# Register the protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
