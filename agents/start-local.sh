#!/bin/bash

# ETH Global Hacker Assistant - Local Development Startup Script
# This script starts both agents in separate terminal tabs/windows

set -e  # Exit on error

echo "🚀 Starting ETH Global Hacker Assistant Agents..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create .env file from .env.example:"
    echo "   cp .env.example .env"
    echo "   Then edit .env with your API keys"
    exit 1
fi

# Check if ASI1_API_KEY is set
if ! grep -q "ASI1_API_KEY=.*[^=]" .env || grep -q "ASI1_API_KEY=your-asi1-api-key-here" .env; then
    echo "⚠️  Warning: ASI1_API_KEY not configured in .env"
    echo "   Get your API key from: https://asi1.ai/dashboard/api-keys"
    echo ""
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "   Please install Python 3.9 or higher"
    exit 1
fi

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if ! python3 -c "import uagents" 2>/dev/null; then
    echo "⚠️  Dependencies not installed. Installing now..."
    pip install -r requirements.txt
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies OK"
fi

echo ""
echo "🤖 Starting agents..."
echo ""

# Detect terminal and OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use Terminal.app
    echo "📍 Detected macOS - Using Terminal.app"

    # Start MeTTa Agent in new tab
    osascript -e 'tell application "Terminal"
        do script "cd \"'"$PWD"'/agents/metta-agent\" && echo \"🧠 Starting MeTTa Reasoning Agent...\" && python3 metta-agent.py"
    end tell'

    sleep 2

    # Start Main Agent in new tab
    osascript -e 'tell application "Terminal"
        do script "cd \"'"$PWD"'/agents/main-agent\" && echo \"🤖 Starting Main Agent...\" && python3 agent.py"
    end tell'

    echo "✅ Agents started in separate Terminal tabs"
    echo ""
    echo "📊 Check the new Terminal tabs to see agent logs"

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - try gnome-terminal, then xterm
    if command -v gnome-terminal &> /dev/null; then
        echo "📍 Detected Linux - Using gnome-terminal"

        gnome-terminal --tab --title="MeTTa Agent" -- bash -c "cd agents/metta-agent && echo '🧠 Starting MeTTa Reasoning Agent...' && python3 metta-agent.py; exec bash"
        gnome-terminal --tab --title="Main Agent" -- bash -c "cd agents/main-agent && echo '🤖 Starting Main Agent...' && python3 agent.py; exec bash"

        echo "✅ Agents started in separate gnome-terminal tabs"
    elif command -v tmux &> /dev/null; then
        echo "📍 Using tmux for terminal management"

        # Create new tmux session with two panes
        tmux new-session -d -s eth-global-agents
        tmux send-keys -t eth-global-agents:0 'cd agents/metta-agent && echo "🧠 Starting MeTTa Reasoning Agent..." && python3 metta-agent.py' C-m
        tmux split-window -h -t eth-global-agents:0
        tmux send-keys -t eth-global-agents:0.1 'cd agents/main-agent && echo "🤖 Starting Main Agent..." && python3 agent.py' C-m
        tmux attach-session -t eth-global-agents

        echo "✅ Agents started in tmux session"
    else
        echo "⚠️  No suitable terminal emulator found"
        echo "   Starting agents in background processes..."

        # Fallback: start in background
        cd agents/metta-agent && python3 metta-agent.py > ../../logs/metta-agent.log 2>&1 &
        METTA_PID=$!
        cd ../..

        cd agents/main-agent && python3 agent.py > ../../logs/main-agent.log 2>&1 &
        MAIN_PID=$!
        cd ../..

        echo "✅ Agents started in background"
        echo "   MeTTa Agent PID: $METTA_PID (logs: logs/metta-agent.log)"
        echo "   Main Agent PID: $MAIN_PID (logs: logs/main-agent.log)"
        echo ""
        echo "   To stop agents: kill $METTA_PID $MAIN_PID"
    fi
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "   Please start agents manually:"
    echo "   Terminal 1: cd agents/metta-agent && python3 metta-agent.py"
    echo "   Terminal 2: cd agents/main-agent && python3 agent.py"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Agents are starting up!"
echo ""
echo "📍 Expected agent addresses:"
echo "   Main Agent: agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt"
echo "   MeTTa Agent: agent1qdxqn3qrsxhsmmxhhjaf2ad4wprgn0jajfdzhhwkq3f5g5q6655cg9nepu4"
echo ""
echo "🌐 Ports:"
echo "   MeTTa Agent: 8000"
echo "   Main Agent: 8001"
echo ""
echo "💡 Tips:"
echo "   - Check terminal tabs/windows for agent logs"
echo "   - Main agent will call MeTTa agent automatically"
echo "   - Set ENABLE_METTA_REASONING=false in .env for faster responses"
echo ""
echo "🛑 To stop agents: Close the terminal tabs or press Ctrl+C in each"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
