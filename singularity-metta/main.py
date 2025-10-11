from fastapi import FastAPI, Request, HTTPException
from hyperon import MeTTa
import uvicorn
import os
from typing import Optional
from pydantic import BaseModel

app = FastAPI(
    title="MeTTa Reasoning API",
    description="Simple API for reasoning with MeTTa",
    version="1.0.0"
)


KNOWLEDGE_FILE = os.path.join(os.path.dirname(__file__), "knowledge.metta")

# Modelo de entrada
class ReasoningRequest(BaseModel):
    query: str
    load_knowledge: Optional[bool] = True

# Modelo de respuesta
class ReasoningResponse(BaseModel):
    query: str
    result: list
    success: bool

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "MeTTa Reasoning API",
        "version": "1.0.0"
    }

@app.post("/reason", response_model=ReasoningResponse)
async def reason(request: ReasoningRequest):
    """
    Endpoint para realizar razonamiento con MeTTa

    Args:
        request: ReasoningRequest con la query y opción de cargar conocimiento

    Returns:
        ReasoningResponse con el resultado del razonamiento
    """
    try:
        # Inicializar el razonador MeTTa
        metta = MeTTa()

        # Cargar conocimiento base si existe y está habilitado
        if request.load_knowledge and os.path.exists(KNOWLEDGE_FILE):
            with open(KNOWLEDGE_FILE, "r") as f:
                knowledge_content = f.read()
                if knowledge_content.strip():
                    metta.run(knowledge_content)

        # Ejecutar la consulta de razonamiento
        reasoning_code = f'!(reason "{request.query}")'
        result = metta.run(reasoning_code)

        return ReasoningResponse(
            query=request.query,
            result=result,
            success=True
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error durante el razonamiento: {str(e)}"
        )

@app.post("/execute")
async def execute_metta(request: Request):
    """
    Endpoint para ejecutar código MeTTa directamente

    Args:
        request: JSON con campo 'code' conteniendo código MeTTa

    Returns:
        Resultado de la ejecución
    """
    try:
        data = await request.json()
        code = data.get("code", "")

        if not code:
            raise HTTPException(status_code=400, detail="El campo 'code' es requerido")

        # Inicializar el razonador
        metta = MeTTa()

        # Cargar conocimiento base si existe
        if os.path.exists(KNOWLEDGE_FILE):
            with open(KNOWLEDGE_FILE, "r") as f:
                knowledge_content = f.read()
                if knowledge_content.strip():
                    metta.run(knowledge_content)

        # Ejecutar el código
        result = metta.run(code)

        return {
            "code": code,
            "result": result,
            "success": True
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error durante la ejecución: {str(e)}"
        )

@app.get("/knowledge")
async def get_knowledge():
    """
    Endpoint para obtener el contenido del archivo de conocimiento
    """
    if not os.path.exists(KNOWLEDGE_FILE):
        return {
            "exists": False,
            "content": None,
            "message": "El archivo de conocimiento no existe"
        }

    with open(KNOWLEDGE_FILE, "r") as f:
        content = f.read()

    return {
        "exists": True,
        "content": content,
        "file_path": KNOWLEDGE_FILE
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
