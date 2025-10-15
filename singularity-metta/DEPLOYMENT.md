# Guía de Despliegue

Este proyecto se ha separado en dos componentes para permitir el despliegue en agentverse.ai:

## Arquitectura

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Agentverse.ai  │────────>│  MeTTa Service   │<────────│  Next.js API    │
│  (Agent)        │   HTTP  │  (Railway/Render)│         │  (Vercel)       │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Componente 1: Agente Principal (Agentverse.ai)

### Archivos necesarios:
- `agent_agentverse.py`
- `requirements_agentverse.txt`

### Pasos de despliegue:

1. **Crear cuenta en Agentverse.ai**
   - Ve a https://agentverse.ai
   - Crea una cuenta y accede al dashboard

2. **Crear nuevo agente**
   - Click en "Create Agent"
   - Selecciona "Blank Agent"

3. **Copiar código**
   - Copia el contenido de `agent_agentverse.py`
   - Pégalo en el editor de agentverse.ai

4. **Configurar dependencias**
   - En la sección de dependencias, asegúrate de incluir:
     ```
     uagents
     requests
     pydantic
     ```

5. **Actualizar URL del servicio MeTTa**
   - Una vez que despliegues el servicio MeTTa (ver abajo), actualiza la variable:
   ```python
   METTA_SERVICE_URL = "https://tu-metta-service.railway.app/api/reason"
   ```

6. **Desplegar**
   - Click en "Deploy" o "Start Agent"

## Componente 2: Servicio MeTTa (Railway/Render/Heroku)

### Archivos necesarios:
- `metta_service.py`
- `requirements_metta.txt`

### Opción A: Despliegue en Railway

1. **Instalar Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Iniciar sesión**
   ```bash
   railway login
   ```

3. **Crear proyecto**
   ```bash
   cd singularity-metta
   railway init
   ```

4. **Desplegar**
   ```bash
   railway up
   ```

5. **Obtener URL pública**
   ```bash
   railway domain
   ```

### Opción B: Despliegue en Render (Recomendado - Más fácil)

**Nota**: El proyecto incluye un archivo `render.yaml` en la raíz que configura automáticamente el despliegue.

1. **Crear cuenta en Render**
   - Ve a https://render.com
   - Regístrate con GitHub

2. **Desplegar usando Blueprint (render.yaml)**
   - Click en "New +" → "Blueprint"
   - Selecciona tu repositorio `agent-eth-global`
   - Render detectará automáticamente el archivo `render.yaml`
   - Click en "Apply"

   **Alternativamente (configuración manual)**:
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - **Root Directory**: `singularity-metta`
   - **Build Command**: `pip install -r requirements_metta.txt`
   - **Start Command**: `uvicorn metta_service:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3

3. **Selecciona plan**
   - **Free**: Gratis pero se duerme después de 15 min sin uso
   - **Starter**: $7/mes, siempre activo

4. **Deploy**
   - Click en "Create Web Service"
   - Espera 3-5 minutos
   - Copia la URL pública (ej: `https://metta-reasoning-service.onrender.com`)

### Opción C: Despliegue en Heroku

1. **Crear Procfile**
   ```bash
   echo "web: uvicorn metta_service:app --host 0.0.0.0 --port \$PORT" > Procfile
   ```

2. **Desplegar**
   ```bash
   heroku create tu-metta-service
   git add .
   git commit -m "Deploy MeTTa service"
   git push heroku main
   ```

3. **Obtener URL**
   ```bash
   heroku info
   ```

## Configuración Final

1. **Conectar los servicios**
   - Toma la URL del servicio MeTTa desplegado
   - Actualiza `METTA_SERVICE_URL` en `agent_agentverse.py`
   - Vuelve a desplegar el agente en agentverse.ai

2. **Verificar funcionamiento**
   - Envía un mensaje de prueba al agente
   - Verifica los logs en ambos servicios

## Prueba Local (Opcional)

Para probar antes de desplegar:

```bash
# Terminal 1: Servicio MeTTa
pip install -r requirements_metta.txt
python metta_service.py

# Terminal 2: Agente (actualiza METTA_SERVICE_URL a http://localhost:8001)
pip install -r requirements_agentverse.txt
python agent_agentverse.py
```

## Troubleshooting

### Error: MeTTa service no responde
- Verifica que el servicio esté corriendo: `curl https://tu-metta-service.com/health`
- Revisa los logs del servicio MeTTa

### Error: No projects found
- Verifica que tu Next.js API esté funcionando
- Revisa la URL en `NEXT_API_BASE`

### Error: Agent wallet issues
- En desarrollo local, comenta `fund_agent_if_low()`
- En producción, asegúrate de tener fondos en tu wallet

## Costos Estimados

- **Agentverse.ai**: Gratis para desarrollo
- **Railway**: ~$5/mes (plan hobby)
- **Render**: Gratis (con limitaciones) o $7/mes
- **Heroku**: ~$7/mes (plan básico)

## Notas Importantes

1. El servicio MeTTa puede tardar 30-60 segundos en arrancar en el primer request (cold start)
2. Asegúrate de usar HTTPS para la URL del servicio MeTTa
3. Considera agregar autenticación al servicio MeTTa si lo usas en producción
4. Monitorea los logs regularmente para detectar errores
