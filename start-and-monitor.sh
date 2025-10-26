#!/bin/bash

LOG_FILE="clippy-startup.log"

echo "🚀 Starting Clippy AI with ChromaDB monitoring..."
echo ""
echo "📝 Logs will be saved to: $LOG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check ChromaDB
if docker ps | grep -q clippy-chromadb; then
    echo "✅ ChromaDB container is running"
else
    echo "⚠️  ChromaDB not running, starting it..."
    docker start clippy-chromadb || docker run -d -p 8000:8000 \
      -e CHROMA_SERVER_CORS_ALLOW_ORIGINS='["*"]' \
      --name clippy-chromadb \
      chromadb/chroma:latest
    sleep 3
fi

echo ""
echo "🔨 Building project..."
npm run build

echo ""
echo "🎯 Starting Clippy AI..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Watch for these key messages:"
echo "  • [Clippy AI] ✅ VectorDB initialized successfully"
echo "  • [VectorDB] Using existing collection: screenshot-embeddings"
echo "  • [Storage] ✅ Saved to SQLite + VectorDB"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start app and save all logs
npm start 2>&1 | tee "$LOG_FILE"
