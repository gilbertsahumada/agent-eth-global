from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
from uagents.protocols.chat import ChatProtocol
import requests
import json
from hyperon import MeTTa

AGENT_NAME = "sherry_asi_agent"
AGENT_SEED = "sherry_asi_agent_seed_123"
NEXT_API_URL = "http://localhost:3000/api/projects" 

agent = Agent(
    name=AGENT_NAME,
    seed=AGENT_SEED,
    port=8000,
    endpoint=["http://127.0.0.1:8000/submit"]
)

fund_agent_if_low(agent.wallet)

metta = MeTTa()

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

# === FUNCIÓN PRINCIPAL DE CONSULTA ===

@agent.on_message(model=ChatProtocol)
async def on_chat(ctx: Context, sender: str, msg: ChatProtocol):
    query = msg.message
    ctx.logger.info(f"🔎 Recibida pregunta: {query}")

    try:
        # Llamada al backend Next.js
        response = requests.get(f"{NEXT_API_URL}?query={query}")
        data = response.json()

        if not data or "results" not in data:
            await ctx.send(sender, f"No encontré información relevante en la documentación.")
            return

        chunks = data["results"]
        ctx.logger.info(f"📚 {len(chunks)} snippets recibidos desde Next.js")

        # Generamos reasoning simbólico con MeTTa
        reasoning = metta_reasoning(query, chunks)

        # Creamos una respuesta combinada
        docs_summary = "\n".join([f"- {c['content'][:120]}..." for c in chunks[:3]])
        final_response = f"🤖 Basado en la documentación, encontré lo siguiente:\n\n{docs_summary}\n\n🧠 Razonamiento estructurado:\n{reasoning}"

        await ctx.send(sender, final_response)

    except Exception as e:
        await ctx.send(sender, f"Error al procesar tu consulta: {e}")
        ctx.logger.error(f"❌ Error: {e}")

# === BOOT DEL AGENTE ===

if __name__ == "__main__":
    agent.include(ChatProtocol())
    agent.run()
