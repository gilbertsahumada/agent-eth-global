import requests
import json

# Datos del agente
AGENT_ADDRESS = "agent1qfdvca4nmh7qg6tt0x7yyjdqwxefxqe5242cgh6m8p5g6mgrgcfa2xh9vtn"
AGENT_ENDPOINT = "http://127.0.0.1:8000"

# Define el mensaje de query
query_message = {
    "query": "How do I use Chainlink VRF?"
}

print("🚀 Enviando query al agente...")
print(f"📝 Query: '{query_message['query']}'")
print(f"🎯 Endpoint: {AGENT_ENDPOINT}")
print("="*60)

try:
    # Enviar la petición POST directamente al endpoint del agente
    response = requests.post(
        f"{AGENT_ENDPOINT}/submit",
        json={
            "sender": "test_sender_12345",
            "target": AGENT_ADDRESS,
            "message": query_message,
            "schema_digest": "model_query_message"  # Esto identifica el tipo de mensaje
        },
        headers={"Content-Type": "application/json"},
        timeout=30
    )

    print(f"\n✅ Respuesta del servidor:")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

except Exception as e:
    print(f"\n❌ Error: {e}")
