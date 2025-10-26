# 🚀 Quick Start Guide

## ✅ ChromaDB已修復！

你說得對 - ChromaDB之前沒有真正在用。現在已完全修復！

## 📋 修復了什麼？

1. ✅ ChromaClient現在連到Docker server (`http://localhost:8000`)
2. ✅ **所有**screenshots都儲存 (不只是assist時)
3. ✅ Router返回正確的classification
4. ✅ 每7秒自動存screenshot + AI描述 + vector embedding

## 🏃 啟動方式

### ⚠️ 重要: 不要用pipes!

```bash
# ❌ 不要這樣 (會導致EPIPE錯誤):
npm start | grep ...
npm start | head ...

# ✅ 正確方式:
./start-clippy.sh
```

### 一鍵啟動

```bash
./start-clippy.sh
```

這會:
1. 檢查並啟動ChromaDB
2. Build project
3. 啟動Clippy AI
4. **沒有pipes，不會EPIPE錯誤**

## 🔍 驗證成功

啟動後應該看到:

```
[Clippy AI] ✅ VectorDB initialized successfully  ← 這個!
[VectorDB] Using existing collection: screenshot-embeddings

[Monitor] 🎞️ Processing frame batch #1
[Router] 📋 Result: "code" (confidence: 90%)
[Storage] ✅ Saved to SQLite + VectorDB: "..."  ← 關鍵!
```

## 🧪 測試

等1-2分鐘後:

```bash
# 測試ChromaDB有資料
./test-chromadb.sh

# 應該看到:
# ✅ Collection exists
# 📊 Current screenshot count: 5+
# 📸 Sample descriptions
```

## 🌐 Web UI

```bash
./serve-viewer.sh

# 然後打開瀏覽器:
open http://localhost:3030/view-chromadb.html
```

## 📊 現在每個Screenshot:

1. ✅ 被AI描述
2. ✅ 存到SQLite (metadata)
3. ✅ 存到ChromaDB (vector)
4. ✅ 可semantic search

## 🎯 Demo Use Cases

### 1. Semantic Search
```bash
COLLECTION_ID=$(curl -s http://localhost:8000/api/v2/collections | jq -r '.[0].id')

curl -X POST "http://localhost:8000/api/v2/collections/$COLLECTION_ID/query" \
  -H "Content-Type: application/json" \
  -d '{"query_texts": ["error"], "n_results": 5}' | jq '.documents'
```

### 2. Electron DevTools
打開Settings -> Cmd+Option+I:
```javascript
await window.electronAPI.searchScreenshots("writing code", 5)
await window.electronAPI.getScreenshotHistory(10)
```

## 🐛 Troubleshooting

### EPIPE Error
```bash
# 原因: 使用了pipe (|)
# 解決: 直接運行 ./start-clippy.sh (沒有pipes)
```

### VectorDB Unavailable
```bash
# 1. 確認ChromaDB運行
docker ps | grep chromadb

# 2. 重啟
docker restart clippy-chromadb
./start-clippy.sh
```

## 📁 新增的文件

- `start-clippy.sh` - **推薦使用** (無EPIPE)
- `test-chromadb.sh` - 測試integration
- `serve-viewer.sh` - Web UI
- `SUMMARY.md` - 完整總結
- `README_CHROMADB.md` - 詳細文檔

## ✅ 準備好了！

現在ChromaDB**真正在工作**:
- ✅ 連到server
- ✅ 存所有screenshots
- ✅ Semantic search可用
- ✅ 準備demo！

Run: `./start-clippy.sh` 🚀
