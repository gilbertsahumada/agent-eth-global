"""
Shared Data Models for Multi-Agent Documentation Assistant

These models define the message structure for inter-agent communication.
All agents must use these models to ensure compatibility.

Created: 2024-01-15
Version: 1.0
"""

from uagents import Model
from typing import List, Dict, Any, Optional


# ===========================
# PROJECT ROUTING MODELS
# ===========================

class ProjectRouteRequest(Model):
    """
    Request to route a query to relevant projects.
    Sent by: Orchestrator Agent
    Received by: Project Router Agent
    """
    query: str
    user_address: str
    max_projects: int = 5


class ProjectInfo(Model):
    """Individual project information with routing metadata"""
    id: str
    name: str
    reason: str  # Why this project was selected
    score: float  # Relevance score (0.0 - 1.0)
    domain: Optional[str] = None
    tech_stack: Optional[List[str]] = None


class ProjectRouteResponse(Model):
    """
    Response with selected projects.
    Sent by: Project Router Agent
    Received by: Orchestrator Agent
    """
    selected_projects: List[Dict[str, Any]]  # List of ProjectInfo-like dicts
    all_projects_count: int
    routing_time_ms: float


# ===========================
# SEARCH MODELS
# ===========================

class SearchRequest(Model):
    """
    Request to search documentation across projects.
    Sent by: Orchestrator Agent
    Received by: Search Agent
    """
    query: str
    project_ids: List[str]
    top_k: int = 5
    user_address: str


class DocumentChunk(Model):
    """Individual documentation chunk result"""
    content: str
    project_id: str
    project_name: str
    file_path: str
    chunk_index: int
    score: float
    metadata: Optional[Dict[str, Any]] = None
    project_domain: Optional[str] = None
    project_tech_stack: Optional[List[str]] = None


class SearchResponse(Model):
    """
    Response with search results.
    Sent by: Search Agent
    Received by: Orchestrator Agent
    """
    chunks: List[Dict[str, Any]]  # List of DocumentChunk-like dicts
    total_results: int
    projects_searched: List[str]
    search_time_ms: float


# ===========================
# METTA REASONING MODELS
# ===========================

class MeTTaReasoningRequest(Model):
    """
    Request for symbolic reasoning using MeTTa.
    Sent by: Orchestrator Agent
    Received by: MeTTa Reasoning Agent (local)
    """
    query: str
    chunks: List[Dict[str, Any]]  # Documentation chunks from Search Agent
    user_address: str


class MeTTaReasoningResponse(Model):
    """
    Response with symbolic reasoning results.
    Sent by: MeTTa Reasoning Agent
    Received by: Orchestrator Agent
    """
    dependencies: List[str]  # e.g., ["requires web3.js v2.0", "needs Hardhat installed"]
    execution_order: List[str]  # e.g., ["1. Install deps", "2. Configure", "3. Deploy"]
    conflicts: List[str]  # e.g., ["Version mismatch detected between lib A and B"]
    prerequisites: List[str]  # e.g., ["Node.js 18+", "Ethereum wallet"]
    symbolic_facts: List[str]  # Raw MeTTa output for debugging
    confidence: float  # 0.0 - 1.0
    reasoning_time_ms: float


# ===========================
# LLM MODELS
# ===========================

class LLMRequest(Model):
    """
    Request for natural language response using ASI-1 LLM.
    Sent by: Orchestrator Agent
    Received by: LLM Agent
    """
    query: str
    context_chunks: List[Dict[str, Any]]  # Documentation chunks
    user_address: str
    max_tokens: int = 2048


class LLMResponse(Model):
    """
    Response with LLM-generated answer.
    Sent by: LLM Agent
    Received by: Orchestrator Agent
    """
    answer: str
    sources_used: List[str]  # Project names cited in the answer
    tokens_used: int
    response_time_ms: float


# ===========================
# CODE GENERATION MODELS
# ===========================

class CodeGenRequest(Model):
    """
    Request to extract and format code examples.
    Sent by: Orchestrator Agent
    Received by: Code Generator Agent
    """
    query: str
    chunks: List[Dict[str, Any]]
    language: str = "javascript"  # or "solidity", "python", etc.
    user_address: str


class CodeExample(Model):
    """Individual code example"""
    code: str
    language: str
    description: str
    source_project: str
    file_path: str


class CodeGenResponse(Model):
    """
    Response with extracted code examples.
    Sent by: Code Generator Agent
    Received by: Orchestrator Agent
    """
    examples: List[Dict[str, Any]]  # List of CodeExample-like dicts
    generation_time_ms: float


# ===========================
# SYNTHESIS MODELS
# ===========================

class SynthesisRequest(Model):
    """
    Request to synthesize final response from all agent outputs.
    Sent by: Orchestrator Agent
    Received by: Synthesis Agent
    """
    query: str
    metta_reasoning: Optional[Dict[str, Any]] = None  # MeTTaReasoningResponse-like dict
    llm_response: Optional[Dict[str, Any]] = None  # LLMResponse-like dict
    code_examples: Optional[Dict[str, Any]] = None  # CodeGenResponse-like dict
    search_results: Dict[str, Any]  # SearchResponse-like dict (required)
    user_address: str


class SynthesizedResponse(Model):
    """
    Final synthesized response combining all agent outputs.
    Sent by: Synthesis Agent
    Received by: Orchestrator Agent
    """
    markdown: str  # Formatted markdown response for user
    structure: Dict[str, str]  # Structured sections: {"answer": "...", "code": "...", "reasoning": "..."}
    total_time_ms: float
    agents_used: List[str]  # List of agent names that contributed


# ===========================
# ERROR HANDLING MODELS
# ===========================

class ErrorResponse(Model):
    """
    Generic error response from any agent.
    Sent by: Any Agent
    Received by: Orchestrator Agent
    """
    error: str
    agent_name: str
    timestamp: str
    details: Optional[str] = None


# ===========================
# UTILITY MODELS
# ===========================

class HealthCheckRequest(Model):
    """Request to check agent health"""
    requester: str


class HealthCheckResponse(Model):
    """Response with agent health status"""
    agent_name: str
    status: str  # "healthy", "degraded", "offline"
    uptime_seconds: float
    last_activity: str


# ===========================
# HELPER FUNCTIONS
# ===========================

def dict_to_chunks(chunks_dict_list: List[Dict[str, Any]]) -> List[DocumentChunk]:
    """Convert list of dicts to DocumentChunk objects (if needed for type safety)"""
    return [
        DocumentChunk(
            content=c.get("content", ""),
            project_id=c.get("project_id", ""),
            project_name=c.get("project_name", ""),
            file_path=c.get("file_path", ""),
            chunk_index=c.get("chunk_index", 0),
            score=c.get("score", 0.0),
            metadata=c.get("metadata"),
            project_domain=c.get("project_domain"),
            project_tech_stack=c.get("project_tech_stack")
        )
        for c in chunks_dict_list
    ]


def chunks_to_dict(chunks: List[DocumentChunk]) -> List[Dict[str, Any]]:
    """Convert DocumentChunk objects to dicts for serialization"""
    return [
        {
            "content": c.content,
            "project_id": c.project_id,
            "project_name": c.project_name,
            "file_path": c.file_path,
            "chunk_index": c.chunk_index,
            "score": c.score,
            "metadata": c.metadata,
            "project_domain": c.project_domain,
            "project_tech_stack": c.project_tech_stack
        }
        for c in chunks
    ]


# ===========================
# VERSION INFO
# ===========================

MODELS_VERSION = "1.0.0"
LAST_UPDATED = "2024-01-15"

__all__ = [
    # Project Routing
    "ProjectRouteRequest",
    "ProjectInfo",
    "ProjectRouteResponse",

    # Search
    "SearchRequest",
    "DocumentChunk",
    "SearchResponse",

    # MeTTa Reasoning
    "MeTTaReasoningRequest",
    "MeTTaReasoningResponse",

    # LLM
    "LLMRequest",
    "LLMResponse",

    # Code Generation
    "CodeGenRequest",
    "CodeExample",
    "CodeGenResponse",

    # Synthesis
    "SynthesisRequest",
    "SynthesizedResponse",

    # Error Handling
    "ErrorResponse",

    # Utilities
    "HealthCheckRequest",
    "HealthCheckResponse",
    "dict_to_chunks",
    "chunks_to_dict",

    # Version
    "MODELS_VERSION",
    "LAST_UPDATED"
]
