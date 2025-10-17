"""
Code Generator Agent

Purpose: Extracts, formats, and validates code examples from documentation chunks.
"""

import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from uagents import Agent, Context, Protocol
from shared_models import (
    CodeGenRequest,
    CodeGenResponse,
    ErrorResponse
)

AGENT_NAME = "CodeGeneratorAgent"
AGENT_PORT = 8005

agent = Agent(
    name=AGENT_NAME,
    port=AGENT_PORT,
    seed="code_gen_agent_seed_phrase_unique_xyz123" 
)

# Protocol
protocol = Protocol()

# Language detection patterns
LANGUAGE_PATTERNS = {
    "solidity": [r"pragma solidity", r"contract\s+\w+", r"function\s+\w+.*\s+(public|private|internal|external)"],
    "javascript": [r"const\s+\w+\s*=", r"function\s+\w+\s*\(", r"async\s+function", r"=>\s*{", r"require\(", r"import\s+"],
    "typescript": [r"interface\s+\w+", r"type\s+\w+\s*=", r":\s*(string|number|boolean)", r"<.*>"],
    "python": [r"def\s+\w+\s*\(", r"class\s+\w+", r"import\s+\w+", r"from\s+\w+\s+import"],
    "bash": [r"^\s*#\s*!", r"npm\s+install", r"yarn\s+add", r"cd\s+", r"mkdir", r"^\$\s+"],
    "json": [r"^\s*{", r":\s*{", r":\s*\[", r"}\s*,?\s*$"],
    "yaml": [r"^\s*\w+:", r":\s*$", r"^\s*-\s+"],
}


def detect_language(code: str, hint: Optional[str] = None) -> str:
    """
    Detect programming language from code snippet
    """
    if hint and hint.lower() in LANGUAGE_PATTERNS:
        return hint.lower()

    # Try to detect based on patterns
    scores = {lang: 0 for lang in LANGUAGE_PATTERNS}

    for lang, patterns in LANGUAGE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, code, re.MULTILINE | re.IGNORECASE):
                scores[lang] += 1

    # Return language with highest score
    max_score = max(scores.values())
    if max_score > 0:
        for lang, score in scores.items():
            if score == max_score:
                return lang

    return "text"


def extract_code_blocks(content: str) -> List[Dict[str, Any]]:
    """
    Extract code blocks from markdown content
    """
    code_blocks = []

    # Pattern for fenced code blocks: ```language\ncode\n```
    fenced_pattern = r'```(\w+)?\n(.*?)```'
    matches = re.finditer(fenced_pattern, content, re.DOTALL)

    for match in matches:
        language_hint = match.group(1)
        code = match.group(2).strip()

        if code:
            detected_lang = detect_language(code, language_hint)
            code_blocks.append({
                "code": code,
                "language": detected_lang,
                "method": "fenced"
            })

    # Also look for indented code blocks (4 spaces or tab)
    if not code_blocks:
        indented_pattern = r'(?:^|\n)((?:    |\t).*(?:\n(?:    |\t).*)*)'
        matches = re.finditer(indented_pattern, content, re.MULTILINE)

        for match in matches:
            code = match.group(1)
            # Remove indentation
            code = re.sub(r'^(?:    |\t)', '', code, flags=re.MULTILINE).strip()

            if len(code) > 20:  # Only consider substantial code blocks
                detected_lang = detect_language(code)
                code_blocks.append({
                    "code": code,
                    "language": detected_lang,
                    "method": "indented"
                })

    return code_blocks


def filter_relevant_code(code_blocks: List[Dict[str, Any]], query: str, target_language: str) -> List[Dict[str, Any]]:
    """
    Filter code blocks by relevance to query and language preference
    """
    if not code_blocks:
        return []

    filtered = []

    query_lower = query.lower()
    query_keywords = set(re.findall(r'\b\w+\b', query_lower))

    for block in code_blocks:
        relevance_score = 0
        code_lower = block["code"].lower()

        # Prefer target language
        if block["language"] == target_language:
            relevance_score += 10

        # Check for query keywords in code
        for keyword in query_keywords:
            if keyword in code_lower:
                relevance_score += 2

        # Prefer longer, more substantial code
        code_length = len(block["code"])
        if code_length > 100:
            relevance_score += 1
        if code_length > 300:
            relevance_score += 2

        block["relevance_score"] = relevance_score
        filtered.append(block)

    # Sort by relevance
    filtered.sort(key=lambda x: x["relevance_score"], reverse=True)

    return filtered


def create_code_example(code_block: Dict[str, Any], source_chunk: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a formatted code example with metadata
    """
    # Generate description from surrounding context
    content = source_chunk.get("content", "")
    code = code_block["code"]

    # Try to find text before the code block as description
    code_index = content.find(code)
    description = "Code example"

    if code_index > 0:
        # Get text before code (up to 200 chars)
        preceding_text = content[:code_index].strip()
        if preceding_text:
            # Get last sentence or paragraph
            sentences = re.split(r'[.!?]\s+', preceding_text)
            if sentences:
                description = sentences[-1].strip()
                if len(description) > 150:
                    description = description[:147] + "..."

    return {
        "code": code_block["code"],
        "language": code_block["language"],
        "description": description,
        "source_project": source_chunk.get("project_name", source_chunk.get("projectName", "Unknown")),
        "file_path": source_chunk.get("file_path", source_chunk.get("filePath", ""))
    }

@protocol.on_message(CodeGenRequest)
async def handle_code_gen_request(ctx: Context, sender: str, msg: CodeGenRequest):
    """Handle code generation request"""
    start_time = datetime.now()

    ctx.logger.info(f"💻 Code generation request from {sender}")
    ctx.logger.info(f"  Query: '{msg.query}'")
    ctx.logger.info(f"  Target language: {msg.language}")
    ctx.logger.info(f"  Chunks to process: {len(msg.chunks)}")

    try:
        all_code_blocks = []

        # Extract code from all chunks
        for chunk in msg.chunks:
            content = chunk.get("content", "")
            extracted = extract_code_blocks(content)

            for block in extracted:
                block["source_chunk"] = chunk
                all_code_blocks.append(block)

        ctx.logger.info(f"📝 Extracted {len(all_code_blocks)} code blocks")

        if not all_code_blocks:
            ctx.logger.warning("⚠️ No code blocks found in documentation")
            # Return empty response
            elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
            await ctx.send(
                msg.user_address,
                CodeGenResponse(
                    examples=[],
                    generation_time_ms=elapsed_ms
                )
            )
            return

        # Filter by relevance and language
        filtered = filter_relevant_code(all_code_blocks, msg.query, msg.language)

        # Take top 5 most relevant
        top_blocks = filtered[:5]

        # Create formatted examples
        examples = []
        for block in top_blocks:
            example = create_code_example(block, block["source_chunk"])
            examples.append(example)

        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000

        ctx.logger.info(f"✅ Generated {len(examples)} code examples in {elapsed_ms:.2f}ms")
        for idx, ex in enumerate(examples, 1):
            ctx.logger.info(f"  {idx}. {ex['language']} from {ex['source_project']}")

        # Send response
        await ctx.send(
            msg.user_address,
            CodeGenResponse(
                examples=examples,
                generation_time_ms=elapsed_ms
            )
        )

    except Exception as e:
        ctx.logger.error(f"❌ Error generating code examples: {e}")
        await ctx.send(
            msg.user_address,
            ErrorResponse(
                error=str(e),
                agent_name=AGENT_NAME,
                timestamp=datetime.now(timezone.utc).isoformat(),
                details="Code generation failed"
            )
        )

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 Listening on port {AGENT_PORT}")
    ctx.logger.info(f"💻 Supported languages: {', '.join(LANGUAGE_PATTERNS.keys())}")
    ctx.logger.info(f"🎯 Ready to extract and format code examples")


# Register protocol
agent.include(protocol, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
