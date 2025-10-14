from uagents import Agent, Context, Model
import asyncio

# Define message models
class QueryMessage(Model):
    query: str

class ResponseMessage(Model):
    response: str

# Create a test agent to send the query
test_agent = Agent(
    name="TestQueryAgent",
    seed="test_query_agent_seed_12345",
    port=8001,
    endpoint=["http://127.0.0.1:8001/submit"]
)

AGENT_ADDRESS = "agent1qfdvca4nmh7qg6tt0x7yyjdqwxefxqe5242cgh6m8p5g6mgrgcfa2xh9vtn"
AGENT_ENDPOINT = "http://127.0.0.1:8000/submit"

@test_agent.on_event("startup")
async def send_query(ctx: Context):
    ctx.logger.info("🚀 Enviando query al agente...")
    ctx.logger.info("📝 Query: 'How do I use Chainlink VRF?'")

    # Send the query directly to the endpoint
    await ctx.send(
        AGENT_ADDRESS,
        QueryMessage(query="How do I use Chainlink VRF?"),
        destination=AGENT_ENDPOINT
    )

    ctx.logger.info("✅ Query enviada! Esperando respuesta...")

@test_agent.on_message(model=ResponseMessage)
async def handle_response(ctx: Context, sender: str, msg: ResponseMessage):
    ctx.logger.info(f"\n{'='*60}")
    ctx.logger.info(f"📩 RESPUESTA RECIBIDA DE: {sender}")
    ctx.logger.info(f"{'='*60}")
    ctx.logger.info(f"\n{msg.response}\n")
    ctx.logger.info(f"{'='*60}\n")

if __name__ == "__main__":
    test_agent.run()
