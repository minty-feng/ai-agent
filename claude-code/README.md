# claude-code — 借鉴 claude-code 的 React + Ink 终端 UI 项目

借鉴 **claude-code**（Anthropic CLI 工具）的写法风格，演示如何用 React + Ink 构建现代交互式终端应用。

| 子目录 | 语言 / 运行时 | 核心技术 |
|---|---|---|
| `ink-ui/` | TypeScript / Node.js | **React + Ink** 全屏 TUI（claude-code 同款 UI 层） |

---

## 从 claude-code 学到的写法

claude-code (`src/main.tsx`) 的核心工程模式，均已在本项目中复现：

### 1. Commander.js + extra-typings（`@commander-js/extra-typings`）

claude-code 用 Commander.js 而不是 yargs，原因是 `@commander-js/extra-typings`
提供完整的泛型推断——`.option()` 链的返回类型会精确反映到 `.action()` 的参数里。

```typescript
// claude-code src/main.tsx 风格
import { Command, Option } from "@commander-js/extra-typings"

const program = new Command()
  .name("tool")
  .description("…")

program
  .command("run")
  .argument("<prompt>", "the prompt to send")
  .addOption(new Option("-o, --output <fmt>", "format").choices(["text", "json"] as const))
  .action((prompt, opts) => {
    // opts.output 的类型自动推断为 "text" | "json"
  })
```

### 2. React + Ink TUI

claude-code 最核心的技术选型：用 React 写终端 UI。

```typescript
// claude-code 的 Spinner 组件写法（我们的版本）
export function Spinner({ label = "Thinking…" }: Props) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % FRAMES.length), 80)
    return () => clearInterval(t)
  }, [])
  return <Text color="cyan">{FRAMES[frame]} {label}</Text>
}
```

### 3. 命令即模块（Command-per-file registry）

claude-code `src/commands.ts` 将 50+ 个斜杠命令各自放在独立文件，统一注册。

### 4. 懒加载（Lazy require）

claude-code 用 `require()` 包裹条件导入，避免重型模块在启动时被求值。

---

## Ink TUI Demo (`ink-ui/`)

### 项目结构

```
src/
├── index.tsx             # 入口：render(<App />) + Commander.js
├── App.tsx               # 根组件：useInput + 对话状态管理 + 斜杠命令
└── components/
    ├── Spinner.tsx       # 动画加载指示器（useEffect 驱动帧循环）
    ├── MessageList.tsx   # 对话历史（Box + Text 布局）
    ├── StatusBar.tsx     # 底部状态栏（model / token 计数）
    ├── Header.tsx        # 动画循环变色标题
    ├── Dice3D.tsx        # 3D 等轴骰子（带翻滚动画）
    ├── RainbowText.tsx   # 彩虹渐变文字
    ├── Timer.tsx         # 倒计时器（带进度条）
    └── ProgressBar.tsx   # 模拟进度条动画
```

### 快速开始

```bash
cd ink-ui && npm install

# 开发模式（tsx 直接运行）
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run typecheck

# 运行构建后的产物
npm start

# 清理构建目录
npm run clean
```

### 渲染效果

```
✦ ink-ui-demo  ·  React + Ink TUI  ·  /help for commands  ·  Ctrl-C to quit

you› 你好世界
ai›  [claude-3-5-sonnet (stub)] Echo: "你好世界" — stub, connect your API key

› _

┌─────────────────────────────────────────────────────┐
│ model: claude-3-5-sonnet (stub)          tokens: 4  │
└─────────────────────────────────────────────────────┘
```

### 斜杠命令

| 命令 | 说明 |
|---|---|
| `/help` | 显示命令列表 |
| `/clear` | 清空消息历史 |
| `/model [name]` | 查看 / 切换模型 |
| `/tokens` | 查看 token 统计 |
| `/dice [N]` | 掷骰子 (默认 d6) |
| `/dice3d` | 3D 动画骰子 🎲 |
| `/rainbow <text>` | 彩虹渐变文字 🌈 |
| `/timer <seconds>` | 倒计时器 ⏱ |
| `/calc <expression>` | 数学计算器 🧮 |
| `/uuid` | 生成 UUID v4 🔑 |
| `/base64 <e\|d> <text>` | Base64 编解码 📦 |
| `/progress [label]` | 进度条动画 📊 |
| `/exit` 或 `Ctrl-C` | 退出 |

---

## 经典终端界面库全览

### 🟦 TypeScript / JavaScript

#### [Ink](https://github.com/vadimdemedes/ink) ★ claude-code 的选择

> 用 React 写终端 UI，与 web React 完全相同的组件模型。

```tsx
import React, { useState } from 'react'
import { render, Box, Text, useInput } from 'ink'

function Counter() {
  const [n, setN] = useState(0)
  useInput((_, key) => { if (key.upArrow) setN(n => n + 1) })
  return (
    <Box borderStyle="round" padding={1}>
      <Text color="green">Count: {n}  (↑ to increment)</Text>
    </Box>
  )
}

render(<Counter />)
```

**优点**：React 生态（hooks、状态、测试）直接复用；Flexbox 布局。  
**用途**：claude-code、opencode 的整个 REPL UI 都是 Ink 组件。

---

#### [Blessed](https://github.com/chjj/blessed) / [neo-blessed](https://github.com/nicktindall/neo-blessed)

> 类 ncurses 的 Node.js 库，支持窗口、滚动、鼠标事件。

**优点**：成熟稳定，功能齐全（对话框、表单、进度条）。  
**用途**：pm2 的监控界面、各类 Node.js dashboard 工具。

---

### 🟨 Python

#### [Rich](https://github.com/Textualize/rich)

> 最流行的 Python 终端美化库，零配置即得漂亮输出。

**优点**：无需 TUI 框架即可获得富文本、表格、进度条；语法高亮。  
**用途**：pip、Textual（内部使用）、大量 CLI 工具。

#### [Textual](https://github.com/Textualize/textual)

> 同一团队出品的完整 TUI 框架，CSS 布局 + 响应式 widget。

**优点**：CSS 主题、鼠标支持、异步 I/O、可测试。  
**用途**：Datasette、各类 DevTools TUI。

#### [prompt_toolkit](https://github.com/prompt-toolkit/python-prompt-toolkit)

> 功能完备的交互式输入库，是 IPython / ptpython / AWS CLI 的底层。

---

### 🟩 Go

#### [Bubble Tea](https://github.com/charmbracelet/bubbletea) + [Lip Gloss](https://github.com/charmbracelet/lipgloss)

> Elm 架构的 Go TUI 框架（Model/Update/View），Charm 团队出品。

**优点**：类型安全、编译成单一二进制、Elm 架构易于测试。  
**用途**：gh（GitHub CLI）部分交互界面、gum、各类 Go 开发工具。

#### [tview](https://github.com/rivo/tview)

> 高层次 widget 库，内置列表、表格、表单、Flex 布局。

**用途**：k9s（Kubernetes TUI）、lazydocker 同款风格。

---

### 🦀 Rust

#### [Ratatui](https://github.com/ratatui-org/ratatui)（前身 tui-rs）

> Rust 生态最成熟的 TUI 框架，Immediate-Mode 渲染。

**优点**：零 unsafe、极低内存、与 crossterm / termion 解耦。  
**用途**：gitui、bottom（系统监控）、spotify-tui。

---

## 库选型速查

| 场景 | 推荐 |
|---|---|
| 需要富文本输出（表格、进度条），无交互 | **Python Rich** / **chalk** (JS) |
| 需要完整 TUI，团队会 React | **Ink** (JS/TS) — claude-code 的选择 |
| 需要完整 TUI，团队会 Python | **Textual** |
| 需要完整 TUI，单二进制部署 | **Bubble Tea** (Go) / **Ratatui** (Rust) |
| Node.js dashboard / 复杂窗口布局 | **blessed** / **neo-blessed** |
| 高级交互输入（自动补全、历史） | **prompt_toolkit** (Python) |

