import os 
from uagents import Agent, Context, Protocol, Model
from datetime import datetime
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

agent = Agent(
    #name=AGENT_NAME,
    #seed=AGENT_SEED,
    #port=8000,
    #mailbox=True
    #endpoint=["http://127.0.0.1:8000/submit"]
)

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
    query = msg.content
    ctx.logger.info(f"🔎 Pregunta recibida : {query}")

    await ctx.send(sender,ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id),
    )
    try:
        # Obtener proyectos disponibles
        projects = get_projects()

        if not projects:
            await ctx.send(sender, ResponseMessage(
                response="No hay proyectos indexados disponibles. Por favor indexa documentación primero."
            ))
            return

        ctx.logger.info(f"📚 Buscando en {len(projects)} proyecto(s)")

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
                ctx.logger.info(f"🔍 Resultados de '{project_name}': {data.get('count', 0)}")

                if data and "results" in data and data["results"]:
                    # Agregar nombre del proyecto a cada chunk
                    for chunk in data["results"]:
                        chunk["project_name"] = project_name
                    all_chunks.extend(data["results"])
                    ctx.logger.info(f"✅ {len(data['results'])} resultados de '{project_name}'")
            except Exception as e:
                ctx.logger.warning(f"⚠️ Error buscando en proyecto '{project_name}': {e}")
                continue

        if not all_chunks:
            await ctx.send(sender, ResponseMessage(
                response=f"No encontré información relevante sobre '{query}' en la documentación."
            ))
            return

        # Ordenar por score (si existe) y tomar los top 5
        all_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
        top_chunks = all_chunks[:5]

        ctx.logger.info(f"📚 {len(top_chunks)} snippets más relevantes seleccionados")

        # Llamar al servicio MeTTa externo para razonamiento simbólico
        reasoning = call_metta_service(query, top_chunks)

        # Creamos una respuesta combinada
        docs_summary = "\n".join([
            f"- [{c.get('project_name', 'Unknown')}] {c['content'][:120]}..."
            for c in top_chunks[:3]
        ])
        #final_response = f"🤖 Basado en la documentación, encontré lo siguiente:\n\n{docs_summary}\n\n🧠 Razonamiento estructurado:\n{reasoning}"

        response = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=msg.msg_id,
            content=[
                TextContent(text=f"🤖 Basado en la documentación, encontré lo siguiente:\n\n{docs_summary}\n\n🧠 Razonamiento estructurado:\n{reasoning}"),
                EndSessionContent()
            ]
        )

        await ctx.send(sender, ResponseMessage(response=response))

    except Exception as e:
        await ctx.send(sender, ResponseMessage(
            response=f"Error al procesar tu consulta: {e}"
        ))
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
    ctx.logger.info(f"📚 Conectado a Next.js API: {NEXT_API_BASE}")
    ctx.logger.info(f"🧠 Conectado a MeTTa Service: {METTA_SERVICE_URL}")

# Enabling chat functionality
agent.include(protocol, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
