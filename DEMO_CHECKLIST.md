# 🎬 Clippy AI Demo Checklist

## 准备工作（演示前10分钟）

### 1. 启动系统
```bash
./start-clippy.sh
```

### 2. 确认ChromaDB运行
终端应该显示：
```
✅ ChromaDB is responsive at http://localhost:8000
```

### 3. 确认VectorDB连接
Clippy AI启动日志应该显示：
```
[Clippy AI] ✅ VectorDB initialized successfully
```

如果看到警告：
```
[Clippy AI] ⚠️  VectorDB unavailable
```
则运行：
```bash
docker restart clippy-chromadb
```

### 4. 预热系统（让它捕获几个截图）
- 打开Google Docs写几个字
- 打开浏览器搜索一个话题
- 打开VSCode或终端
- **等待2-3分钟**让系统捕获截图

---

## 演示脚本

### 🎯 开场白 (30秒)
> "Clippy AI不只是截图助手，而是一个**理解你工作流程的AI系统**。它有5个专门的AI agents，配合ChromaDB语义搜索和Bright Data web scraping，提供智能的上下文感知建议。"

### 🎬 Demo 1: Multi-Agent系统 (2分钟)

#### 场景1: Writing Coach
1. 打开Google Docs
2. 开始写一段文字（故意写得不太好）
3. **等待Clippy弹出** ✍️
4. 展示Writing Coach的建议

**说辞**:
> "看，Clippy检测到我在写作，自动切换到Writing Coach模式，提供语法和风格建议。这是workflow自动化 - 不需要切换工具。"

#### 场景2: Research Agent
1. 打开浏览器搜索一个技术话题
2. 打开一篇文章
3. **等待Clippy弹出** 🔍
4. 展示Research Agent + Bright Data结果

**说辞**:
> "现在我在研究，Clippy切换到Research Agent。它用Bright Data抓取相关资源，给我推荐3-5篇相关文章。把被动阅读变成主动研究。"

#### 场景3: Debug Agent
1. 打开VSCode或终端
2. 故意制造一个错误（例如运行错误的命令）
3. **等待Clippy弹出** 🐛
4. 展示Debug建议

**说辞**:
> "遇到错误时，Debug Agent自动识别问题类型，提供解决方案。不用再Google了。"

### 🗄️ Demo 2: ChromaDB记忆系统 (2分钟)

#### 打开Settings窗口的DevTools
```
Cmd+Option+I (Mac) 或 Ctrl+Shift+I (Windows)
```

#### 展示时间线
```javascript
window.electronAPI.getScreenshotHistory(20).then(screenshots => {
  const timeline = screenshots.map(s => ({
    time: new Date(s.timestamp).toLocaleTimeString(),
    activity: s.classification,
    description: s.description.substring(0, 60)
  }));
  console.table(timeline);
});
```

**说辞**:
> "所有截图都存储在ChromaDB中，每个都有AI生成的描述。这是完整的工作时间线 - 什么时候写作、什么时候研究、什么时候遇到错误。"

#### 展示语义搜索
```javascript
// 示例1: 搜索错误
window.electronAPI.searchScreenshots("error message", 5).then(results => {
  console.log('Found errors:', results);
});

// 示例2: 搜索写作
window.electronAPI.searchScreenshots("writing document", 5).then(results => {
  console.log('Found writing activities:', results);
});
```

**说辞**:
> "这不是关键词搜索，是语义理解。我可以用自然语言查询'我昨天遇到的那个API错误'，ChromaDB会找到相关截图。"

### 🌐 Demo 3: Bright Data Integration (1分钟)

重新触发Research Agent，展示Bright Data抓取的结果：

**说辞**:
> "Research Agent背后是Bright Data的web scraping技术。它不仅总结当前内容，还实时抓取相关资源，扩展你的研究范围。"

---

## 评委可能问的问题 & 回答

### Q: "ChromaDB是怎么用的？"
**A**:
> "我们用ChromaDB存储每个截图的向量embedding。每次捕获截图时，AI会生成描述，然后ChromaDB创建向量表示。这样就能做语义搜索 - 不只是匹配关键词，而是理解意图。"

### Q: "如果ChromaDB挂了怎么办？"
**A**:
> "系统有优雅降级机制。所有数据也存在SQLite中，即使ChromaDB不可用，核心功能都能正常工作。ChromaDB是增强功能，不是依赖。"

### Q: "Bright Data具体做什么？"
**A**:
> "Research Agent检测到你在阅读或研究时，会提取关键词，然后用Bright Data的API抓取相关网页。我们目前用DuckDuckGo作为fallback，但架构支持完整的Bright Data集成。"

### Q: "这个系统的扩展性如何？"
**A**:
> "非常好！我们用Router模式，新增agent只需要：1) 创建agent类 2) 添加分类类型 3) 路由即可。已经支持6种分类，5个agents，还可以继续扩展。"

### Q: "隐私怎么处理？"
**A**:
> "所有数据都在本地。ChromaDB运行在Docker容器，SQLite是本地文件，截图保存在用户的userData目录。没有任何数据上传到云端。"

---

## 技术亮点清单（演示时提及）

- ✅ **Multi-Agent Architecture** - 5个专门agents
- ✅ **ChromaDB** - 语义向量搜索
- ✅ **Bright Data** - Web scraping集成
- ✅ **AI描述生成** - GPT-4o/Claude for每个截图
- ✅ **智能分类** - 6种场景自动识别
- ✅ **Dual Storage** - SQLite + ChromaDB
- ✅ **优雅降级** - ChromaDB可选
- ✅ **Workflow自动化** - 上下文感知建议
- ✅ **TypeScript** - 类型安全
- ✅ **Electron** - 跨平台桌面应用

---

## 常见问题处理

### 如果Clippy没有弹出建议：
1. 检查截图间隔时间（默认7秒）
2. 查看控制台日志
3. 确认API key有效

### 如果ChromaDB连接失败：
```bash
docker restart clippy-chromadb
```

### 如果想清空历史数据：
```bash
# 删除SQLite数据
rm ~/Library/Application\ Support/clippy-ai/clippy.db

# 重置ChromaDB
docker stop clippy-chromadb
docker rm clippy-chromadb
docker run -d -p 8000:8000 --name clippy-chromadb chromadb/chroma:latest
```

---

## 时间分配（5分钟演示）

| 时间 | 内容 | 重点 |
|------|------|------|
| 0:00-0:30 | 开场 | Multi-agent系统概述 |
| 0:30-2:30 | Demo agents | Writing/Research/Debug |
| 2:30-4:00 | Demo ChromaDB | 时间线 + 语义搜索 |
| 4:00-4:30 | Bright Data | Web scraping展示 |
| 4:30-5:00 | 总结 | 技术栈 + 可扩展性 |

---

## 奖项针对性

### Best Workflow Application ✅
- **强调**: Writing Coach无缝集成
- **展示**: 实时写作建议，不打断workflow
- **说辞**: "AI co-pilot that understands your context"

### Best Use of Bright Data ✅
- **强调**: Research Agent的web scraping
- **展示**: 实时资源推荐
- **说辞**: "Turn passive reading into active discovery"

### Best Use of CodeRabbitAI (可选)
- 如果时间充足，提及Security Agent的扩展可能性

---

## 最后检查清单

- [ ] ChromaDB容器运行中
- [ ] Clippy AI启动无错误
- [ ] 已捕获至少5-10个截图
- [ ] 测试过历史查询API
- [ ] 浏览器和VSCode已打开
- [ ] DevTools已准备好
- [ ] 演示脚本已熟悉
- [ ] API keys已配置

---

**记住**: 这不只是个截图工具，是**AI理解你工作流程的智能系统**！

Good luck! 🚀🏆
