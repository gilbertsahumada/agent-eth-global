#!/bin/bash
set -e

echo "📦 Installing system dependencies..."
# Render usa Ubuntu, así que instalamos dependencias necesarias para hyperon
apt-get update || true
apt-get install -y build-essential cmake git || true

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip setuptools wheel

echo "📚 Installing project requirements..."
pip install -r requirements_metta.txt

echo "✅ Build completed successfully!"
