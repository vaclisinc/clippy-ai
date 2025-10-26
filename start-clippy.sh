#!/bin/bash

echo "🚀 Starting Clippy AI with ChromaDB..."
echo ""

# Check if ChromaDB container exists
if docker ps -a | grep -q clippy-chromadb; then
    echo "✅ ChromaDB container exists"

    # Check if it's running
    if docker ps | grep -q clippy-chromadb; then
        echo "✅ ChromaDB already running"
    else
        echo "🔄 Starting ChromaDB container..."
        docker start clippy-chromadb
        sleep 2
    fi
else
    echo "📦 Creating new ChromaDB container with CORS enabled..."
    docker run -d -p 8000:8000 \
      -e CHROMA_SERVER_CORS_ALLOW_ORIGINS='["*"]' \
      --name clippy-chromadb \
      chromadb/chroma:latest
    sleep 3
fi

# Test ChromaDB connection
echo ""
echo "🔍 Testing ChromaDB connection..."
if curl -s http://localhost:8000/api/v2/heartbeat > /dev/null 2>&1; then
    echo "✅ ChromaDB is responsive at http://localhost:8000"
else
    echo "⚠️  ChromaDB may still be starting up..."
    echo "   Waiting 3 more seconds..."
    sleep 3
fi

echo ""
echo "🔨 Building project..."
npm run build

echo ""
echo "🎯 Starting Clippy AI..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Watch for these messages:"
echo "   • [Clippy AI] ✅ VectorDB initialized successfully"
echo "   • [VectorDB] Using existing collection: screenshot-embeddings"
echo "   • [Storage] ✅ Saved to SQLite + VectorDB"
echo ""
echo "📝 After 1-2 minutes, test with:"
echo "   • ./test-chromadb.sh"
echo "   • ./serve-viewer.sh (for web UI)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Clippy AI (production build)
npm start
