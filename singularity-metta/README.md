# 🤖 Multi-Agent Documentation Assistant

Sistema multi-agente para búsqueda inteligente en documentación blockchain usando ASI Alliance technologies.

## 📋 Arquitectura

```
User Query
    ↓
Orchestrator Agent (Puerto 8000)
    ↓
Project Router (8002) → Search (8003) → [MeTTa (8006) + LLM (8004) + CodeGen (8005)] → Synthesis (8007)
    ↓
Final Response
```

## 🤖 Agentes

### Desplegables en AgentVerse

1. **Orchestrator Agent** (`agents/orchestrator/`) - Puerto 8000
   - Coordinador principal
   - Entry point para usuarios
   - Maneja chat protocol

2. **Project Router Agent** (`agents/project-router/`) - Puerto 8002
   - Routing inteligente a proyectos relevantes
   - Scoring multi-factor

3. **Search Agent** (`agents/search/`) - Puerto 8003
   - Búsqueda paralela en Qdrant
   - Agregación de resultados

4. **LLM Agent** (`agents/llm/`) - Puerto 8004
   - Respuestas con ASI-1
   - Context-aware

5. **Code Generator Agent** (`agents/code-generator/`) - Puerto 8005
   - Extracción de código
   - Auto-detección de lenguaje

6. **Synthesis Agent** (`agents/synthesis/`) - Puerto 8007
   - Combina resultados
   - Markdown formatting

### Local Only

7. **MeTTa Reasoning Agent** (`agents/metta-reasoning/`) - Puerto 8006
   - Razonamiento simbólico con hyperon
   - Detección de dependencias/conflictos
   - **DEBE correr localmente** (requiere `hyperon`)

## 🚀 Quick Start

### Prerequisitos

```bash
# Python 3.9+
python --version

# Instalar dependencias
cd singularity-metta
pip install uagents uagents_core requests openai

# Solo para MeTTa Agent (local)
pip install hyperon
```

### Variables de Entorno

Crea `.env` en `singularity-metta/`:

```bash
# API Keys
ASI1_API_KEY=your_asi1_key_here
NEXT_API_BASE_URL=https://agent-eth-global.vercel.app/api

# Agent Addresses (actualizar después de deployment)
PROJECT_ROUTER_ADDRESS=agent1q...
SEARCH_AGENT_ADDRESS=agent1q...
METTA_AGENT_ADDRESS=agent1q...  # Local address
LLM_AGENT_ADDRESS=agent1q...
CODE_GEN_ADDRESS=agent1q...
SYNTHESIS_ADDRESS=agent1q...
```

### Ejecutar Localmente (Testing)

**Opción 1: Ejecutar todos (requiere 8 terminales)**

```bash
# Terminal 1 - Orchestrator
cd agents/orchestrator
python agent.py

# Terminal 2 - Project Router
cd agents/project-router
python agent.py

# Terminal 3 - Search
cd agents/search
python agent.py

# Terminal 4 - LLM
cd agents/llm
python agent.py

# Terminal 5 - Code Generator
cd agents/code-generator
python agent.py

# Terminal 6 - MeTTa Reasoning (DEBE SER LOCAL)
cd agents/metta-reasoning
python agent.py

# Terminal 7 - Synthesis
cd agents/synthesis
python agent.py
```

**Opción 2: Script automático**

```bash
# Usa el script de deployment
python run_all_agents.py
```

## 📦 Deployment en AgentVerse

### Paso 1: Deploy Agentes Individuales

Para cada agente (excepto MeTTa):

```bash
cd agents/<agent-name>
python agent.py
```

Cuando el agente inicie, copia el address que aparece en los logs:
```
📍 Agent address: agent1q2vj5c4b...
```

### Paso 2: Actualizar Direcciones

En `agents/orchestrator/agent.py`, actualiza las constantes:

```python
PROJECT_ROUTER_ADDRESS = "agent1q..."  # Address del Project Router
SEARCH_AGENT_ADDRESS = "agent1q..."    # Address del Search Agent
# ... etc
```

### Paso 3: Re-deploy Orchestrator

```bash
cd agents/orchestrator
python agent.py
```

### Paso 4: Publicar en AgentVerse

1. Ve a https://agentverse.ai
2. Crea nuevo agente
3. Sube el código del agente
4. Configura variables de entorno
5. Deploy!

## 🧪 Testing

### Test Individual Agent

```bash
# Test Project Router
cd agents/project-router
python -c "from agent import agent; agent.run()"
```

### Test Full Flow

Usa el Orchestrator con un query de prueba:

```python
# Via AgentVerse chat interface o:
curl -X POST https://agentverse.ai/v1/agents/<orchestrator-id>/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How to deploy a Solidity contract with Hardhat?"}'
```

## 📁 Estructura del Proyecto

```
singularity-metta/
├── agents/
│   ├── orchestrator/        # Coordinador principal
│   │   └── agent.py
│   ├── project-router/      # Routing inteligente
│   │   └── agent.py
│   ├── search/              # Búsqueda paralela
│   │   └── agent.py
│   ├── llm/                 # ASI-1 LLM
│   │   └── agent.py
│   ├── code-generator/      # Extracción de código
│   │   └── agent.py
│   ├── metta-reasoning/     # Razonamiento simbólico (LOCAL)
│   │   └── agent.py
│   └── synthesis/           # Síntesis final
│       └── agent.py
├── shared_models.py         # Modelos compartidos
├── run_all_agents.py        # Script de ejecución
├── .env.example             # Template de variables
└── README.md                # Este archivo
```

## 🔧 Troubleshooting

### Error: "Agent address not found"

- Verifica que todos los agentes estén corriendo
- Actualiza las direcciones en `orchestrator/agent.py`

### Error: "MeTTa library not available"

```bash
pip install hyperon
```

### Error: "ASI1_API_KEY not configured"

- Crea `.env` con tu API key
- O exporta: `export ASI1_API_KEY=your_key`

### Timeout errors

- Aumenta timeout en agents
- Verifica que Next.js API esté disponible

## 📊 Monitoring

Logs de cada agente muestran:
- ✅ Operaciones exitosas
- ❌ Errores
- ⏱️ Tiempos de respuesta
- 📊 Métricas

```
🤖 OrchestratorAgent started!
📍 Agent address: agent1q...
👤 User query from agent1q...: 'How to deploy...'
📍 Step 1: Routing query to projects...
✅ Query completed in 2345.67ms total
```

## 🎯 Para la Hackathon

### Demo Flow

1. Indexa 2-3 proyectos con metadata rica
2. Lanza todos los agentes
3. Haz query: "How to deploy a smart contract with Hardhat?"
4. Muestra la respuesta que incluye:
   - ✅ Routing inteligente
   - ✅ Búsqueda multi-proyecto
   - ✅ Razonamiento simbólico MeTTa
   - ✅ Respuesta ASI-1
   - ✅ Code examples
   - ✅ Síntesis final

### Puntos Clave para Jueces

- **7 agentes especializados** trabajando en conjunto
- **MeTTa reasoning** para detectar dependencias y conflictos
- **ASI-1 LLM** para respuestas inteligentes
- **Búsqueda paralela** en múltiples proyectos
- **Escalable** a 100+ proyectos

## 📚 Resources

- [Architecture Document](../../ARCHITECTURE.md)
- [Migration Guide](../../MIGRATION_GUIDE.md)
- [uAgents Documentation](https://fetch.ai/docs)
- [MeTTa Language](https://github.com/trueagi-io/hyperon-experimental)
- [ASI-1 LLM](https://asi1.ai)

## 🤝 Contributing

1. Fork el repo
2. Crea feature branch
3. Commit cambios
4. Push y crea PR

## 📝 License

MIT License - ver LICENSE file

---

**Version:** 1.0.0
**Last Updated:** 2025-01-15
**Author:** Gilbert Sahumada
