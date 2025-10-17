import os 
from uagents import Agent, Context, Protocol, Model
from datetime import datetime, timezone
from uagents.setup import fund_agent_if_low
from openai import OpenAI
import requests
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
METTA_SERVICE_URL = os.getenv("METTA_SERVICE_URL", "https://agent-eth-global.onrender.com")


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

# Función para llamar al servicio MeTTa externo
def call_metta_service(query, chunks):
    """
    Llama al servicio MeTTa desplegado separadamente para obtener razonamiento simbólico
    """
    try:
        response = requests.post(
            METTA_SERVICE_URL,
            json={"query": query, "chunks": chunks},
            timeout=15
        )
        response.raise_for_status()
        data = response.json()
        return data.get("reasoning", "")
    except Exception as e:
        print(f"Error calling MeTTa service: {e}")
        # Fallback: retornar análisis simple sin MeTTa
        return "Análisis simbólico no disponible en este momento."

@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    # Extract text from message content (FIX: msg.content is a list, not a string)
    query = ''
    for item in msg.content:
        if isinstance(item, TextContent):
            query += item.text

    query = query.strip()
    ctx.logger.info(f"🔎 Query received: {query}")

    await ctx.send(sender, ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id))

    try:
        # Obtener proyectos disponibles
        projects = get_projects()

        if not projects:
            no_projects_msg = ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=msg.msg_id,
                content=[
                    TextContent(text="No indexed projects available. Please index documentation first."),
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
            no_results_msg = ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=msg.msg_id,
                content=[
                    TextContent(text=f"I couldn't find relevant information about '{query}' in the documentation."),
                    EndSessionContent()
                ]
            )
            await ctx.send(sender, no_results_msg)
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

        # Use ASI-1 LLM to generate intelligent response based on documentation
        llm_response = "I'm sorry, I couldn't process your query at this time."
        try:
            r = client.chat.completions.create(
                model="asi1-mini",
                messages=[
                    {"role": "system", "content": f"""
You are an expert assistant in blockchain development and smart contracts.
Your job is to help developers implement technologies based on official documentation.

Relevant documentation context:
{context_docs}

Instructions:
1. Respond based EXCLUSIVELY on the provided documentation
2. If the question cannot be answered with the documentation, clearly state that you don't have that information
3. Provide code examples when appropriate
4. Be clear, concise, and technical
5. Cite the project where you get the information when relevant
                    """},
                    {"role": "user", "content": query},
                ],
                max_tokens=2048,
            )
            llm_response = str(r.choices[0].message.content)
            ctx.logger.info(f"✅ Response generated by ASI-1 LLM")
        except Exception as e:
            ctx.logger.error(f"❌ Error calling ASI-1: {e}")
            # Fallback: basic response
            llm_response = f"I found {len(top_chunks)} relevant sections in the documentation, but had issues generating a detailed response."

        # Opcionalmente, agregar análisis simbólico de MeTTa (si el servicio está disponible)
        # reasoning = call_metta_service(query, top_chunks)

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

    # Validate ASI-1 API key
    if not os.getenv("ASI1_API_KEY") or os.getenv("ASI1_API_KEY") == "INSERT_YOUR_API_KEY_HERE":
        ctx.logger.warning("⚠️ ASI1_API_KEY is not configured. Agent won't be able to generate intelligent responses.")
    else:
        ctx.logger.info("✅ ASI-1 LLM configured correctly")

# Enabling chat functionality
agent.include(protocol, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
