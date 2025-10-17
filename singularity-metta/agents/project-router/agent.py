"""
Project Router Agent

Purpose: Analyzes user queries and routes them to the most relevant projects
         based on keywords, tech stack, domain, and semantic matching.
"""

import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Any
from uagents import Agent, Context, Protocol
from shared_models import (
    ProjectRouteRequest,
    ProjectRouteResponse,
    ErrorResponse
)
import requests

# Configuration
AGENT_NAME = "ProjectRouterAgent"
AGENT_PORT = 8002
NEXT_API_BASE = os.getenv("NEXT_API_BASE_URL", "https://agent-eth-global.vercel.app/api")
PROJECTS_URL = f"{NEXT_API_BASE}/projects"

# Initialize agent
agent = Agent(
    name=AGENT_NAME,
    port=AGENT_PORT,
    seed="project_router_seed_phrase_unique_12345"  # Change in production
)

# Protocol
protocol = Protocol()

DOMAIN_KEYWORDS = {
    "DeFi": ["defi", "swap", "liquidity", "lending", "borrow", "yield", "farm", "dex", "amm", "uniswap", "aave"],
    "NFT": ["nft", "erc721", "erc1155", "token", "metadata", "opensea", "marketplace", "collectible"],
    "Gaming": ["game", "gaming", "play", "nft", "metaverse", "unity", "unreal"],
    "Oracles": ["oracle", "chainlink", "data", "feed", "price", "vrf", "random", "automation"],
    "Infrastructure": ["node", "rpc", "indexer", "graph", "subgraph", "infra", "network"],
    "Smart Contracts": ["contract", "solidity", "vyper", "deploy", "compile", "hardhat", "foundry", "truffle"],
    "Tools": ["sdk", "cli", "tool", "framework", "library", "api", "test"],
}

TECH_KEYWORDS = {
    "Solidity": ["solidity", "contract", "pragma", "evm"],
    "Hardhat": ["hardhat", "deploy", "test", "compile", "script"],
    "Foundry": ["foundry", "forge", "cast", "anvil"],
    "OpenZeppelin": ["openzeppelin", "oz", "erc20", "erc721", "ownable", "pausable"],
    "Ethers.js": ["ethers", "provider", "signer", "contract"],
    "Web3.js": ["web3", "provider", "contract"],
    "React": ["react", "component", "jsx", "hook"],
    "Next.js": ["nextjs", "next", "pages", "app"],
    "Chainlink": ["chainlink", "oracle", "vrf", "keeper", "ccip"],
}

def extract_keywords(query: str) -> List[str]:
    """Extract meaningful keywords from query"""
    # Convert to lowercase
    query_lower = query.lower()

    # Remove common words
    stop_words = {"how", "to", "the", "a", "an", "in", "on", "with", "for", "and", "or", "what", "is", "are", "can", "i", "my"}

    # Split into words and filter
    words = re.findall(r'\b\w+\b', query_lower)
    keywords = [w for w in words if w not in stop_words and len(w) > 2]

    return keywords


def score_project_by_keywords(project: Dict[str, Any], query_keywords: List[str]) -> float:
    """Score project based on keyword matching"""
    score = 0.0

    project_name = project.get("name", "").lower()
    project_keywords = [k.lower() for k in (project.get("keywords") or [])]
    project_tags = [t.lower() for t in (project.get("tags") or [])]
    project_tech = [ts.lower() for ts in (project.get("tech_stack") or [])]
    project_domain = (project.get("domain") or "").lower()

    for kw in query_keywords:
        # Name match (highest weight)
        if kw in project_name:
            score += 20

        # Keyword match
        if kw in project_keywords:
            score += 15

        # Tag match
        if kw in project_tags:
            score += 10

        # Tech stack match
        if kw in project_tech:
            score += 15

        # Domain match
        if kw in project_domain:
            score += 12

        # Partial matches in arrays
        for pk in project_keywords:
            if kw in pk or pk in kw:
                score += 8

        for pt in project_tags:
            if kw in pt or pt in kw:
                score += 5

    return score


def score_project_by_domain(project: Dict[str, Any], query: str) -> float:
    """Score project based on domain matching"""
    score = 0.0
    query_lower = query.lower()
    project_domain = (project.get("domain") or "").lower()

    if not project_domain:
        return 0.0

    # Check if query contains domain-specific keywords
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if domain.lower() == project_domain:
            for kw in keywords:
                if kw in query_lower:
                    score += 5
                    break

    return score


def score_project_by_tech_stack(project: Dict[str, Any], query: str) -> float:
    """Score project based on tech stack matching"""
    score = 0.0
    query_lower = query.lower()
    project_tech = project.get("tech_stack") or []

    for tech in project_tech:
        tech_lower = tech.lower()

        # Direct tech mention in query
        if tech_lower in query_lower:
            score += 15

        # Check for tech-related keywords
        if tech in TECH_KEYWORDS:
            for kw in TECH_KEYWORDS[tech]:
                if kw in query_lower:
                    score += 8
                    break

    return score


def route_projects(query: str, all_projects: List[Dict[str, Any]], max_projects: int = 5) -> List[Dict[str, Any]]:
    """
    Main routing logic: Score and select most relevant projects
    """
    if not all_projects:
        return []

    # Extract keywords from query
    query_keywords = extract_keywords(query)

    # Score each project
    scored_projects = []

    for project in all_projects:
        total_score = 0.0
        reasons = []

        # Keyword scoring
        kw_score = score_project_by_keywords(project, query_keywords)
        if kw_score > 0:
            total_score += kw_score
            reasons.append(f"keyword match (score: {kw_score:.1f})")

        # Domain scoring
        domain_score = score_project_by_domain(project, query)
        if domain_score > 0:
            total_score += domain_score
            reasons.append(f"domain match (score: {domain_score:.1f})")

        # Tech stack scoring
        tech_score = score_project_by_tech_stack(project, query)
        if tech_score > 0:
            total_score += tech_score
            reasons.append(f"tech stack match (score: {tech_score:.1f})")

        # If project has some relevance, add to results
        if total_score > 0:
            scored_projects.append({
                "project": project,
                "score": total_score,
                "reason": ", ".join(reasons) if reasons else "general match"
            })

    # Sort by score (highest first)
    scored_projects.sort(key=lambda x: x["score"], reverse=True)

    # Take top N projects
    top_projects = scored_projects[:max_projects]

    # Format results
    results = []
    for item in top_projects:
        project = item["project"]
        results.append({
            "id": project["id"],
            "name": project["name"],
            "reason": item["reason"],
            "score": item["score"],
            "domain": project.get("domain"),
            "tech_stack": project.get("tech_stack")
        })

    return results


# ==================== MESSAGE HANDLERS ====================

@protocol.on_message(ProjectRouteRequest)
async def handle_route_request(ctx: Context, sender: str, msg: ProjectRouteRequest):
    """Handle project routing request"""
    start_time = datetime.now()

    ctx.logger.info(f"📍 Routing request from {sender}: '{msg.query}'")

    try:
        # Fetch all projects from API
        response = requests.get(PROJECTS_URL, timeout=10)
        response.raise_for_status()
        data = response.json()

        all_projects = data.get("projects", [])
        total_projects = len(all_projects)

        ctx.logger.info(f"📚 Found {total_projects} total projects")

        if total_projects == 0:
            # No projects available
            await ctx.send(
                msg.user_address,
                ProjectRouteResponse(
                    selected_projects=[],
                    all_projects_count=0,
                    routing_time_ms=0.0
                )
            )
            return

        # Route to relevant projects
        selected = route_projects(msg.query, all_projects, msg.max_projects)

        # Calculate time
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000

        ctx.logger.info(f"✅ Routed to {len(selected)} projects in {elapsed_ms:.2f}ms")
        for proj in selected:
            ctx.logger.info(f"  - {proj['name']} (score: {proj['score']:.1f})")

        # Send response
        await ctx.send(
            msg.user_address,
            ProjectRouteResponse(
                selected_projects=selected,
                all_projects_count=total_projects,
                routing_time_ms=elapsed_ms
            )
        )

    except Exception as e:
        ctx.logger.error(f"❌ Error routing projects: {e}")
        await ctx.send(
            msg.user_address,
            ErrorResponse(
                error=str(e),
                agent_name=AGENT_NAME,
                timestamp=datetime.now(timezone.utc).isoformat(),
                details="Failed to route projects"
            )
        )

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 Listening on port {AGENT_PORT}")
    ctx.logger.info(f"📚 Projects API: {PROJECTS_URL}")
    ctx.logger.info(f"🎯 Ready to route queries to relevant projects")


# Register protocol
agent.include(protocol, publish_manifest=True)


if __name__ == "__main__":
    agent.run()
