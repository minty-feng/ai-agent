# ts-cli — TypeScript CLI Demo

借鉴 **claude-code** 架构，用 **Commander.js + chalk** 演示现代 TypeScript CLI 的完整模式。

---

## 依赖

| 包 | 用途 |
|---|---|
| `@commander-js/extra-typings` | CLI 子命令路由（带 TS 类型推断） |
| `chalk` | 终端彩色输出 |
| `tsx` | 直接运行 `.ts` 源码（dev 模式，无需预编译） |
| `typescript` | 构建产物 |

---

## 安装

```bash
cd cli-demo/ts-cli
npm install
```

---

## 运行（开发模式，无需编译）

```bash
# 查看帮助
npx tsx src/index.ts --help

# 交互式对话 REPL
npx tsx src/index.ts chat
npx tsx src/index.ts chat --model gpt-4o
npx tsx src/index.ts chat --model claude-3-5-sonnet --system "你是一位 Linux 专家"

# 单次执行（text 输出）
npx tsx src/index.ts run "解释 Transformer 架构"

# 单次执行（JSON 输出，适合管道）
npx tsx src/index.ts run "hello world" --output json

# 数学表达式计算
npx tsx src/index.ts calc "3 * (2 + 4) / 1.5"
npx tsx src/index.ts calc "2 ** 10"
npx tsx src/index.ts calc "100 % 7" --output json

# 系统 / 运行时信息
npx tsx src/index.ts sys
npx tsx src/index.ts sys --output json

# 版本信息
npx tsx src/index.ts version
```

### chat 模式的斜杠命令

进入 `chat` 后，在提示符 `you>` 输入以下命令（不是消息）：

| 命令 | 作用 |
|---|---|
| `/help` | 显示命令列表 |
| `/model` | 显示当前模型及可用模型 |
| `/model gpt-4o` | 切换到指定模型 |
| `/clear` | 清屏 |
| `/tokens` | 显示本次会话 token 估算值 |
| `/exit` 或 `/quit` | 退出（也可 Ctrl-D） |

---

## 编译为 JavaScript

```bash
npm run build      # 输出到 dist/
node dist/index.js --help
```

---

## 底层原理

### 1. Commander.js + `@commander-js/extra-typings`

`@commander-js/extra-typings` 是 Commander.js 的类型增强包，它让 `.option()` 的返回类型
精确传递到 `.action()` 的参数对象里：

```typescript
program
  .command("run")
  .addOption(new Option("-o, --output <format>").choices(["text", "json"] as const))
  .action((prompt, opts) => {
    // opts.output 的类型自动推断为 "text" | "json"，而不是 string
    if (opts.output === "json") { /* … */ }
  })
```

不使用 `yargs` 的原因：yargs 的泛型推断较弱，`@commander-js/extra-typings` 提供了
接近零成本的完整类型安全。

---

### 2. 并行预取（Parallel Prefetch）

`index.ts` 在 **import 语句执行之前**就调用 `loadConfigAsync()`，利用 Node.js ES Module
顶层作用域的求值顺序——当其他模块仍在加载时，配置读取和鉴权 token 预取已经并行进行：

```typescript
// 副作用：在模块 import 树求值期间同步开始
const prefetchConfig = loadConfigAsync()

import { chatCommand } from "./commands/chat.js"
// …其他 import（网络、磁盘 I/O 并行进行）

await prefetchConfig   // 此时大概率已完成，几乎零等待
await program.parseAsync(process.argv)
```

claude-code 用同款模式在 250ms 内完成冷启动（节省约 65ms）。

---

### 3. 命令即模块（Command-per-file）

每个子命令是一个独立文件，导出 `CommandSetup` 类型的函数。`index.ts` 只做注册，
不包含业务逻辑，保持瘦入口：

```
src/commands/
  chat.ts      → chatCommand(program)
  run.ts       → runCommand(program)
  calc.ts      → calcCommand(program)
  sys.ts       → sysCommand(program)
  version.ts   → versionCommand(program)
```

好处：每个命令可单独测试；新增命令只需加文件 + 在 `index.ts` 里一行注册。

---

### 4. `readline` 异步迭代器（`for await … of rl`）

`chat.ts` 用 `for await (const line of rl)` 驱动 REPL 循环，而不是传统的 `.on("line", …)` 回调：

```typescript
for await (const line of rl) {
  // 每次 Enter 后执行，支持 async/await
  const reply = await callApi(line)
  console.log(reply)
}
```

异步迭代器天然支持 `async/await`，代码结构比嵌套回调更清晰，与 claude-code 的 headless SDK 模式一致。

---

### 5. 安全表达式求值（`calc` 命令）

`calc` 命令在执行表达式前先用正则白名单过滤，只允许数字和运算符，拒绝任何代码：

```typescript
if (!/^[\d\s+\-*/().,^%]+$/.test(expr)) {
  throw new Error("Unsafe expression")
}
const result = new Function(`"use strict"; return (${expr})`)()
```

`new Function` 比 `eval` 更受限（没有外部作用域访问），加上正则守门后适合本地 CLI 工具。

---

### 6. `os` 模块（`sys` 命令）

`sys` 命令演示 Node.js 内置 `os` 模块的常用 API：

```typescript
os.hostname()        // 主机名
os.platform()        // "linux" | "darwin" | "win32"
os.arch()            // "x64" | "arm64"
os.cpus()            // CPU 核心列表（含型号、频率）
os.totalmem()        // 物理内存总量（字节）
os.freemem()         // 空闲内存（字节）
os.uptime()          // 系统运行时间（秒）
```
