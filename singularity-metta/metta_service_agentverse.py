from datetime import datetime, timezone
import os
import ssl
import certifi
import requests
from typing import Any, Dict, List
from uuid import uuid4
from hyperon import MeTTa
from uagents import Agent, Context, Model, Protocol
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

class ReasoningRequest(Model):
    query: str
    chunks: List[Dict[str, Any]]

class ReasoningResponse(Model):
    reasoning: str
    status: str = "success"

# Función para obtener proyectos disponibles
def get_projects():
    """Obtiene la lista de proyectos indexados desde el API"""
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

def text_to_metta_facts(chunks):
    """
    Convierte chunks de documentación en hechos MeTTa
    """
    facts = []
    for idx, chunk in enumerate(chunks):
        content = chunk.get("content", "")
        # Limpiamos texto y truncamos para evitar overflow
        snippet = content.replace("\n", " ").replace('"', "'")[:400]
        facts.append(f'!(doc chunk-{idx} "{snippet}")')
    return "\n".join(facts)

def metta_reasoning(query: str, chunks: List[Dict[str, Any]]) -> str:
    """
    Genera razonamiento simbólico usando MeTTa
    """
    try:
        base_facts = text_to_metta_facts(chunks)
        reasoning_template = f"""
    (bind $q "{query}")

    ; Agregamos hechos
    {base_facts}

    ; Buscamos relaciones y dependencias simbólicas
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
        return f"Error en razonamiento MeTTa: {str(e)}"

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
    ctx.storage.set(str(ctx.session), sender)
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id),
    )

    for item in msg.content:
        if isinstance(item, TextContent):
            user_query = item.text.strip()
            ctx.logger.info(f"🔎 Pregunta recibida de {sender}: {user_query}")

            try:
                # Obtener proyectos disponibles
                projects = get_projects()

                if not projects:
                    await ctx.send(sender, create_text_chat(
                        "No hay proyectos indexados disponibles. Por favor indexa documentación primero."
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
                            params={"projectId": project_id, "searchText": user_query},
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
                    await ctx.send(sender, create_text_chat(
                        f"No encontré información relevante sobre '{user_query}' en la documentación."
                    ))
                    return

                # Ordenar por score (si existe) y tomar los top 5
                all_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
                top_chunks = all_chunks[:5]

                ctx.logger.info(f"📚 {len(top_chunks)} snippets más relevantes seleccionados")

                # Usar MeTTa para razonamiento simbólico (local, no servicio externo)
                reasoning = metta_reasoning(user_query, top_chunks)
                ctx.logger.info(f"🧠 Razonamiento generado: {reasoning}")

                # Crear resumen de documentación
                docs_summary = "\n".join([
                    f"- [{c.get('project_name', 'Unknown')}] {c['content'][:120]}..."
                    for c in top_chunks[:3]
                ])

                final_response = f"🤖 Basado en la documentación, encontré lo siguiente:\n\n{docs_summary}\n\n🧠 Razonamiento estructurado:\n{reasoning}"

                # Send the response back
                await ctx.send(sender, create_text_chat(final_response))

            except Exception as e:
                ctx.logger.error(f"Error procesando query: {e}")
                await ctx.send(
                    sender,
                    create_text_chat(f"Error al procesar tu consulta: {str(e)}")
                )
        else:
            ctx.logger.info(f"Contenido inesperado de {sender}")

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
