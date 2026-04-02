# ink-ui — React + Ink TUI Demo

借鉴 **claude-code** 的核心技术栈，用 **React + Ink** 在终端渲染全屏 TUI（Terminal UI）。

---

## 依赖

| 包 | 用途 |
|---|---|
| `ink` | 将 React 组件树渲染到终端 stdout |
| `react` | 组件模型、hooks（useState / useEffect / useCallback） |
| `commander` | 解析 CLI 启动参数（--no-color 等） |
| `chalk` | 备用彩色输出（ink 内部用 `Text` 组件的 `color` prop） |
| `tsx` | 直接运行 `.tsx` 源码（dev 模式） |
| `typescript` | 构建 |

---

## 安装

```bash
cd cli-demo/ink-ui
npm install
```

---

## 运行

```bash
# 启动全屏 TUI（开发模式，无需编译）
npx tsx src/index.tsx

# 禁用颜色
npx tsx src/index.tsx --no-color

# Ctrl-C 或输入 /exit 退出
```

### 内置斜杠命令

在提示符 `›` 后输入（不是发给 AI 的消息）：

| 命令 | 作用 |
|---|---|
| `/help` | 显示所有可用命令 |
| `/clear` | 清空消息历史 |
| `/model` | 显示当前模型及可选项 |
| `/model gpt-4o` | 切换到指定模型（claude-3-5-sonnet \| gpt-4o \| gemini-1.5-pro） |
| `/tokens` | 查看 token 估算（详见状态栏） |
| `/exit` 或 Ctrl-C | 退出 |
| Esc | 清空当前输入缓冲区 |

---

## 渲染效果

```
✦ ink-ui-demo  ·  React + Ink TUI  ·  /help for commands  ·  Ctrl-C to quit

No messages yet — type something below, or /help for commands.

› _

┌─────────────────────────────────────────────────────┐
│ model: claude-3-5-sonnet (stub)          tokens: 0  │
└─────────────────────────────────────────────────────┘
```

输入后：

```
you› 你好世界
ai›  [claude-3-5-sonnet (stub)] Echo: "你好世界" — stub, connect your API key

sys› /help — show this list
     /clear — clear message history
     ...
```

---

## 编译为 JavaScript

```bash
npx tsc                      # 输出到 dist/
node dist/index.js           # 运行编译产物
```

---

## 编译为独立可执行文件

`yarn build`（即 `npx tsc`）将 TypeScript 编译为 JavaScript 到 `dist/` 目录。
输出的 `dist/index.js` 是一个 Node.js 脚本，可以通过以下两种方式"安装"为可执行命令：

### 方式一：npm link（开发环境推荐）

```bash
npm run build                 # 编译 TS → dist/
npm link                      # 全局注册为 CLI 命令
ink-ui                        # 直接运行！
```

### 方式二：全局安装

```bash
npm run build
npm install -g .              # 全局安装到系统 PATH
ink-ui --help                 # 可在任何目录下运行
```

### 方式三：打包为单文件可执行文件（无需安装 Node.js）

如果需要分发给没有 Node.js 环境的用户，可以使用 [pkg](https://github.com/vercel/pkg) 或 Node.js 22+ 内置的 SEA (Single Executable Application)：

```bash
# 使用 pkg（需要先 npm install -g pkg）
npm run build
pkg dist/index.js --targets node18-linux-x64,node18-macos-x64,node18-win-x64

# 使用 Node.js SEA（Node 22+）
# 参见 https://nodejs.org/api/single-executable-applications.html
```

> **注意**: `yarn build` / `npm run build` 只执行 TypeScript 编译（`tsc`），
> 不会自动生成二进制可执行文件。编译产物在 `dist/` 目录中，需要 Node.js 来运行。

---

## 底层原理

### 1. Ink 的渲染模型：React → 终端

Ink 把 React 虚拟 DOM 翻译成终端转义序列。每次 `setState` 触发重渲染时，
Ink 只刷新**发生变化的行**（差量更新），性能接近手写 ANSI 转义。

```
React 组件树                    Ink 渲染器                    终端
────────────────────────────────────────────────────────────────────
<Box flexDirection="column">     → 计算 Yoga Flexbox 布局      → 写入 stdout
  <Text color="cyan">you›</Text> → ANSI: \x1b[36myou›\x1b[0m
  <Text>{msg}</Text>             → 原始文本
</Box>
```

布局引擎使用 **Yoga**（Meta 出品的 Flexbox 实现，React Native 同款），
所以 `flexDirection`、`gap`、`padding`、`justifyContent` 等 CSS 属性都能直接使用。

---

### 2. `useInput` — 低级键盘钩子

`useInput` 是 Ink 最核心的 API，用于逐字符捕获键盘事件：

```typescript
useInput((input, key) => {
  if (key.ctrl && input === "c") exit()      // Ctrl-C 退出
  else if (key.escape)  setInputBuffer("")   // Esc 清空输入
  else if (key.return)  submit()             // Enter 提交
  else if (key.backspace) setInputBuffer(b => b.slice(0, -1))
  else if (!key.ctrl && !key.meta) setInputBuffer(b => b + input)
})
```

claude-code 的 `PromptInput` 组件用完全相同的方式处理方向键（光标移动）、
Ctrl-A/E（行首/行尾）、Ctrl-U（清行）等。

---

### 3. `useApp().exit()` — 受控退出

Ink 接管了 stdout，直接 `process.exit()` 会留下损坏的终端状态。
正确做法是通过 `useApp().exit()` 让 Ink 先完成清理再退出：

```typescript
// index.tsx
const { waitUntilExit } = render(<App />)
await waitUntilExit()          // 阻塞直到 exit() 被调用

// App.tsx
const { exit } = useApp()
useInput((input, key) => {
  if (key.ctrl && input === "c") exit()
})
```

与 `process.exit()` 的区别：`exit()` 会触发 React 卸载生命周期，
确保终端恢复到正常模式（关闭 raw mode、还原光标、恢复 echo）。

---

### 4. 状态管理：纯 React hooks

整个 TUI 的状态存在 `App.tsx` 的 `useState` 中，无需外部状态库：

```typescript
const [messages, setMessages]       = useState<Message[]>([])   // 对话历史
const [inputBuffer, setInputBuffer] = useState("")              // 当前输入行
const [loading, setLoading]         = useState(false)           // 等待 AI 中
const [totalTokens, setTotalTokens] = useState(0)              // token 计数
const [model, setModel]             = useState(DEFAULT_MODEL)   // 当前模型名
```

每次 `setState` 触发 Ink 重渲染，渲染结果直接写入终端。整个流程与 React Web 完全相同，
只是渲染目标从 DOM 换成了 ANSI 转义序列。

---

### 5. 异步 AI 调用与 loading 状态

```typescript
const submit = useCallback(async () => {
  setLoading(true)
  const reply = await fakeApiCall(text, model)   // 模拟 800ms 网络延迟
  setMessages(prev => [...prev, { role: "assistant", text: reply }])
  setLoading(false)
}, [inputBuffer, loading, model])
```

`loading` 为 `true` 时，渲染树中的 `<Spinner />` 组件出现，
`loading` 回到 `false` 时自动消失——与 Web React 的条件渲染完全一致。

---

### 6. `Spinner` 组件 — `useEffect` 驱动帧循环

```typescript
const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]

export function Spinner({ label = "Thinking…" }: Props) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % FRAMES.length), 80)
    return () => clearInterval(t)   // 组件卸载时清理定时器
  }, [])
  return <Text color="cyan">{FRAMES[frame]} {label}</Text>
}
```

每 80ms 更新一帧，`clearInterval` 在 cleanup 函数里防止内存泄漏——
标准 React 模式，在终端环境中同样有效。

---

### 7. `StatusBar` — Flexbox 底部状态栏

```typescript
<Box width={width} justifyContent="space-between" borderStyle="single" borderColor="gray">
  <Text dimColor> model: {model}</Text>
  <Text dimColor>tokens: {tokenCount} </Text>
</Box>
```

`justifyContent="space-between"` 把两个 `Text` 分别推到左右两端，
`borderStyle="single"` 自动绘制 Unicode 框线，`width={stdout.columns}` 撑满终端宽度。
