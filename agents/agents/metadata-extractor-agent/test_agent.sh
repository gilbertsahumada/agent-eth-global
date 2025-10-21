#!/bin/bash

# Test script for Metadata Extractor Agent
# Make sure the agent is running first: python agent.py

echo "🧪 Testing Metadata Extractor Agent on http://localhost:8000/analyze"
echo ""

curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "markdown_content": "# Chainlink VRF Tutorial\n\nThis guide demonstrates how to use Chainlink VRF (Verifiable Random Function) with Hardhat for your smart contracts.\n\n## Installation\n\n```bash\nnpm install --save-dev hardhat @chainlink/contracts\n```\n\n## Smart Contract Example\n\n```solidity\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.7;\n\nimport \"@chainlink/contracts/src/v0.8/VRFConsumerBase.sol\";\n\ncontract VRFConsumer is VRFConsumerBase {\n    bytes32 internal keyHash;\n    uint256 internal fee;\n    uint256 public randomResult;\n    \n    constructor() \n        VRFConsumerBase(\n            0x8C7382F9D8f56b33781fE506E897a4F1e2d17255, // VRF Coordinator\n            0x326C977E6efc84E512bB9C30f76E30c160eD06FB  // LINK Token\n        )\n    {\n        keyHash = 0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4;\n        fee = 0.0001 * 10 ** 18; // 0.0001 LINK\n    }\n    \n    function getRandomNumber() public returns (bytes32 requestId) {\n        require(LINK.balanceOf(address(this)) >= fee, \"Not enough LINK\");\n        return requestRandomness(keyHash, fee);\n    }\n    \n    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {\n        randomResult = randomness;\n    }\n}\n```\n\n## Deployment\n\nDeploy using Hardhat:\n\n```javascript\nconst { ethers } = require(\"hardhat\");\n\nasync function main() {\n  const VRFConsumer = await ethers.getContractFactory(\"VRFConsumer\");\n  const vrf = await VRFConsumer.deploy();\n  await vrf.deployed();\n  console.log(\"VRFConsumer deployed to:\", vrf.address);\n}\n\nmain();\n```\n\n## Key Features\n\n- On-chain verifiable randomness\n- Provably fair random number generation\n- Integration with Chainlink oracle network\n- Perfect for NFT minting, gaming, and lotteries",
    "file_name": "chainlink-vrf-tutorial.md"
  }' | python3 -m json.tool

echo ""
echo "✅ Test complete!"
