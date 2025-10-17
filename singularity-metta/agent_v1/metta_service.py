"""
Servicio MeTTa independiente
Puede desplegarse en Railway, Render, Heroku, o cualquier servidor Python
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from hyperon import MeTTa
import uvicorn
from typing import List, Dict, Any

app = FastAPI(title="MeTTa Reasoning Service")
metta = MeTTa()

class ReasoningRequest(BaseModel):
    query: str
    chunks: List[Dict[str, Any]]

class ReasoningResponse(BaseModel):
    reasoning: str
    status: str = "success"

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

@app.get("/")
async def root():
    return {
        "service": "MeTTa Reasoning Service",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/reason", response_model=ReasoningResponse)
async def reason(request: ReasoningRequest):
    """
    Endpoint principal para razonamiento simbólico
    """
    try:
        if not request.chunks:
            return ReasoningResponse(
                reasoning="No hay chunks para analizar",
                status="warning"
            )

        reasoning = metta_reasoning(request.query, request.chunks)

        return ReasoningResponse(
            reasoning=reasoning,
            status="success"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Para desarrollo local
    uvicorn.run(app, host="0.0.0.0", port=8001)
