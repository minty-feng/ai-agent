# cli-demo — 命令行软件示例项目

借鉴 **claude-code**（Anthropic CLI 工具）的写法风格，演示如何构建现代命令行软件，并介绍各语言的经典终端界面库。

| 子目录 | 语言 / 运行时 | 核心技术 |
|---|---|---|
| `ts-cli/` | TypeScript / Node.js | **Commander.js** 子命令路由 + 并行预取启动优化 |
| `ink-ui/` | TypeScript / Node.js | **React + Ink** 全屏 TUI（claude-code 同款 UI 层） |
| `c-examples/` | C (C11, GCC) | **getopt / readline / ncurses** 经典 Unix 模式 |

---

## 从 claude-code 学到的写法

claude-code (`src/main.tsx`) 的核心工程模式，均已在本 demo 中复现：

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

### 2. 并行预取（Parallel Prefetch）

claude-code `main.tsx` 在 **import 语句之前** 以副作用形式启动磁盘 / 网络操作：

```typescript
// 在其他 import 完成之前就触发，与模块求值并行运行（节省 ~65ms）
startMdmRawRead()       // 读取 MDM 配置
startKeychainPrefetch() // 读取 OAuth token / API key
```

本 demo 的 `ts-cli/src/index.ts` 复现了同款模式：
```typescript
const prefetchConfig = loadConfigAsync()   // 在 import 之前开始
import { chatCommand } from "./commands/chat.js"
// …
await prefetchConfig   // parse 之前等待完成
program.parseAsync(process.argv)
```

### 3. 命令即模块（Command-per-file registry）

claude-code `src/commands.ts` 将 50+ 个斜杠命令各自放在独立文件，统一注册：

```typescript
// claude-code commands.ts 风格（借鉴到本 demo）
import clear from './commands/clear/index.js'
import commit from './commands/commit.js'
import compact from './commands/compact/index.js'
// …每个文件导出一个 defineCommand() / setup 函数

[clear, commit, compact, …].forEach(cmd => program.addCommand(cmd))
```

### 4. 懒加载（Lazy require）

claude-code 用 `require()` 包裹条件导入，避免重型模块（OpenTelemetry ~400KB、gRPC ~700KB）
在启动时被求值：

```typescript
// Dead code elimination: conditional import
const coordinatorMode = feature('COORDINATOR_MODE')
  ? require('./coordinator/coordinatorMode.js')
  : null
```

### 5. React + Ink TUI（`ink-ui/` 子目录）

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

---

## 1. TypeScript CLI Demo (`ts-cli/`)

```
src/
├── index.ts          # 入口：Commander.js 路由 + 并行预取
├── commands/
│   ├── chat.ts       # 交互式 REPL（readline）
│   ├── run.ts        # 单次执行，text / JSON 输出
│   └── version.ts    # 版本信息
└── core/
    ├── cmd.ts        # defineCommand() 辅助（类型安全注册）
    └── logger.ts     # 轻量日志
```

```bash
cd ts-cli && npm install
npx tsx src/index.ts --help
npx tsx src/index.ts run "解释 Transformer 架构"
npx tsx src/index.ts run "hello" --output json
npx tsx src/index.ts chat --model gpt-4o
```

---

## 2. Ink TUI Demo (`ink-ui/`)

```
src/
├── index.tsx             # 入口：render(<App />) + Commander.js
├── App.tsx               # 根组件：useInput + 对话状态管理
└── components/
    ├── Spinner.tsx       # 动画加载指示器（useEffect 驱动帧循环）
    ├── MessageList.tsx   # 对话历史（Box + Text 布局）
    └── StatusBar.tsx     # 底部状态栏（model / token 计数）
```

```bash
cd ink-ui && npm install
npx tsx src/index.tsx      # 启动全屏 TUI，Ctrl-C 退出
```

渲染效果：
```
✦ ink-ui-demo  ·  React + Ink TUI  ·  Ctrl-C to quit

you› 你好世界
ai›  Echo: "你好世界" — stub, connect your API key

› _

┌─────────────────────────────────────────────────────┐
│ model: claude-3-5-sonnet (stub)          tokens: 4  │
└─────────────────────────────────────────────────────┘
```

---

## 3. C 语言经典示例 (`c-examples/`)

```bash
cd c-examples && make
./basic_getopt --name Alice --count 3 --verbose
./subcommands greet --name 张三
./subcommands count --from 1 --to 10
./readline_repl   # 需要 libreadline-dev
```

---

## 经典终端界面库全览

---

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

```javascript
const blessed = require('blessed')
const screen = blessed.screen({ smartCSR: true })
const box = blessed.box({
  top: 'center', left: 'center', width: '50%', height: '50%',
  content: 'Hello {bold}World{/bold}!',
  tags: true, border: { type: 'line' },
  style: { fg: 'white', border: { fg: 'cyan' } }
})
screen.append(box)
screen.key(['q', 'C-c'], () => process.exit(0))
screen.render()
```

**优点**：成熟稳定，功能齐全（对话框、表单、进度条）。  
**用途**：pm2 的监控界面、各类 Node.js dashboard 工具。

---

### 🟨 Python

#### [Rich](https://github.com/Textualize/rich)

> 最流行的 Python 终端美化库，零配置即得漂亮输出。

```python
from rich.console import Console
from rich.table import Table
from rich.progress import track
import time

console = Console()
console.print("[bold green]Hello[/] [italic]World[/]!")

table = Table(title="AI Models")
table.add_column("Name", style="cyan"); table.add_column("Tokens/s", justify="right")
table.add_row("claude-3-5-sonnet", "150"); table.add_row("gpt-4o", "120")
console.print(table)

for _ in track(range(10), description="Processing…"):
    time.sleep(0.1)
```

**优点**：无需 TUI 框架即可获得富文本、表格、进度条；语法高亮。  
**用途**：pip、Textual（内部使用）、大量 CLI 工具。

---

#### [Textual](https://github.com/Textualize/textual)

> 同一团队出品的完整 TUI 框架，CSS 布局 + 响应式 widget。

```python
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Button, Static

class DemoApp(App):
    CSS = "Button { margin: 1; }"

    def compose(self) -> ComposeResult:
        yield Header()
        yield Static("Welcome to Textual!", id="title")
        yield Button("Click me", id="btn")
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.query_one("#title").update("Button pressed!")

DemoApp().run()
```

**优点**：CSS 主题、鼠标支持、异步 I/O、可测试（`pytest-asyncio`）。  
**用途**：Datasette、各类 DevTools TUI。

---

#### [prompt_toolkit](https://github.com/prompt-toolkit/python-prompt-toolkit)

> 功能完备的交互式输入库，是 IPython / ptpython / AWS CLI 的底层。

```python
from prompt_toolkit import prompt
from prompt_toolkit.history import FileHistory
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from prompt_toolkit.completion import WordCompleter

completer = WordCompleter(['/help', '/exit', '/model'])
while True:
    text = prompt('you> ',
                  history=FileHistory('.history'),
                  auto_suggest=AutoSuggestFromHistory(),
                  completer=completer)
    if text.strip() == '/exit': break
    print(f'ai> Echo: {text}')
```

**优点**：自动补全、语法高亮、历史搜索、鼠标支持；比 readline 强大得多。

---

### 🟩 Go

#### [Bubble Tea](https://github.com/charmbracelet/bubbletea) + [Lip Gloss](https://github.com/charmbracelet/lipgloss)

> Elm 架构的 Go TUI 框架（Model/Update/View），Charm 团队出品。

```go
package main

import (
    "fmt"
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
)

type model struct{ count int }

func (m model) Init() tea.Cmd { return nil }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "up":   m.count++
        case "down": m.count--
        case "q", "ctrl+c": return m, tea.Quit
        }
    }
    return m, nil
}

var style = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#04B575"))

func (m model) View() string {
    return style.Render(fmt.Sprintf("Count: %d\n↑/↓ to change  q to quit", m.count))
}

func main() {
    tea.NewProgram(model{}).Run()
}
```

**优点**：类型安全、编译成单一二进制、Elm 架构易于测试。  
**用途**：gh（GitHub CLI）部分交互界面、gum、各类 Go 开发工具。

---

#### [tview](https://github.com/rivo/tview)

> 高层次 widget 库，内置列表、表格、表单、Flex 布局。

```go
app := tview.NewApplication()
list := tview.NewList().
    AddItem("Claude", "Anthropic", 'c', nil).
    AddItem("GPT-4o", "OpenAI",    'g', nil).
    AddItem("Quit",   "",           'q', func() { app.Stop() })

app.SetRoot(list, true).Run()
```

**用途**：k9s（Kubernetes TUI）、lazydocker 同款风格。

---

### 🦀 Rust

#### [Ratatui](https://github.com/ratatui-org/ratatui)（前身 tui-rs）

> Rust 生态最成熟的 TUI 框架，Immediate-Mode 渲染。

```rust
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, Paragraph},
};

fn ui(frame: &mut Frame) {
    let area = frame.size();
    let block = Block::default().title("Demo").borders(Borders::ALL);
    let paragraph = Paragraph::new("Hello, Ratatui!")
        .block(block)
        .style(Style::default().fg(Color::Cyan));
    frame.render_widget(paragraph, area);
}
```

**优点**：零 unsafe、极低内存、与 crossterm / termion 解耦。  
**用途**：gitui、bottom（系统监控）、spotify-tui。

---

### 🔵 C / C++

#### [ncurses](https://invisible-island.net/ncurses/)

> Unix 终端控制的祖师爷，bash、vim、htop 的底层库。

```c
#include <ncurses.h>
int main(void) {
    initscr();             /* 初始化 */
    cbreak(); noecho();    /* 不回显输入 */
    start_color();
    init_pair(1, COLOR_CYAN, COLOR_BLACK);

    attron(COLOR_PAIR(1) | A_BOLD);
    mvprintw(5, 10, "Hello, ncurses!");
    attroff(COLOR_PAIR(1) | A_BOLD);

    mvprintw(7, 10, "Press any key to exit");
    refresh(); getch();
    endwin();
    return 0;
}
// gcc -o demo demo.c -lncurses
```

**优点**：无处不在，POSIX 标准，支持颜色/粗体/鼠标/窗口（WINDOW*）。  
**用途**：vim、htop、mc（Midnight Commander）、bash。

---

## 库选型速查

| 场景 | 推荐 |
|---|---|
| 需要富文本输出（表格、进度条），无交互 | **Python Rich** / **chalk** (JS) |
| 需要完整 TUI，团队会 React | **Ink** (JS/TS) — claude-code 的选择 |
| 需要完整 TUI，团队会 Python | **Textual** |
| 需要完整 TUI，单二进制部署 | **Bubble Tea** (Go) / **Ratatui** (Rust) |
| 嵌入式 / 系统层 / 性能极限 | **ncurses** (C) |
| Node.js dashboard / 复杂窗口布局 | **blessed** / **neo-blessed** |
| 高级交互输入（自动补全、历史） | **prompt_toolkit** (Python) / **readline** (C) |

