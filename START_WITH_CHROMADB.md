# 🚀 启动Clippy AI with ChromaDB

## ✅ ChromaDB已配置完成！

**状态**:
- ✅ ChromaDB服务器运行中 (Docker container: `clippy-chromadb`)
- ✅ 端口: `http://localhost:8000`
- ✅ VectorDB代码已集成
- ✅ 历史查询API已添加

## 📋 快速启动步骤

### 1. 确保ChromaDB服务器运行
```bash
# 检查状态
docker ps | grep chromadb

# 如果没运行，启动它
docker start clippy-chromadb

# 或者重新创建
docker run -d -p 8000:8000 --name clippy-chromadb chromadb/chroma:latest
```

### 2. 启动Clippy AI
```bash
# 开发模式
npm run dev

# 或生产模式
npm run build
npm start
```

### 3. 查看日志确认
启动后看到这些日志表示成功：
```
[Clippy AI] ✅ VectorDB initialized successfully
[Storage] ✅ Saved to SQLite + VectorDB: "User is writing..."
```

## 🎬 Demo功能：查看截图历史

### 方法1: 通过开发者控制台
1. 打开Settings窗口
2. 按 `Cmd+Option+I` (Mac) 或 `Ctrl+Shift+I` (Windows)
3. 在Console中运行：

```javascript
// 获取最近50个截图历史
window.electronAPI.getScreenshotHistory(50).then(console.log)

// 语义搜索
window.electronAPI.searchScreenshots("error message", 10).then(console.log)

// 获取最近10个
window.electronAPI.getScreenshotHistory(10).then(screenshots => {
  screenshots.forEach(s => {
    console.log(`[${new Date(s.timestamp).toLocaleTimeString()}] ${s.classification}: ${s.description}`)
  })
})
```

### 方法2: 直接查询数据库
```bash
# 进入userData目录
cd ~/Library/Application\ Support/clippy-ai  # macOS
# 或 %APPDATA%/clippy-ai  # Windows

# 查看SQLite数据库
sqlite3 clippy.db

# 查询截图历史
SELECT
  datetime(timestamp/1000, 'unixepoch', 'localtime') as time,
  classification,
  description,
  current_app
FROM screenshots
ORDER BY timestamp DESC
LIMIT 20;
```

### 方法3: 查询ChromaDB
```javascript
// 在Node.js环境或控制台
const { ChromaClient } = require('chromadb');

const client = new ChromaClient();
const collection = await client.getCollection({name: 'screenshot-embeddings'});

// 语义搜索示例
const results = await collection.query({
  queryTexts: ["error message"],
  nResults: 5
});

console.log('Found screenshots:', results.metadatas[0]);
```

## 🎯 Demo演示脚本

### 演示1: 实时截图分类
```
1. 打开Google Docs并开始写作
   → Clippy检测: classification: "writing"
   → Agent: WritingCoachAgent
   → 描述: "User is writing a document in Google Docs"

2. 打开浏览器搜索资料
   → Clippy检测: classification: "research"
   → Agent: ResearchAgent
   → 描述: "User is browsing Wikipedia about AI"
   → Bright Data: 获取相关资源

3. 打开VSCode写代码出现错误
   → Clippy检测: classification: "error"
   → Agent: DebugAgent
   → 描述: "User encountered a TypeError in VSCode"
```

### 演示2: 查看行为时间线
```javascript
// 在控制台执行
window.electronAPI.getScreenshotHistory(50).then(screenshots => {
  const timeline = screenshots.map(s => ({
    time: new Date(s.timestamp).toLocaleTimeString(),
    activity: s.classification,
    what: s.description.substring(0, 50) + '...',
    app: s.currentApp || 'unknown'
  }));
  console.table(timeline);
});
```

**输出示例**：
```
┌─────┬──────────┬───────────┬──────────────────────────┬────────────┐
│ idx │   time   │ activity  │          what            │    app     │
├─────┼──────────┼───────────┼──────────────────────────┼────────────┤
│  0  │ 14:23:15 │  writing  │ User is composing email  │   Gmail    │
│  1  │ 14:20:45 │ research  │ User is reading article  │  Chrome    │
│  2  │ 14:18:30 │   error   │ TypeError in console     │  VSCode    │
└─────┴──────────┴───────────┴──────────────────────────┴────────────┘
```

### 演示3: 语义搜索
```javascript
// 找到所有关于"错误"的截图
window.electronAPI.searchScreenshots("error message", 10).then(results => {
  console.log('Found errors:', results);
  results.forEach(r => {
    console.log(`- ${r.metadata.description} (similarity: ${r.similarity.toFixed(2)})`);
  });
});
```

## 📊 数据存储架构

```
每个截图经过以下流程：

1. 截图捕获
   ↓
2. AI生成描述 (GPT-4o/Claude)
   ↓
3. 双重存储:
   ├─ SQLite: 元数据 + 描述文本 (快速查询)
   └─ ChromaDB: 向量embedding (语义搜索)
```

**实际数据示例**：
```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  filePath: "/Users/.../screenshots/batch-12-latest.png",
  timestamp: 1704067200000,
  classification: "writing",
  description: "User is writing a document about machine learning in Google Docs",
  currentApp: "Google Chrome",
  width: 1920,
  height: 1080
}
```

## 🏆 黑客松演示要点

### 卖点1: 完整的上下文记忆
> "Clippy不只是截图，而是**理解**你在做什么。每个截图都有AI生成的描述，存储在向量数据库中，支持语义搜索。"

### 卖点2: 时间线可视化
> "回顾你的工作历史：什么时候写文档、什么时候研究、什么时候遇到错误。完整的行为时间线。"

### 卖点3: 智能搜索
> "不是关键词匹配，是语义理解。搜'我昨天遇到的那个API错误'，ChromaDB会找到相关截图。"

### Demo顺序建议：
1. **先运行一段时间** - 让系统捕获一些截图
2. **展示不同场景** - 写作→研究→编码→错误
3. **打开控制台** - 展示历史查询
4. **演示语义搜索** - 用自然语言查找
5. **解释架构** - SQLite + ChromaDB双存储

## 🔧 故障排除

### ChromaDB连接失败
```bash
# 检查Docker容器
docker ps | grep chromadb

# 查看日志
docker logs clippy-chromadb

# 重启容器
docker restart clippy-chromadb
```

### 查看Clippy AI日志
启动应用后查看控制台，应该看到：
```
[Clippy AI] ✅ VectorDB initialized successfully
[VectorDB] Using existing collection: screenshot-embeddings
```

### 测试ChromaDB连接
```bash
curl http://localhost:8000/api/v2/collections
```

应该返回JSON格式的collections列表。

## 📝 管理ChromaDB

### 停止服务器
```bash
docker stop clippy-chromadb
```

### 启动服务器
```bash
docker start clippy-chromadb
```

### 删除所有数据（重新开始）
```bash
docker stop clippy-chromadb
docker rm clippy-chromadb
docker run -d -p 8000:8000 --name clippy-chromadb chromadb/chroma:latest
```

### 数据持久化（可选）
```bash
# 如果想保存数据到本地目录
docker run -d -p 8000:8000 \
  -v ./chroma_data:/chroma/chroma \
  --name clippy-chromadb \
  chromadb/chroma:latest
```

## 🎉 总结

**现在你有**：
- ✅ 完整的ChromaDB集成
- ✅ AI生成的截图描述
- ✅ 语义向量搜索
- ✅ SQLite元数据存储
- ✅ 时间线查询API
- ✅ 5个专门的AI agents

**Demo时强调**：
1. Multi-agent系统
2. 完整的上下文记忆（ChromaDB）
3. 智能行为识别
4. Bright Data web scraping
5. Workflow自动化

**这个系统不只是截图 - 是AI理解你的工作流程！** 🚀
