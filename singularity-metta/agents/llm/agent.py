"""
LLM Agent (ASI-1)

Purpose: Generates natural language responses using ASI-1 LLM
         based on documentation context.

Deployable: YES (AgentVerse compatible)
Dependencies: uagents, uagents_core, openai

Author: Gilbert Sahumada
Date: 2025-01-15
"""

import os
from datetime import datetime, timezone
from typing import List, Dict, Any
from uagents import Agent, Context, Protocol
from shared_models import (
    LLMRequest,
    LLMResponse,
    ErrorResponse
)
from openai import OpenAI

# Configuration
AGENT_NAME = "LLMAgent"
AGENT_PORT = 8004

# Initialize OpenAI client with ASI-1 endpoint
client = OpenAI(
    base_url='https://api.asi1.ai/v1',
    api_key=os.getenv("ASI1_API_KEY", "")
)

# Initialize agent
agent = Agent(
    name=AGENT_NAME,
    port=AGENT_PORT,
    seed="llm_agent_seed_phrase_unique_abcdef"  # Change in production
)

# Protocol
protocol = Protocol()

def prepare_context(chunks: List[Dict[str, Any]]) -> str:
    """
    Prepare documentation context for LLM
    """
    if not chunks:
        return "No documentation available."

    context_parts = []

    for idx, chunk in enumerate(chunks, 1):
        project_name = chunk.get("project_name", chunk.get("projectName", "Unknown"))
        content = chunk.get("content", "")
        score = chunk.get("score", 0.0)

        context_parts.append(
            f"[Source {idx}: {project_name} (relevance: {score:.2f})]\n{content}\n"
        )

    return "\n".join(context_parts)


async def generate_response(query: str, context: str, max_tokens: int = 2048) -> Dict[str, Any]:
    """
    Generate LLM response using ASI-1
    """
    try:
        start_time = datetime.now()

        system_prompt = f"""You are an expert assistant for software developers.
Your job is to help developers implement technologies based on official documentation.

Relevant documentation context:
{context}

Instructions:
1. Answer based EXCLUSIVELY on the provided documentation
2. If the question cannot be answered with the documentation, clearly state that you don't have that information
3. Provide code examples when appropriate
4. Be clear, concise, and technical
5. Cite the source project when relevant
6. Use markdown formatting for better readability"""

        response = client.chat.completions.create(
            model="asi1-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            max_tokens=max_tokens,
            temperature=0.7
        )

        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000

        answer = str(response.choices[0].message.content)
        tokens_used = response.usage.total_tokens if response.usage else 0

        # Extract source projects mentioned
        sources = []
        # Simple heuristic: look for [Source N: ProjectName] patterns in context
        import re
        source_pattern = r'\[Source \d+: ([^\]]+?)\s*\(relevance'
        sources = list(set(re.findall(source_pattern, context)))

        return {
            "success": True,
            "answer": answer,
            "sources_used": sources,
            "tokens_used": tokens_used,
            "response_time_ms": elapsed_ms
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "answer": "",
            "sources_used": [],
            "tokens_used": 0,
            "response_time_ms": 0.0
        }

@protocol.on_message(LLMRequest)
async def handle_llm_request(ctx: Context, sender: str, msg: LLMRequest):
    """Handle LLM request"""
    ctx.logger.info(f"🤖 LLM request from {sender}")
    ctx.logger.info(f"  Query: '{msg.query}'")
    ctx.logger.info(f"  Context chunks: {len(msg.context_chunks)}")

    try:
        # Check API key
        if not os.getenv("ASI1_API_KEY") or os.getenv("ASI1_API_KEY") == "":
            ctx.logger.error("❌ ASI1_API_KEY not configured")
            await ctx.send(
                msg.user_address,
                ErrorResponse(
                    error="ASI1_API_KEY not configured",
                    agent_name=AGENT_NAME,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    details="Cannot generate response without API key"
                )
            )
            return

        # Prepare context
        context = prepare_context(msg.context_chunks)

        # Generate response
        result = await generate_response(
            query=msg.query,
            context=context,
            max_tokens=msg.max_tokens
        )

        if not result["success"]:
            ctx.logger.error(f"❌ LLM generation failed: {result.get('error')}")
            await ctx.send(
                msg.user_address,
                ErrorResponse(
                    error=result.get("error", "Unknown error"),
                    agent_name=AGENT_NAME,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    details="LLM generation failed"
                )
            )
            return

        ctx.logger.info(f"✅ Generated response ({result['tokens_used']} tokens, {result['response_time_ms']:.2f}ms)")
        ctx.logger.info(f"  Sources: {', '.join(result['sources_used'])}")

        # Send response
        await ctx.send(
            msg.user_address,
            LLMResponse(
                answer=result["answer"],
                sources_used=result["sources_used"],
                tokens_used=result["tokens_used"],
                response_time_ms=result["response_time_ms"]
            )
        )

    except Exception as e:
        ctx.logger.error(f"❌ Error processing LLM request: {e}")
        await ctx.send(
            msg.user_address,
            ErrorResponse(
                error=str(e),
                agent_name=AGENT_NAME,
                timestamp=datetime.now(timezone.utc).isoformat(),
                details="LLM request processing error"
            )
        )


# ==================== STARTUP ====================

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 Listening on port {AGENT_PORT}")
    ctx.logger.info(f"🧠 Using ASI-1 LLM (https://api.asi1.ai)")

    # Validate API key
    if not os.getenv("ASI1_API_KEY") or os.getenv("ASI1_API_KEY") == "":
        ctx.logger.warning("⚠️ ASI1_API_KEY not configured - agent won't be able to generate responses")
    else:
        ctx.logger.info("✅ ASI-1 API key configured")

    ctx.logger.info(f"🎯 Ready to generate intelligent responses")


# Register protocol
agent.include(protocol, publish_manifest=True)


if __name__ == "__main__":
    agent.run()
