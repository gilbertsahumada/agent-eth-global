#!/bin/bash

# Development runner with hot reload for Metadata Extractor Agent

echo "🔥 Starting Metadata Extractor Agent with hot reload..."
echo "📁 Watching for changes in: $(pwd)"
echo ""

# Install watchdog if not present
pip3 install watchdog > /dev/null 2>&1

# Run with auto-reload
watchmedo auto-restart --patterns="*.py" --recursive --directory="." -- python3 agent.py
