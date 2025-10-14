from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
import requests
import json
from hyperon import MeTTa

# Define message models
class QueryMessage(Model):
    query: str

class ResponseMessage(Model):
    response: str

AGENT_NAME = "EtHGlobalHackerAgent"
AGENT_SEED = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
# URL del backend Next.js
NEXT_API_BASE = "http://localhost:3000/api"
PROJECTS_URL = f"{NEXT_API_BASE}/projects"
DOCS_SEARCH_URL = f"{NEXT_API_BASE}/docs" 

agent = Agent(
    name=AGENT_NAME,
    seed=AGENT_SEED,
    port=8000,
    endpoint=["http://127.0.0.1:8000/submit"]
)

# fund_agent_if_low(agent.wallet)  # Commented out for local development

metta = MeTTa()

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

def text_to_metta_facts(chunks):
    facts = []
    for idx, chunk in enumerate(chunks):
        content = chunk.get("content", "")
        # Limpiamos texto y truncamos para evitar overflow
        snippet = content.replace("\n", " ").replace('"', "'")[:400]
        facts.append(f'!(doc chunk-{idx} "{snippet}")')
    return "\n".join(facts)

# Función para generar razonamiento simbólico
def metta_reasoning(query, chunks):
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
    return "\n".join(result)

@agent.on_message(model=QueryMessage)
async def handle_query(ctx: Context, sender: str, msg: QueryMessage):
    query = msg.query
    ctx.logger.info(f"🔎 Recibida pregunta: {query}")

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

        # Generamos reasoning simbólico con MeTTa
        reasoning = metta_reasoning(query, top_chunks)

        # Creamos una respuesta combinada
        docs_summary = "\n".join([
            f"- [{c.get('project_name', 'Unknown')}] {c['content'][:120]}..."
            for c in top_chunks[:3]
        ])
        final_response = f"🤖 Basado en la documentación, encontré lo siguiente:\n\n{docs_summary}\n\n🧠 Razonamiento estructurado:\n{reasoning}"

        await ctx.send(sender, ResponseMessage(response=final_response))

    except Exception as e:
        await ctx.send(sender, ResponseMessage(
            response=f"Error al procesar tu consulta: {e}"
        ))
        ctx.logger.error(f"❌ Error: {e}")

# === BOOT DEL AGENTE ===

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 Agent {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 Listening on port 8000")
    ctx.logger.info(f"📚 Conectado a Next.js API: {NEXT_API_BASE}")

if __name__ == "__main__":
    agent.run()
