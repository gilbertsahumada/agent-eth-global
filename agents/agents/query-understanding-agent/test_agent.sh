#!/bin/bash

# Test script for Query Understanding Agent
# Make sure the agent is running first: python agent.py

echo "🧪 Testing Query Understanding Agent on http://localhost:8001/understand"
echo ""

curl -X POST http://localhost:8001/understand \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I deploy a VRF contract using Hardhat and verify it on Etherscan?",
    "available_projects": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Chainlink Documentation",
        "domain": "Oracles",
        "tech_stack": ["Chainlink", "Solidity", "Hardhat", "Ethers.js"],
        "keywords": ["VRF", "oracle", "smart contracts", "randomness"]
      },
      {
        "id": "223e4567-e89b-12d3-a456-426614174001",
        "name": "Polygon Developer Docs",
        "domain": "Infrastructure",
        "tech_stack": ["Polygon", "Solidity", "Web3.js"],
        "keywords": ["layer2", "scaling", "deployment"]
      }
    ]
  }' | python3 -m json.tool

echo ""
echo "✅ Test complete!"
