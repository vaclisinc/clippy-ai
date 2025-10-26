#!/bin/bash

echo "🧪 ChromaDB Integration Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check ChromaDB server
echo "1️⃣ Checking ChromaDB server..."
if docker ps | grep -q clippy-chromadb; then
    echo "   ✅ ChromaDB container is running"
else
    echo "   ❌ ChromaDB container is NOT running"
    echo "   Run: docker start clippy-chromadb"
    exit 1
fi

# Step 2: Test ChromaDB API
echo ""
echo "2️⃣ Testing ChromaDB API..."
HEARTBEAT=$(curl -s http://localhost:8000/api/v2/heartbeat 2>&1)
if echo "$HEARTBEAT" | grep -q "heartbeat"; then
    echo "   ✅ ChromaDB API is responsive"
else
    echo "   ❌ ChromaDB API is not responding"
    echo "   Response: $HEARTBEAT"
    exit 1
fi

# Step 3: Check collection
echo ""
echo "3️⃣ Checking collection..."
COLLECTIONS=$(curl -s http://localhost:8000/api/v2/collections)
if echo "$COLLECTIONS" | grep -q "screenshot-embeddings"; then
    echo "   ✅ Collection 'screenshot-embeddings' exists"

    # Get collection ID and count
    COLLECTION_ID=$(echo "$COLLECTIONS" | jq -r '.[0].id')
    COUNT=$(curl -s "http://localhost:8000/api/v2/collections/$COLLECTION_ID/count")
    echo "   📊 Current screenshot count: $COUNT"

    if [ "$COUNT" -gt 0 ]; then
        echo ""
        echo "4️⃣ Sample screenshots..."
        curl -s -X POST "http://localhost:8000/api/v2/collections/$COLLECTION_ID/get" \
          -H "Content-Type: application/json" \
          -d '{"limit": 3, "include": ["metadatas", "documents"]}' | jq '.documents[0][] | "\n📸 \(.)"'

        echo ""
        echo "5️⃣ Testing semantic search..."
        curl -s -X POST "http://localhost:8000/api/v2/collections/$COLLECTION_ID/query" \
          -H "Content-Type: application/json" \
          -d '{
            "query_texts": ["error"],
            "n_results": 2,
            "include": ["metadatas", "documents", "distances"]
          }' | jq -r '.documents[0][] | "\n🔍 \(.)"'
    else
        echo "   ⚠️  No screenshots in database yet"
        echo "   💡 Start Clippy AI and wait 1-2 minutes for it to capture screenshots"
    fi
else
    echo "   ⚠️  Collection doesn't exist yet"
    echo "   💡 Start Clippy AI to create the collection"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ChromaDB integration test complete!"
echo ""
echo "Next steps:"
echo "  • Run: npm start"
echo "  • Wait 1-2 minutes for screenshots to be captured"
echo "  • Check logs for: [Storage] ✅ Saved to SQLite + VectorDB"
echo "  • Run this test again to see screenshots in database"
echo ""
