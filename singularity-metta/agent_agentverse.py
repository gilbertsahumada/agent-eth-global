import os
import json
from uagents import Agent, Context, Protocol, Model
from datetime import datetime, timezone
from uagents.setup import fund_agent_if_low
from openai import OpenAI
import requests
from typing import Any, Dict, List
from uuid import uuid4
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

# Define message models
class QueryMessage(Model):
    query: str

class ResponseMessage(Model):
    response: str

AGENT_NAME = "EtHGlobalHackerAgent"
AGENT_SEED = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

NEXT_API_BASE = os.getenv("NEXT_API_BASE_URL", "https://agent-eth-global.vercel.app/api")
PROJECTS_URL = f"{NEXT_API_BASE}/projects"
DOCS_SEARCH_URL = f"{NEXT_API_BASE}/docs"

# MeTTa Agent Address (get from agent_v1/metta_service_agentverse.py startup logs)
METTA_AGENT_ADDRESS = os.getenv("METTA_AGENT_ADDRESS", "")
USE_METTA_REASONING = METTA_AGENT_ADDRESS and METTA_AGENT_ADDRESS != ""

# Conversation history settings
MAX_HISTORY_MESSAGES = 20  # Keep last 20 messages (10 user + 10 assistant)


client = OpenAI(
    base_url='https://api.asi1.ai/v1',
    api_key=os.getenv("ASI1_API_KEY")
)

agent = Agent()

protocol = Protocol(spec=chat_protocol_spec)
#fund_agent_if_low(agent.wallet.address())

# Función para obtener proyectos disponibles
def get_projects():
    try:
        response = requests.get(PROJECTS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        # El endpoint devuelve {"projects": [...], "count": N}
        if isinstance(data, dict) and "projects" in data:
            return data["projects"]
        return []
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return []

# Storage for MeTTa reasoning responses (key: session_id, value: reasoning text)
metta_reasoning_cache = {}

@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    # Check if this is a response from MeTTa agent
    if sender == METTA_AGENT_ADDRESS:
        for item in msg.content:
            if isinstance(item, TextContent):
                text = item.text
                if text.startswith("REASONING_RESPONSE:"):
                    # Parse: REASONING_RESPONSE:session_id:reasoning_text
                    parts = text.split(":", 2)
                    if len(parts) == 3:
                        session_id = parts[1]
                        reasoning_text = parts[2]
                        metta_reasoning_cache[session_id] = reasoning_text
                        ctx.logger.info(f"🧠 Stored MeTTa reasoning for session {session_id}")
                        # Send acknowledgement
                        await ctx.send(sender, ChatAcknowledgement(
                            timestamp=datetime.now(timezone.utc),
                            acknowledged_msg_id=msg.msg_id
                        ))
                        return

@protocol.on_message(ChatMessage)
async def handle_user_message(ctx: Context, sender: str, msg: ChatMessage):
    # Extract text from message content (FIX: msg.content is a list, not a string)
    query = ''
    for item in msg.content:
        if isinstance(item, TextContent):
            query += item.text

    query = query.strip()
    ctx.logger.info(f"🔎 Query received from {sender}: {query}")

    await ctx.send(sender, ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id))

    # Retrieve or initialize conversation history for this user
    history_key = f"conversation_history_{sender}"
    conversation_history = ctx.storage.get(history_key) or []

    ctx.logger.info(f"📚 Conversation history: {len(conversation_history)} messages")

    # Check for special commands
    if query.lower() in ["/clear", "/reset", "/new"]:
        ctx.storage.set(history_key, [])
        ctx.logger.info(f"🗑️ Cleared conversation history for {sender}")

        clear_msg = ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=msg.msg_id,
            content=[
                TextContent(text="✅ Conversation history cleared! Starting fresh."),
                EndSessionContent()
            ]
        )
        await ctx.send(sender, clear_msg)
        return

    # Add user message to history
    conversation_history.append({"role": "user", "content": query})

    try:
        # Obtener proyectos disponibles
        projects = get_projects()

        if not projects:
            no_projects_msg = ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=msg.msg_id,
                content=[
                    TextContent(text="""👋 Hi! I'm your hackathon AI assistant, but I don't have any documentation indexed yet.

📖 **To get started:**
1. Upload documentation files (.md) through the web interface
2. Index technologies you're planning to use (e.g., Chainlink, Polygon, The Graph)
3. Come back and ask me anything!

💡 **What I can help with once docs are uploaded:**
- Implementation guides and tutorials
- Code examples and best practices
- Smart contract integration
- API usage patterns
- Debugging and troubleshooting

Ready to upload some docs? Head to the main page and let's get building! 🚀"""),
                    EndSessionContent()
                ]
            )
            await ctx.send(sender, no_projects_msg)
            return

        ctx.logger.info(f"📚 Searching across {len(projects)} project(s)")

        # Buscar en todos los proyectos y combinar resultados
        all_chunks = []
        for project in projects:
            project_id = project.get("id")
            project_name = project.get("name", "Unknown")

            try:
                # Llamada al endpoint de búsqueda
                response = requests.get(
                    DOCS_SEARCH_URL,
                    params={"projectId": project_id, "searchText": query},
                    timeout=10
                )
                ctx.logger.info(f"🔍 Response : {response}")
                response.raise_for_status()
                data = response.json()
                ctx.logger.info(f"🔍 Results from '{project_name}': {data.get('count', 0)}")

                if data and "results" in data and data["results"]:
                    # Add project name to each chunk
                    for chunk in data["results"]:
                        chunk["project_name"] = project_name
                    all_chunks.extend(data["results"])
                    ctx.logger.info(f"✅ {len(data['results'])} results from '{project_name}'")
            except Exception as e:
                ctx.logger.warning(f"⚠️ Error searching in project '{project_name}': {e}")
                continue

        if not all_chunks:
            # En lugar de decir "no encontré nada", ofrece ayuda con lo disponible
            project_list = "\n".join([f"• {p.get('name', 'Unknown')}: {p.get('description', 'No description')}" for p in projects])
            
            helpful_response = f"""I couldn't find specific information about '{query}' in my indexed documentation.

However, I have documentation for the following projects that might help you in this hackathon:

{project_list}

💡 **How I can help:**
- Ask me how to implement any of these technologies
- Request code examples or integration guides
- Get step-by-step deployment instructions
- Learn about smart contract interactions
- Understand API usage patterns

**Example questions:**
- "How do I use [technology name]?"
- "Show me an example of [specific feature]"
- "What are the requirements for [project name]?"

What would you like to know about any of these projects?"""
            
            helpful_msg = ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=msg.msg_id,
                content=[
                    TextContent(text=helpful_response),
                    EndSessionContent()
                ]
            )
            await ctx.send(sender, helpful_msg)
            return

        # Sort by score (if exists) and take top 5
        all_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
        top_chunks = all_chunks[:5]

        ctx.logger.info(f"📚 Selected {len(top_chunks)} most relevant snippets")

        # Preparar contexto para el LLM
        context_docs = "\n\n".join([
            f"[{c.get('project_name', 'Unknown')}]\n{c['content']}"
            for c in top_chunks
        ])

        # Request MeTTa reasoning if agent is available
        metta_reasoning_text = None
        ctx.logger.info(f"MeTTa reasoning enabled: {USE_METTA_REASONING}")
        ctx.logger.info(f"MeTTa agent address: {METTA_AGENT_ADDRESS}")
        if USE_METTA_REASONING:
            try:
                ctx.logger.info(f"🧠 Requesting MeTTa reasoning from {METTA_AGENT_ADDRESS}")

                # Prepare data for MeTTa agent (serialize as JSON)
                reasoning_data = {
                    "query": query,
                    "chunks": top_chunks
                }

                # Create session ID to track this reasoning request
                session_id = str(uuid4())

                # Send ChatMessage to MeTTa agent with JSON payload
                metta_request_msg = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    msg_id=uuid4(),
                    content=[
                        TextContent(text=f"REASONING_REQUEST:{session_id}:{json.dumps(reasoning_data)}")
                    ]
                )

                await ctx.send(METTA_AGENT_ADDRESS, metta_request_msg)

                # Wait for response (with timeout)
                import asyncio
                max_wait = 10  # 10 seconds timeout
                waited = 0
                while session_id not in metta_reasoning_cache and waited < max_wait:
                    await asyncio.sleep(0.5)
                    waited += 0.5

                # Check if we got a response
                if session_id in metta_reasoning_cache:
                    metta_reasoning_text = metta_reasoning_cache.pop(session_id)
                    ctx.logger.info(f"✅ MeTTa reasoning received and processed")
                else:
                    ctx.logger.warning(f"⚠️ MeTTa reasoning timeout after {max_wait}s")
            except Exception as e:
                ctx.logger.error(f"❌ Error calling MeTTa agent: {e}")

        # Use ASI-1 LLM to generate intelligent response based on documentation
        llm_response = "I'm sorry, I couldn't process your query at this time."
        try:
            # Build system prompt with MeTTa reasoning if available
            system_prompt = f"""
You are an expert AI assistant specialized in helping developers during hackathons with blockchain technologies and smart contracts.
Your mission is to accelerate development by providing clear, actionable guidance based on official documentation.

🎯 **Your Role:**
- Help developers implement technologies quickly and correctly
- Provide practical code examples and step-by-step guides
- Explain concepts clearly with a focus on getting things working
- Be encouraging and supportive - hackathons are time-sensitive!

📚 **Available Documentation Context:**
{context_docs}
"""
            if metta_reasoning_text:
                system_prompt += f"""

🧠 **Symbolic Analysis (MeTTa):**
{metta_reasoning_text}

Use this to identify dependencies, execution order, and potential conflicts in your response.
"""

            system_prompt += """

✅ **Response Guidelines:**
1. **Be practical and actionable** - focus on what developers need to do NOW
2. **Provide complete code examples** when relevant (not just snippets)
3. **Mention prerequisites and dependencies** upfront
4. **Structure your response** with clear steps or sections
5. **Cite the source project** when referencing specific documentation
6. **If something is missing from docs**, acknowledge it but offer alternative approaches or related information
7. **Be encouraging** - remind them they're building something awesome!
8. **Include troubleshooting tips** when relevant

Remember: You're here to help hackers ship fast and win! 🚀
"""

            # Build messages with conversation history
            messages = [{"role": "system", "content": system_prompt}]

            # Add conversation history (excluding the last user message we just added)
            messages.extend(conversation_history[:-1])

            # Add current query
            messages.append({"role": "user", "content": query})

            r = client.chat.completions.create(
                #model="asi1-mini",
                model="asi1-extended",
                messages=messages,
                max_tokens=2048,
            )
            llm_response = str(r.choices[0].message.content)
            ctx.logger.info(f"✅ Response generated by ASI-1 LLM")
        except Exception as e:
            ctx.logger.error(f"❌ Error calling ASI-1: {e}")
            # Fallback: basic response
            llm_response = f"I found {len(top_chunks)} relevant sections in the documentation, but had issues generating a detailed response."

        # Add assistant response to conversation history
        conversation_history.append({"role": "assistant", "content": llm_response})

        # Truncate history if it exceeds max length (keep only recent messages)
        if len(conversation_history) > MAX_HISTORY_MESSAGES:
            conversation_history = conversation_history[-MAX_HISTORY_MESSAGES:]
            ctx.logger.info(f"✂️ Truncated conversation history to {MAX_HISTORY_MESSAGES} messages")

        # Save updated conversation history
        ctx.storage.set(history_key, conversation_history)
        ctx.logger.info(f"💾 Saved conversation history: {len(conversation_history)} messages")

        response = ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=msg.msg_id,
            content=[
                TextContent(text=llm_response),
                EndSessionContent()
            ]
        )

        await ctx.send(sender, response)

    except Exception as e:
        error_response = ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=msg.msg_id,
            content=[
                TextContent(text=f"Error processing your query: {e}"),
                EndSessionContent()
            ]
        )
        await ctx.send(sender, error_response)
        ctx.logger.error(f"❌ Error: {e}")

@protocol.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Received acknowledgement from {sender} for message: {msg.acknowledged_msg_id}")

# === BOOT DEL AGENTE ===

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 Agent {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 Listening on port 8000")
    ctx.logger.info(f"📚 Connected to Next.js API: {NEXT_API_BASE}")
    ctx.logger.info(f"🔍 Projects URL: {PROJECTS_URL}")
    ctx.logger.info(f"📖 Docs Search URL: {DOCS_SEARCH_URL}")
    ctx.logger.info("")

    # Validate ASI-1 API key
    if not os.getenv("ASI1_API_KEY") or os.getenv("ASI1_API_KEY") == "INSERT_YOUR_API_KEY_HERE":
        ctx.logger.warning("⚠️ ASI1_API_KEY is not configured. Agent won't be able to generate intelligent responses.")
    else:
        ctx.logger.info("✅ ASI-1 LLM configured correctly")

    # Check MeTTa integration
    if USE_METTA_REASONING:
        ctx.logger.info(f"✅ MeTTa reasoning enabled")
        ctx.logger.info(f"   MeTTa Agent address: {METTA_AGENT_ADDRESS}")
        ctx.logger.info("   Responses will include symbolic reasoning analysis")
    else:
        ctx.logger.warning("⚠️ MeTTa reasoning disabled")
        ctx.logger.info("   To enable: Set METTA_AGENT_ADDRESS in .env")
        ctx.logger.info("   Get address from agent_v1/metta_service_agentverse.py startup logs")

    ctx.logger.info("")
    ctx.logger.info("💬 Conversation Memory:")
    ctx.logger.info(f"   Max history: {MAX_HISTORY_MESSAGES} messages per user")
    ctx.logger.info("   Commands: /clear, /reset, /new (to clear history)")
    ctx.logger.info("   Each user has their own conversation context")

# Enabling chat functionality
agent.include(protocol, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
