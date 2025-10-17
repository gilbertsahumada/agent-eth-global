"""
Search Agent

Purpose: Performs parallel vector search across multiple project collections
         in Qdrant via Next.js API endpoint.
"""

import os
from datetime import datetime, timezone
from typing import List, Dict, Any
from uagents import Agent, Context, Protocol
from shared_models import (
    SearchRequest,
    SearchResponse,
    ErrorResponse
)
import requests

# Configuration
AGENT_NAME = "SearchAgent"
AGENT_PORT = 8003
NEXT_API_BASE = os.getenv("NEXT_API_BASE_URL", "https://agent-eth-global.vercel.app/api")
MULTI_SEARCH_URL = f"{NEXT_API_BASE}/docs/multi-search"

# Initialize agent
agent = Agent(
    name=AGENT_NAME,
    port=AGENT_PORT,
    seed="search_agent_seed_phrase_unique_67890"  # Change in production
)

# Protocol
protocol = Protocol()

async def search_multiple_projects(
    project_ids: List[str],
    query: str,
    top_k: int = 5
) -> Dict[str, Any]:
    """
    Call the multi-search API endpoint to search across multiple projects in parallel
    """
    try:
        payload = {
            "projectIds": project_ids,
            "searchText": query,
            "topK": top_k
        }

        response = requests.post(
            MULTI_SEARCH_URL,
            json=payload,
            timeout=30  # 30s timeout for parallel searches
        )

        response.raise_for_status()
        data = response.json()

        return {
            "success": True,
            "results": data.get("results", []),
            "total_results": data.get("totalResults", 0),
            "projects_searched": data.get("projectsSearched", []),
            "search_time_ms": data.get("searchTimeMs", 0)
        }

    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Search request timed out",
            "results": [],
            "total_results": 0,
            "projects_searched": [],
            "search_time_ms": 0
        }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"API request failed: {str(e)}",
            "results": [],
            "total_results": 0,
            "projects_searched": [],
            "search_time_ms": 0
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "results": [],
            "total_results": 0,
            "projects_searched": [],
            "search_time_ms": 0
        }


def enrich_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Enrich search results with additional metadata
    """
    enriched = []

    for chunk in chunks:
        enriched_chunk = {
            "content": chunk.get("content", ""),
            "project_id": chunk.get("projectId", ""),
            "project_name": chunk.get("projectName", "Unknown"),
            "file_path": chunk.get("filePath", ""),
            "chunk_index": chunk.get("chunkIndex", 0),
            "score": chunk.get("score", 0.0),
            "metadata": chunk.get("metadata", {}),
            "project_domain": chunk.get("projectDomain"),
            "project_tech_stack": chunk.get("projectTechStack", [])
        }
        enriched.append(enriched_chunk)

    return enriched

@protocol.on_message(SearchRequest)
async def handle_search_request(ctx: Context, sender: str, msg: SearchRequest):
    """Handle search request"""
    start_time = datetime.now()

    ctx.logger.info(f"🔍 Search request from {sender}")
    ctx.logger.info(f"  Query: '{msg.query}'")
    ctx.logger.info(f"  Projects: {len(msg.project_ids)}")
    ctx.logger.info(f"  Top-K: {msg.top_k}")

    try:
        if not msg.project_ids or len(msg.project_ids) == 0:
            ctx.logger.warning("⚠️ No project IDs provided")
            await ctx.send(
                msg.user_address,
                SearchResponse(
                    chunks=[],
                    total_results=0,
                    projects_searched=[],
                    search_time_ms=0.0
                )
            )
            return

        # Perform multi-project search
        result = await search_multiple_projects(
            project_ids=msg.project_ids,
            query=msg.query,
            top_k=msg.top_k
        )

        if not result["success"]:
            # Search failed
            ctx.logger.error(f"❌ Search failed: {result.get('error')}")
            await ctx.send(
                msg.user_address,
                ErrorResponse(
                    error=result.get("error", "Unknown error"),
                    agent_name=AGENT_NAME,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    details="Multi-project search failed"
                )
            )
            return

        # Enrich results
        enriched_chunks = enrich_chunks(result["results"])

        # Calculate total time (including our processing)
        total_time_ms = (datetime.now() - start_time).total_seconds() * 1000

        ctx.logger.info(f"✅ Found {result['total_results']} results across {len(result['projects_searched'])} projects")
        ctx.logger.info(f"  Search time: {result['search_time_ms']:.2f}ms (API) + {total_time_ms - result['search_time_ms']:.2f}ms (processing)")

        # Send response
        await ctx.send(
            msg.user_address,
            SearchResponse(
                chunks=enriched_chunks,
                total_results=result["total_results"],
                projects_searched=result["projects_searched"],
                search_time_ms=total_time_ms
            )
        )

    except Exception as e:
        ctx.logger.error(f"❌ Error processing search: {e}")
        await ctx.send(
            msg.user_address,
            ErrorResponse(
                error=str(e),
                agent_name=AGENT_NAME,
                timestamp=datetime.now(timezone.utc).isoformat(),
                details="Search processing error"
            )
        )

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 Listening on port {AGENT_PORT}")
    ctx.logger.info(f"🔍 Multi-search API: {MULTI_SEARCH_URL}")
    ctx.logger.info(f"🎯 Ready to perform parallel searches")


# Register protocol
agent.include(protocol, publish_manifest=True)


if __name__ == "__main__":
    agent.run()
