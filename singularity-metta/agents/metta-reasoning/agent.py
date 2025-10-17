"""
Enhanced MeTTa Reasoning Agent

Purpose: Performs advanced symbolic reasoning using MeTTa (Meta Type Talk)
         to detect dependencies, conflicts, execution order, and prerequisites.
"""

import os
import re
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any, Set
from uagents import Agent, Context, Protocol

# Add parent directory to path to import shared_models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
from shared_models import (
    MeTTaReasoningRequest,
    MeTTaReasoningResponse,
    ErrorResponse
)

# Import hyperon for MeTTa reasoning
try:
    from hyperon import MeTTa
    METTA_AVAILABLE = True
except ImportError:
    METTA_AVAILABLE = False
    print("WARNING: hyperon not available. MeTTa reasoning will be disabled.")

# Configuration
AGENT_NAME = "MeTTaReasoningAgent"
AGENT_PORT = 8006

# Initialize agent
agent = Agent(
    name=AGENT_NAME,
    port=AGENT_PORT,
    seed="metta_reasoning_agent_seed_phrase_unique_mno456"
)


protocol = Protocol()

if METTA_AVAILABLE:
    metta = MeTTa()
else:
    metta = None

def extract_imports(content: str) -> List[str]:
    """Extract import statements from code"""
    imports = []

    # Solidity imports
    solidity_imports = re.findall(r'import\s+["\']([^"\']+)["\']', content)
    imports.extend([f"solidity:{imp}" for imp in solidity_imports])

    # JavaScript/TypeScript imports
    js_imports = re.findall(r'(?:import|require)\s*\(?["\']([^"\']+)["\']', content)
    imports.extend([f"js:{imp}" for imp in js_imports])

    # Python imports
    py_imports = re.findall(r'(?:import|from)\s+(\w+)', content)
    imports.extend([f"python:{imp}" for imp in py_imports])

    return list(set(imports))


def extract_versions(content: str) -> List[tuple]:
    """Extract version numbers from content"""
    versions = []

    # Solidity pragma versions
    pragma_versions = re.findall(r'pragma\s+solidity\s+([^\s;]+)', content)
    for ver in pragma_versions:
        versions.append(("solidity", ver))

    # Package versions (e.g., "@package/name@1.2.3" or "package@^1.0.0")
    package_versions = re.findall(r'([@\w/-]+)@([\d.^~><]+)', content)
    versions.extend(package_versions)

    # Version in text (e.g., "v1.2.3", "version 2.0")
    text_versions = re.findall(r'v?(\d+\.\d+(?:\.\d+)?)', content)
    for ver in text_versions:
        versions.append(("generic", ver))

    return versions


def extract_contracts(content: str) -> List[str]:
    """Extract contract names from Solidity code"""
    contracts = re.findall(r'contract\s+(\w+)', content)
    return contracts


def extract_functions(content: str) -> List[str]:
    """Extract function names"""
    functions = []

    # Solidity functions
    sol_functions = re.findall(r'function\s+(\w+)\s*\(', content)
    functions.extend([f"sol:{fn}" for fn in sol_functions])

    # JavaScript/Python functions
    js_functions = re.findall(r'(?:function\s+(\w+)|const\s+(\w+)\s*=\s*async|def\s+(\w+))', content)
    for match in js_functions:
        fn = match[0] or match[1] or match[2]
        if fn:
            functions.append(f"fn:{fn}")

    return list(set(functions))


def detect_installation_step(content: str) -> bool:
    """Detect if chunk contains installation instructions"""
    install_keywords = ["install", "npm", "yarn", "pip", "forge install", "brew", "apt-get"]
    content_lower = content.lower()
    return any(kw in content_lower for kw in install_keywords)


def detect_deployment_step(content: str) -> bool:
    """Detect if chunk contains deployment instructions"""
    deploy_keywords = ["deploy", "deployment", "npx hardhat run", "forge create", "remix"]
    content_lower = content.lower()
    return any(kw in content_lower for kw in deploy_keywords)


def detect_configuration_step(content: str) -> bool:
    """Detect if chunk contains configuration"""
    config_keywords = ["config", "configure", "setup", ".env", "hardhat.config", "foundry.toml"]
    content_lower = content.lower()
    return any(kw in content_lower for kw in config_keywords)


def detect_testing_step(content: str) -> bool:
    """Detect if chunk contains testing information"""
    test_keywords = ["test", "testing", "spec", "describe", "it(", "assert", "expect"]
    content_lower = content.lower()
    return any(kw in content_lower for kw in test_keywords)

def create_metta_facts(chunks: List[Dict[str, Any]]) -> List[str]:
    """
    Convert documentation chunks into MeTTa facts for reasoning
    """
    facts = []

    for idx, chunk in enumerate(chunks):
        content = chunk.get("content", "")
        chunk_id = f"chunk-{idx}"

        # Extract entities
        imports = extract_imports(content)
        versions = extract_versions(content)
        contracts = extract_contracts(content)
        functions = extract_functions(content)

        # Create facts for each entity
        for imp in imports:
            clean_imp = imp.replace('"', "'").replace('\n', ' ')[:50]
            facts.append(f"(requires {chunk_id} \"{clean_imp}\")")

        for lib, ver in versions:
            facts.append(f"(uses-version {chunk_id} {lib} {ver})")

        for contract in contracts:
            facts.append(f"(defines-contract {chunk_id} {contract})")

        for fn in functions:
            facts.append(f"(defines-function {chunk_id} {fn})")

        # Detect step types
        if detect_installation_step(content):
            facts.append(f"(installation-step {chunk_id})")

        if detect_deployment_step(content):
            facts.append(f"(deployment-step {chunk_id})")

        if detect_configuration_step(content):
            facts.append(f"(configuration-step {chunk_id})")

        if detect_testing_step(content):
            facts.append(f"(testing-step {chunk_id})")

    return facts


def create_reasoning_rules() -> str:
    """
    Define MeTTa reasoning rules for dependency and order inference
    """
    return """
; Rule: Installation must come before deployment
(= (before $a $b)
   (if (and (installation-step $a) (deployment-step $b))
       (ordered $a $b)))

; Rule: Configuration usually comes after installation
(= (before $a $b)
   (if (and (installation-step $a) (configuration-step $b))
       (ordered $a $b)))

; Rule: Testing comes after deployment
(= (before $a $b)
   (if (and (deployment-step $a) (testing-step $b))
       (ordered $a $b)))

; Rule: Detect version conflicts
(= (conflict $a $b $lib)
   (if (and (uses-version $a $lib $v1)
            (uses-version $b $lib $v2)
            (not (= $v1 $v2)))
       (version-conflict $lib $v1 $v2)))

; Rule: Dependency inference
(= (depends-on $a $dep)
   (if (requires $a $dep)
       (dependency $a $dep)))

; Rule: Prerequisites are required dependencies
(= (prerequisite $dep)
   (if (requires $chunk $dep)
       (needed $dep)))
"""


def execute_metta_reasoning(facts: List[str], rules: str) -> List[str]:
    """
    Execute MeTTa reasoning and return results
    """
    if not METTA_AVAILABLE or not metta:
        return ["MeTTa not available"]

    try:
        # Combine facts and rules
        program = rules + "\n" + "\n".join(facts)

        # Execute reasoning
        results = metta.run(program)

        # Convert results to strings
        return [str(r) for r in results]

    except Exception as e:
        return [f"Error in MeTTa execution: {str(e)}"]


def parse_reasoning_results(results: List[str]) -> Dict[str, List[str]]:
    """
    Parse MeTTa reasoning results into structured categories
    """
    parsed = {
        "dependencies": [],
        "execution_order": [],
        "conflicts": [],
        "prerequisites": []
    }

    for result in results:
        result_lower = result.lower()

        # Parse dependencies
        if "dependency" in result_lower or "requires" in result_lower:
            parsed["dependencies"].append(result)

        # Parse execution order
        if "ordered" in result_lower or "before" in result_lower:
            parsed["execution_order"].append(result)

        # Parse conflicts
        if "conflict" in result_lower or "version-conflict" in result_lower:
            parsed["conflicts"].append(result)

        # Parse prerequisites
        if "needed" in result_lower or "prerequisite" in result_lower:
            parsed["prerequisites"].append(result)

    return parsed


def create_execution_order_steps(parsed: Dict[str, List[str]], chunks: List[Dict[str, Any]]) -> List[str]:
    """
    Create human-readable execution order steps
    """
    steps = []

    # Determine typical order based on detected steps
    step_order = {
        "installation": 1,
        "configuration": 2,
        "deployment": 3,
        "testing": 4
    }

    detected_steps = []
    for idx, chunk in enumerate(chunks):
        content = chunk.get("content", "")
        if detect_installation_step(content):
            detected_steps.append((1, f"Install dependencies (see documentation section {idx+1})"))
        if detect_configuration_step(content):
            detected_steps.append((2, f"Configure project settings (see documentation section {idx+1})"))
        if detect_deployment_step(content):
            detected_steps.append((3, f"Deploy contracts (see documentation section {idx+1})"))
        if detect_testing_step(content):
            detected_steps.append((4, f"Run tests (see documentation section {idx+1})"))

    # Sort by order
    detected_steps.sort(key=lambda x: x[0])

    # Remove duplicates while preserving order
    seen = set()
    for _, step in detected_steps:
        step_key = step.split("(")[0].strip()
        if step_key not in seen:
            steps.append(step)
            seen.add(step_key)

    return steps if steps else ["Follow the documentation steps in order"]

@protocol.on_message(MeTTaReasoningRequest)
async def handle_reasoning_request(ctx: Context, sender: str, msg: MeTTaReasoningRequest):
    """Handle MeTTa reasoning request"""
    start_time = datetime.now()

    ctx.logger.info(f"🧠 MeTTa reasoning request from {sender}")
    ctx.logger.info(f"  Query: '{msg.query}'")
    ctx.logger.info(f"  Chunks to analyze: {len(msg.chunks)}")

    try:
        if not METTA_AVAILABLE:
            ctx.logger.error("❌ MeTTa (hyperon) not available")
            await ctx.send(
                msg.user_address,
                ErrorResponse(
                    error="MeTTa library (hyperon) not available",
                    agent_name=AGENT_NAME,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    details="This agent requires the hyperon library to be installed locally"
                )
            )
            return

        # Create MeTTa facts from chunks
        facts = create_metta_facts(msg.chunks)
        ctx.logger.info(f"📝 Created {len(facts)} symbolic facts")

        # Get reasoning rules
        rules = create_reasoning_rules()

        # Execute MeTTa reasoning
        results = execute_metta_reasoning(facts, rules)
        ctx.logger.info(f"🔍 MeTTa generated {len(results)} inferences")

        # Parse results
        parsed = parse_reasoning_results(results)

        # Create execution order steps
        execution_steps = create_execution_order_steps(parsed, msg.chunks)

        # Extract unique dependencies and prerequisites
        dependencies = list(set(parsed["dependencies"]))[:10]  # Top 10
        prerequisites = list(set(parsed["prerequisites"]))[:10]  # Top 10
        conflicts = list(set(parsed["conflicts"]))

        # Calculate confidence based on number of facts and inferences
        confidence = min(1.0, len(facts) / 20.0) if facts else 0.5

        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000

        ctx.logger.info(f"✅ Reasoning completed in {elapsed_ms:.2f}ms")
        ctx.logger.info(f"  Dependencies: {len(dependencies)}")
        ctx.logger.info(f"  Execution steps: {len(execution_steps)}")
        ctx.logger.info(f"  Conflicts: {len(conflicts)}")
        ctx.logger.info(f"  Confidence: {confidence:.2f}")

        # Send response
        await ctx.send(
            msg.user_address,
            MeTTaReasoningResponse(
                dependencies=dependencies,
                execution_order=execution_steps,
                conflicts=conflicts,
                prerequisites=prerequisites,
                symbolic_facts=results[:20],  # Send top 20 facts for debugging
                confidence=confidence,
                reasoning_time_ms=elapsed_ms
            )
        )

    except Exception as e:
        ctx.logger.error(f"❌ Error in MeTTa reasoning: {e}")
        import traceback
        traceback.print_exc()
        await ctx.send(
            msg.user_address,
            ErrorResponse(
                error=str(e),
                agent_name=AGENT_NAME,
                timestamp=datetime.now(timezone.utc).isoformat(),
                details="MeTTa reasoning failed"
            )
        )


# ==================== STARTUP ====================

@agent.on_event("startup")
async def on_startup(ctx: Context):
    ctx.logger.info(f"🤖 {AGENT_NAME} started!")
    ctx.logger.info(f"📍 Agent address: {agent.address}")
    ctx.logger.info(f"🌐 Listening on port {AGENT_PORT}")

    if METTA_AVAILABLE:
        ctx.logger.info("✅ MeTTa (hyperon) library loaded successfully")
        ctx.logger.info("🧠 Symbolic reasoning engine ready")
    else:
        ctx.logger.error("❌ MeTTa (hyperon) library NOT available")
        ctx.logger.error("   Install with: pip install hyperon")

    ctx.logger.info(f"🎯 Ready to perform symbolic reasoning")


# Register protocol
agent.include(protocol, publish_manifest=True)


if __name__ == "__main__":
    agent.run()
