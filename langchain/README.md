# LangChain

> LangChain 是构建 LLM 驱动应用的最主流开源框架，提供 **链式调用 + RAG + Agent + 记忆 + 多模型统一接口**，以代码优先的方式让开发者灵活组装 AI 应用。

本文档深度解析 LangChain 生态（含 LangGraph、LangSmith），涵盖核心抽象、架构设计、主要模块、实战用法与企业落地建议，并与 Dify、LlamaIndex 等工具做横向对比。

---

## 目录

- [1. 产品定位](#1-产品定位)
- [2. 生态全景](#2-生态全景)
- [3. 核心抽象（Python SDK）](#3-核心抽象python-sdk)
- [4. LCEL：链式表达式语言](#4-lcel链式表达式语言)
- [5. RAG 管线](#5-rag-管线)
- [6. Agent 与工具](#6-agent-与工具)
- [7. 记忆（Memory）](#7-记忆memory)
- [8. LangGraph：有状态工作流](#8-langgraph有状态工作流)
- [9. LangSmith：LLMOps 平台](#9-langsmith-llmops-平台)
- [10. 模型支持](#10-模型支持)
- [11. 向量数据库集成](#11-向量数据库集成)
- [12. 部署与生产化](#12-部署与生产化)
- [13. 与同类工具对比](#13-与同类工具对比)
- [14. 企业落地建议](#14-企业落地建议)
- [15. 学习路线](#15-学习路线)
- [16. 资源与参考](#16-资源与参考)

---

## 1) 产品定位

| 维度 | 说明 |
| --- | --- |
| **开源协议** | MIT |
| **语言** | Python（主力）/ TypeScript（JS 生态） |
| **目标用户** | 有编程能力的 AI 开发者，需要灵活定制 LLM 应用逻辑 |
| **核心理念** | "Composable"——把 LLM 调用、检索、工具、记忆等原子组件用统一接口组合 |
| **GitHub Stars** | 95k+（Python）+ 13k+（JS） |
| **版本** | `langchain-core`（稳定基础）+ `langchain`（社区组件）+ `langchain-community` |

### 什么时候用 LangChain
- ✅ 需要高度定制化的推理链或 Agent 逻辑
- ✅ 需要快速实验：换模型、换检索策略、换记忆后端
- ✅ 需要与 LangSmith 深度集成做 trace 与评估
- ✅ 团队有 Python 开发能力
- ⚠️ 不适合：非技术人员自助搭建（此时选 Dify / Flowise）

---

## 2) 生态全景

```
LangChain 生态
├── langchain-core        ← 最小依赖；Runnable 接口、基础抽象
├── langchain             ← 标准组件；Chains、Agents、Memory
├── langchain-community   ← 第三方集成（向量库、模型、工具）
├── langchain-openai      ← OpenAI / Azure 专用包
├── langchain-anthropic   ← Anthropic Claude 专用包
├── langchain-google-*    ← Google Vertex / Gemini 专用包
│
├── LangGraph             ← 有状态多 Agent 工作流（DAG + 循环）
├── LangSmith             ← LLMOps：trace / 评估 / 数据集 / 监控
└── LangServe             ← 一键将 Chain 发布为 REST API（FastAPI）
```

---

## 3) 核心抽象（Python SDK）

### 3.1 Runnable 协议
LangChain 所有组件均实现 `Runnable` 接口，统一暴露：
```python
runnable.invoke(input)          # 同步
runnable.ainvoke(input)         # 异步
runnable.stream(input)          # 流式（生成器）
runnable.batch(inputs)          # 批量
```

### 3.2 主要组件类型

| 抽象 | 说明 | 示例 |
| --- | --- | --- |
| `ChatModel` | 聊天模型接口 | `ChatOpenAI`、`ChatAnthropic` |
| `LLM` | 文本补全模型 | `OpenAI`、`HuggingFaceHub` |
| `PromptTemplate` | 动态 Prompt 构建 | `ChatPromptTemplate.from_messages()` |
| `OutputParser` | 解析模型输出 | `StrOutputParser`、`JsonOutputParser`、`PydanticOutputParser` |
| `Retriever` | 文档检索接口 | `VectorStoreRetriever`、`BM25Retriever` |
| `Tool` | Agent 可调用工具 | `@tool` 装饰器 / `StructuredTool` |
| `Memory` | 对话记忆 | `ConversationBufferMemory`、`ConversationSummaryMemory` |
| `DocumentLoader` | 文档加载 | `PyPDFLoader`、`WebBaseLoader`、`NotionLoader` |
| `TextSplitter` | 文本分块 | `RecursiveCharacterTextSplitter` |
| `Embeddings` | 向量化 | `OpenAIEmbeddings`、`HuggingFaceEmbeddings` |
| `VectorStore` | 向量库 | `Chroma`、`FAISS`、`Pinecone`、`Weaviate` |

---

## 4) LCEL：链式表达式语言

LCEL（LangChain Expression Language）用 `|` 管道符组合 Runnable，是 LangChain v0.1+ 的推荐写法：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

model = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业助手，用中文回答。"),
    ("human", "{question}"),
])

chain = prompt | model | StrOutputParser()

# 调用
result = chain.invoke({"question": "什么是 RAG？"})

# 流式
for chunk in chain.stream({"question": "什么是 RAG？"}):
    print(chunk, end="", flush=True)
```

### LCEL 高级特性
```python
# 并行执行
from langchain_core.runnables import RunnableParallel

parallel = RunnableParallel(
    summary=summarize_chain,
    keywords=keyword_chain,
)
parallel.invoke({"text": "..."})

# 条件路由
from langchain_core.runnables import RunnableBranch

router = RunnableBranch(
    (lambda x: x["intent"] == "qa", qa_chain),
    (lambda x: x["intent"] == "extract", extract_chain),
    default_chain,
)

# 自定义 Lambda
from langchain_core.runnables import RunnableLambda

add_metadata = RunnableLambda(lambda x: {**x, "ts": time.time()})
```

---

## 5) RAG 管线

### 索引阶段
```python
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 加载文档
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# 分块
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)

# 向量化并存储
vectorstore = Chroma.from_documents(chunks, OpenAIEmbeddings())
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
```

### 检索 + 生成阶段
```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

prompt = ChatPromptTemplate.from_template("""
基于以下上下文回答问题：
{context}

问题：{question}
""")

def format_docs(docs):
    return "\n\n".join(d.page_content for d in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | ChatOpenAI(model="gpt-4o")
    | StrOutputParser()
)

rag_chain.invoke("公司的退款政策是什么？")
```

### 高级 RAG 技术
- **多查询检索（Multi-Query）**：自动生成多个子问题提升召回率
- **RAG Fusion**：多检索结果用 RRF（倒数排名融合）合并
- **父子块（Parent-Child）**：小块检索、大块注入
- **Self-RAG**：模型自判断是否需要检索
- **CRAG（Corrective RAG）**：检索质量不足时自动网络搜索补充

---

## 6) Agent 与工具

### 定义工具
```python
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """获取指定城市的当前天气。"""
    # 实际调用天气 API
    return f"{city} 当前晴天，25°C"

@tool
def calculate(expression: str) -> float:
    """计算数学表达式。"""
    return eval(expression)  # 生产中用安全沙箱
```

### 创建 Agent
```python
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个有用的助手，可以使用工具回答问题。"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(
    llm=ChatOpenAI(model="gpt-4o"),
    tools=[get_weather, calculate],
    prompt=prompt,
)

executor = AgentExecutor(agent=agent, tools=[get_weather, calculate], verbose=True)
executor.invoke({"input": "北京今天天气怎么样？然后帮我算 (137 * 42) / 3"})
```

### 内置工具（部分）
```python
from langchain_community.tools import (
    DuckDuckGoSearchRun,    # 网络搜索
    WikipediaQueryRun,      # Wikipedia
    ArxivQueryRun,          # 学术论文
    PythonREPLTool,         # Python 执行
    ShellTool,              # Shell 命令
    SQLDatabaseTool,        # SQL 查询
)
```

---

## 7) 记忆（Memory）

```python
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain

memory = ConversationBufferWindowMemory(k=10)  # 保留最近 10 轮

conversation = ConversationChain(
    llm=ChatOpenAI(model="gpt-4o"),
    memory=memory,
)

conversation.predict(input="我叫张三")
conversation.predict(input="我叫什么名字？")  # → "你叫张三"
```

### 记忆类型
| 类型 | 说明 |
| --- | --- |
| `ConversationBufferMemory` | 保留全部历史（小对话） |
| `ConversationBufferWindowMemory` | 保留最近 N 轮 |
| `ConversationSummaryMemory` | 用 LLM 压缩历史 |
| `ConversationSummaryBufferMemory` | 近期详细 + 早期摘要 |
| `VectorStoreRetrieverMemory` | 向量检索相关历史（长对话） |

---

## 8) LangGraph：有状态工作流

LangGraph 是 LangChain 生态中用于构建**有状态、多步骤、可循环** Agent 工作流的框架，是 LangChain Agent 的下一代替代。

### 核心概念
- **State**：类型化的工作流状态（TypedDict）
- **Node**：处理函数（接收 State，返回 State 更新）
- **Edge**：节点间的连接（普通边 / 条件边）
- **Graph**：DAG 或含循环的有向图

### 示例：ReAct Agent
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

def call_model(state: AgentState):
    response = model.invoke(state["messages"])
    return {"messages": [response]}

def call_tool(state: AgentState):
    tool_calls = state["messages"][-1].tool_calls
    results = [tool_executor.invoke(tc) for tc in tool_calls]
    return {"messages": results}

def should_continue(state: AgentState):
    if state["messages"][-1].tool_calls:
        return "tool"
    return END

graph = StateGraph(AgentState)
graph.add_node("agent", call_model)
graph.add_node("tool", call_tool)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tool", "agent")

app = graph.compile()
```

### LangGraph 适用场景
- 多 Agent 协作（规划 Agent + 执行 Agent + 评审 Agent）
- 需要循环 / 自我修正的工作流
- 人机协作（Human-in-the-loop）
- 复杂的条件分支与状态持久化

---

## 9) LangSmith：LLMOps 平台

LangSmith 是 LangChain 的配套可观测性平台（云端 SaaS，有免费层）。

### 接入（3 行代码）
```bash
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=ls__...
export LANGCHAIN_PROJECT=my-project
```

### 核心功能
| 功能 | 说明 |
| --- | --- |
| **Trace** | 完整记录每次调用的输入输出、耗时、token 用量、每步子调用 |
| **Playground** | 在 UI 中重放并修改任意 trace，对比不同 prompt / 模型的输出 |
| **Datasets** | 从 trace 中标注正确答案，构建评估数据集 |
| **Evaluations** | 自动化评估（LLM-as-judge / 自定义指标），PR 合并前跑回归 |
| **监控** | 生产环境错误率、延迟、token 用量仪表板 |
| **Annotation Queue** | 人工标注工作流，众包或团队内标注 |

---

## 10) 模型支持

LangChain 通过专用包支持几乎所有主流 LLM：

```python
# OpenAI
from langchain_openai import ChatOpenAI
model = ChatOpenAI(model="gpt-4o", temperature=0)

# Anthropic Claude
from langchain_anthropic import ChatAnthropic
model = ChatAnthropic(model="claude-3-5-sonnet-20241022")

# Google Gemini
from langchain_google_genai import ChatGoogleGenerativeAI
model = ChatGoogleGenerativeAI(model="gemini-1.5-pro")

# 本地模型（Ollama）
from langchain_community.llms import Ollama
model = Ollama(model="llama3")

# HuggingFace
from langchain_huggingface import HuggingFaceEndpoint
model = HuggingFaceEndpoint(repo_id="mistralai/Mistral-7B-Instruct-v0.2")

# Azure OpenAI
from langchain_openai import AzureChatOpenAI
model = AzureChatOpenAI(azure_deployment="gpt-4o", api_version="2024-08-01-preview")
```

---

## 11) 向量数据库集成

```python
# FAISS（本地，无需服务）
from langchain_community.vectorstores import FAISS
vs = FAISS.from_documents(docs, embeddings)

# Chroma（本地，轻量持久化）
from langchain_chroma import Chroma
vs = Chroma.from_documents(docs, embeddings, persist_directory="./chroma_db")

# Pinecone（云端）
from langchain_pinecone import PineconeVectorStore
vs = PineconeVectorStore.from_documents(docs, embeddings, index_name="my-index")

# Weaviate
from langchain_weaviate import WeaviateVectorStore

# Milvus
from langchain_milvus import Milvus

# pgvector（PostgreSQL 扩展）
from langchain_postgres import PGVector
```

---

## 12) 部署与生产化

### LangServe（推荐）
```python
# server.py
from fastapi import FastAPI
from langserve import add_routes

app = FastAPI()
add_routes(app, rag_chain, path="/rag")

# uvicorn server:app --host 0.0.0.0 --port 8000
# 自动生成 /rag/invoke、/rag/stream、/rag/batch 端点
# 自动生成 Swagger 文档和 Playground
```

### Docker 部署
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 生产注意事项
- 使用 `async`（`ainvoke` / `astream`）避免阻塞
- 配置重试与超时（`with_retry(stop_after_attempt=3)`）
- 回退策略（`model.with_fallbacks([backup_model])`）
- 速率限制（使用 LangSmith 或自建计数器）
- 缓存（`set_llm_cache(SQLiteCache())` 或 Redis 缓存）

---

## 13) 与同类工具对比

详细横向对比见 [../ai-tools-comparison/README.md](../ai-tools-comparison/README.md)。

| 维度 | LangChain | Dify | LlamaIndex | AutoGen |
| --- | --- | --- | --- | --- |
| 编程风格 | 代码（Python/TS） | 可视化低代码 | 代码（Python） | 代码（Python） |
| RAG | ✅ 完整 | ✅ 内置 UI | ✅ 专长 | ⚠️ 基础 |
| Agent | ✅ + LangGraph | ✅ ReAct/FC | ✅ 基础 | ✅ 多 Agent |
| 工作流 | ✅ LangGraph | ✅ 拖拽 | ⚠️ 有限 | ✅ 对话流 |
| 可观测性 | ✅ LangSmith | ✅ 内置 | ⚠️ 需外接 | ⚠️ 需外接 |
| 定制灵活度 | ✅ 最高 | ⚠️ 受限 | ✅ 高 | ✅ 高 |
| 生态规模 | ✅ 最大 | ⚠️ 中 | ✅ 大 | ⚠️ 中 |
| 生产稳定性 | ⚠️ API 变化较多 | ✅ 稳定 | ✅ 较稳定 | ✅ 较稳定 |

---

## 14) 企业落地建议

### 技术选型原则
- 业务方需要**自助配置**工作流 → 选 **Dify**（+LangChain 做底层工具节点）
- 开发团队需要**高度定制**推理逻辑 → 选 **LangChain + LangGraph**
- 核心需求是**知识库检索**（RAG） → 可先评估 **LlamaIndex**
- 需要**多 Agent 协作**（如规划+执行+评审） → **LangGraph** 或 **AutoGen**

### 常见生产陷阱
1. **版本不稳定**：LangChain 迭代快，锁定 `requirements.txt` 版本
2. **token 成本超支**：在 LangSmith 设置 token 用量告警
3. **Agent 死循环**：设置 `max_iterations` 上限
4. **内存泄漏**：异步流式未正确关闭时注意清理
5. **Prompt 注入**：用户输入需做内容过滤后再拼入 prompt

### 与 ModelBridge 协同
- LangChain 作为**编排层**，通过 `BaseChatModel` 自定义类对接 ModelBridge 的 `/v1/infer`
- ModelBridge 提供**推理与微调能力**，LangChain 提供**上层应用逻辑**
- LangSmith trace 可对齐 ModelBridge 的请求日志，实现端到端可观测

---

## 15) 学习路线

```
入门（1–2 周）
  → 官方 LangChain 文档 + Cookbook
  → 实现：简单 RAG QA Bot（PDF + ChromaDB + OpenAI）

进阶（2–4 周）
  → LCEL 深入 + LangGraph 基础
  → 实现：带工具调用的 ReAct Agent + LangSmith trace

高级（1–2 月）
  → LangGraph 多 Agent 架构 + 状态持久化
  → 实现：生产级 RAG（Multi-Query + Rerank + 评估）
  → LangSmith 评估数据集 + 自动化回归
```

---

## 16) 资源与参考

- 官网：https://www.langchain.com
- Python GitHub：https://github.com/langchain-ai/langchain（⭐ 95k+）
- JS GitHub：https://github.com/langchain-ai/langchainjs
- 文档：https://python.langchain.com/docs/
- LangGraph 文档：https://langchain-ai.github.io/langgraph/
- LangSmith：https://smith.langchain.com
- LangChain Cookbook：https://github.com/langchain-ai/langchain/tree/master/cookbook
- 中文社区：https://www.langchain.com.cn
