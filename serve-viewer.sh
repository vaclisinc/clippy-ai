#!/bin/bash

echo "🌐 Starting ChromaDB Viewer on http://localhost:3030"
echo ""
echo "Open this URL in your browser: http://localhost:3030"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Use Python to serve the HTML file
python3 -m http.server 3030
