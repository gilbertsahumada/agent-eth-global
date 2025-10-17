"""
Orchestrator Agent (Main Coordinator)

Purpose: Coordinates all sub-agents to handle user queries.
         This is the main entry point for user interactions.

Flow:
  User Query → Project Router → Search → [MeTTa + LLM + CodeGen] → Synthesis → User
"""

import os
import sys
from datetime import datetime, timezone
from uuid import uuid4
from typing import Dict, Any, Optional
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from shared_models import (
    ProjectRouteRequest,
    ProjectRouteResponse,
    SearchRequest,
    SearchResponse,
    MeTTaReasoningRequest,
    MeTTaReasoningResponse,
    LLMRequest,
    LLMResponse,
    CodeGenRequest,
    CodeGenResponse,
    SynthesisRequest,
    SynthesizedResponse,
    ErrorResponse
)

# Configuration
AGENT_NAME = "OrchestratorAgent"
AGENT_PORT = 8000

# Agent addresses (update these with actual addresses after deployment)
PROJECT_ROUTER_ADDRESS = os.getenv("PROJECT_ROUTER_ADDRESS", "agent1qproject_router")  # Replace
SEARCH_AGENT_ADDRESS = os.getenv("SEARCH_AGENT_ADDRESS", "agent1qsearch")  # Replace
METTA_AGENT_ADDRESS = os.getenv("METTA_AGENT_ADDRESS", "agent1qmetta")  # Local agent
LLM_AGENT_ADDRESS = os.getenv("LLM_AGENT_ADDRESS", "agent1qllm")  # Replace
CODE_GEN_ADDRESS = os.getenv("CODE_GEN_ADDRESS", "agent1qcodegen")  # Replace
SYNTHESIS_ADDRESS = os.getenv("SYNTHESIS_ADDRESS", "agent1qsynthesis")  # Replace


agent = Agent(
    name=AGENT_NAME,
    port=AGENT_PORT,
    seed="orchestrator_agent_seed_phrase_unique_000"  
)

chat_protocol = Protocol(spec=chat_protocol_spec)

class SessionState:
    """Track conversation state for a user query"""

    def __init__(self, query: str, user_address: str, msg_id: str):
        self.query = query
        self.user_address = user_address
        self.msg_id = msg_id
        self.start_time = datetime.now()

        # Agent responses
        self.project_route_response: Optional[Dict] = None
        self.search_response: Optional[Dict] = None
        self.metta_response: Optional[Dict] = None
        self.llm_response: Optional[Dict] = None
        self.codegen_response: Optional[Dict] = None

        # Tracking
        self.waiting_for: str = "project_router"
        self.errors: list = []

    def is_ready_for_synthesis(self) -> bool:
        """Check if we have all required responses for synthesis"""
        # Search is required, others are optional
        return self.search_response is not None

    def elapsed_ms(self) -> float:
        return (datetime.now() - self.start_time).total_seconds() * 1000


# Store active sessions
active_sessions: Dict[str, SessionState] = {}

@chat_protocol.on_message(ChatMessage)
async def handle_user_query(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming user query via chat protocol"""
    # Extract text from message content
    query = ''
    for item in msg.content:
        if isinstance(item, TextContent):
            query += item.text

    query = query.strip()

    if not query:
        ctx.logger.warning("Received empty query")
        return

    ctx.logger.info(f"👤 User query from {sender}: '{query}'")

    # Send acknowledgement
    await ctx.send(
        sender,
        ChatAcknowledgement(
            timestamp=datetime.now(timezone.utc),
            acknowledged_msg_id=msg.msg_id
        )
    )

    # Create session
    session_id = str(msg.msg_id)
    session = SessionState(query, sender, str(msg.msg_id))
    active_sessions[session_id] = session

    # Store session in context storage
    ctx.storage.set(f"session_{session_id}", {
        "query": query,
        "user": sender,
        "msg_id": str(msg.msg_id)
    })

    ctx.logger.info(f"🎯 Starting multi-agent flow for session {session_id}")

    try:
        # Step 1: Route to Project Router Agent
        ctx.logger.info(f"📍 Step 1: Routing query to projects...")
        await ctx.send(
            PROJECT_ROUTER_ADDRESS,
            ProjectRouteRequest(
                query=query,
                user_address=agent.address,
                max_projects=5
            )
        )

        session.waiting_for = "project_router"

    except Exception as e:
        ctx.logger.error(f"❌ Error starting query flow: {e}")
        await send_error_to_user(ctx, sender, str(msg.msg_id), str(e))
        active_sessions.pop(session_id, None)


@chat_protocol.on_message(ChatAcknowledgement)
async def handle_chat_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle chat acknowledgements"""
    ctx.logger.info(f"✓ Acknowledgement from {sender}")

@chat_protocol.on_message(ProjectRouteResponse)
async def handle_project_route_response(ctx: Context, sender: str, msg: ProjectRouteResponse):
    """Handle response from Project Router Agent"""
    ctx.logger.info(f"📍 Project Router response: {len(msg.selected_projects)} projects selected")

    # Find session
    session = find_session_waiting_for(ctx, "project_router")
    if not session:
        ctx.logger.warning("No active session waiting for project router")
        return

    session.project_route_response = {
        "selected_projects": msg.selected_projects,
        "all_projects_count": msg.all_projects_count,
        "routing_time_ms": msg.routing_time_ms
    }

    if not msg.selected_projects:
        # No projects found
        ctx.logger.warning("No relevant projects found")
        await send_message_to_user(
            ctx,
            session.user_address,
            session.msg_id,
            "I couldn't find any relevant documentation for your query. Please try rephrasing or ask about a different topic."
        )
        active_sessions.pop(session.msg_id, None)
        return

    # Step 2: Search across selected projects
    project_ids = [p["id"] for p in msg.selected_projects]
    ctx.logger.info(f"🔍 Step 2: Searching across {len(project_ids)} projects...")

    await ctx.send(
        SEARCH_AGENT_ADDRESS,
        SearchRequest(
            query=session.query,
            project_ids=project_ids,
            top_k=5,
            user_address=agent.address
        )
    )

    session.waiting_for = "search"


@chat_protocol.on_message(SearchResponse)
async def handle_search_response(ctx: Context, sender: str, msg: SearchResponse):
    """Handle response from Search Agent"""
    ctx.logger.info(f"🔍 Search response: {msg.total_results} results from {len(msg.projects_searched)} projects")

    session = find_session_waiting_for(ctx, "search")
    if not session:
        ctx.logger.warning("No active session waiting for search")
        return

    session.search_response = {
        "chunks": msg.chunks,
        "total_results": msg.total_results,
        "projects_searched": msg.projects_searched,
        "search_time_ms": msg.search_time_ms
    }

    if msg.total_results == 0:
        # No results found
        await send_message_to_user(
            ctx,
            session.user_address,
            session.msg_id,
            f"I couldn't find relevant information about '{session.query}' in the documentation."
        )
        active_sessions.pop(session.msg_id, None)
        return

    # Step 3: Send to MeTTa, LLM, and CodeGen in parallel
    ctx.logger.info(f"🚀 Step 3: Sending to reasoning agents (parallel)...")

    # MeTTa Reasoning
    await ctx.send(
        METTA_AGENT_ADDRESS,
        MeTTaReasoningRequest(
            query=session.query,
            chunks=msg.chunks,
            user_address=agent.address
        )
    )

    # LLM
    await ctx.send(
        LLM_AGENT_ADDRESS,
        LLMRequest(
            query=session.query,
            context_chunks=msg.chunks,
            user_address=agent.address,
            max_tokens=2048
        )
    )

    # Code Generator
    await ctx.send(
        CODE_GEN_ADDRESS,
        CodeGenRequest(
            query=session.query,
            chunks=msg.chunks,
            language="solidity",  # Could be inferred from query
            user_address=agent.address
        )
    )

    session.waiting_for = "reasoning_agents"


@chat_protocol.on_message(MeTTaReasoningResponse)
async def handle_metta_response(ctx: Context, sender: str, msg: MeTTaReasoningResponse):
    """Handle response from MeTTa Reasoning Agent"""
    ctx.logger.info(f"🧠 MeTTa response: {len(msg.dependencies)} dependencies, {len(msg.execution_order)} steps")

    session = find_session_waiting_for(ctx, "reasoning_agents")
    if not session:
        return

    session.metta_response = {
        "dependencies": msg.dependencies,
        "execution_order": msg.execution_order,
        "conflicts": msg.conflicts,
        "prerequisites": msg.prerequisites,
        "symbolic_facts": msg.symbolic_facts,
        "confidence": msg.confidence,
        "reasoning_time_ms": msg.reasoning_time_ms
    }

    await check_and_synthesize(ctx, session)


@chat_protocol.on_message(LLMResponse)
async def handle_llm_response(ctx: Context, sender: str, msg: LLMResponse):
    """Handle response from LLM Agent"""
    ctx.logger.info(f"🤖 LLM response: {msg.tokens_used} tokens used")

    session = find_session_waiting_for(ctx, "reasoning_agents")
    if not session:
        return

    session.llm_response = {
        "answer": msg.answer,
        "sources_used": msg.sources_used,
        "tokens_used": msg.tokens_used,
        "response_time_ms": msg.response_time_ms
    }

    await check_and_synthesize(ctx, session)


@chat_protocol.on_message(CodeGenResponse)
async def handle_codegen_response(ctx: Context, sender: str, msg: CodeGenResponse):
    """Handle response from Code Generator Agent"""
    ctx.logger.info(f"💻 CodeGen response: {len(msg.examples)} code examples")

    session = find_session_waiting_for(ctx, "reasoning_agents")
    if not session:
        return

    session.codegen_response = {
        "examples": msg.examples,
        "generation_time_ms": msg.generation_time_ms
    }

    await check_and_synthesize(ctx, session)


@chat_protocol.on_message(SynthesizedResponse)
async def handle_synthesis_response(ctx: Context, sender: str, msg: SynthesizedResponse):
    """Handle response from Synthesis Agent - final step!"""
    ctx.logger.info(f"✨ Synthesis complete: {len(msg.agents_used)} agents used")

    session = find_session_waiting_for(ctx, "synthesis")
    if not session:
        return

    # Send final response to user
    await send_message_to_user(
        ctx,
        session.user_address,
        session.msg_id,
        msg.markdown
    )

    ctx.logger.info(f"✅ Query completed in {session.elapsed_ms():.2f}ms total")

    # Clean up session
    active_sessions.pop(session.msg_id, None)


@chat_protocol.on_message(ErrorResponse)
async def handle_error_response(ctx: Context, sender: str, msg: ErrorResponse):
    """Handle error from any agent"""
    ctx.logger.error(f"❌ Error from {msg.agent_name}: {msg.error}")

    # Find session and record error
    for session in active_sessions.values():
        session.errors.append(f"{msg.agent_name}: {msg.error}")

    # For now, continue without the failed agent
    # TODO: Could implement retry logic


def find_session_waiting_for(ctx: Context, waiting_for: str) -> Optional[SessionState]:
    """Find session waiting for specific agent response"""
    for session in active_sessions.values():
        if session.waiting_for == waiting_for:
            return session
    return None


async def check_and_synthesize(ctx: Context, session: SessionState):
    """Check if all reasoning agents responded, then synthesize"""
    # Wait for at least LLM (others are optional)
    if session.llm_response is None:
        return  # Still waiting

    # We have enough to synthesize
    ctx.logger.info(f"🔄 Step 4: Synthesizing final response...")

    await ctx.send(
        SYNTHESIS_ADDRESS,
        SynthesisRequest(
            query=session.query,
            metta_reasoning=session.metta_response,
            llm_response=session.llm_response,
            code_examples=session.codegen_response,
            search_results=session.search_response,
            user_address=agent.address
        )
    )

    session.waiting_for = "synthesis"


async def send_message_to_user(ctx: Context, user_address: str, msg_id: str, text: str):
    """Send final message to user"""
    await ctx.send(
        user_address,
        ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[
                TextContent(type="text", text=text),
                EndSessionContent(type="end-session")
            ]
        )
    )


async def send_error_to_user(ctx: Context, user_address: str, msg_id: str, error: str):
    """Send error message to user"""
    await send_message_to_user(
        ctx,
        user_address,
        msg_id,
        f"Sorry, I encountered an error processing your query:\n\n{error}\n\nPlease try again."
    )


# ==================== STARTUP ====================

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 Listening on port {AGENT_PORT}")
    ctx.logger.info(f"🎯 Multi-Agent Orchestration ready!")
    ctx.logger.info(f"")
    ctx.logger.info(f"📋 Sub-agent addresses:")
    ctx.logger.info(f"  - Project Router: {PROJECT_ROUTER_ADDRESS}")
    ctx.logger.info(f"  - Search: {SEARCH_AGENT_ADDRESS}")
    ctx.logger.info(f"  - MeTTa: {METTA_AGENT_ADDRESS}")
    ctx.logger.info(f"  - LLM: {LLM_AGENT_ADDRESS}")
    ctx.logger.info(f"  - CodeGen: {CODE_GEN_ADDRESS}")
    ctx.logger.info(f"  - Synthesis: {SYNTHESIS_ADDRESS}")


# Register protocol
agent.include(chat_protocol, publish_manifest=True)


if __name__ == "__main__":
    agent.run()
