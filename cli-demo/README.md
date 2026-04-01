# cli-demo — 命令行软件示例项目

本目录演示两种主流命令行软件构建方式：

| 子目录 | 语言 / 运行时 | 说明 |
|---|---|---|
| `ts-cli/` | TypeScript / Node.js | 使用 **yargs** 的子命令 CLI + 交互式 REPL，与 opencode/claude-code 同款架构 |
| `c-examples/` | C (C11, GCC) | 三个经典 C CLI 示例：getopt、readline REPL、子命令分派 |

---

## 1. TypeScript CLI Demo (`ts-cli/`)

### 架构概述

```
src/
├── index.ts              # 入口：yargs 路由
├── commands/
│   ├── chat.ts           # 交互式 REPL（readline loop）
│   ├── run.ts            # 单次执行（positional arg + --output）
│   └── version.ts        # 版本信息
└── core/
    ├── cmd.ts            # CommandModule 辅助（来自 opencode/tui-cli 模式）
    ├── logger.ts         # 轻量日志
    └── types.ts          # 共享类型定义
```

核心设计模式与 [opencode/tui-cli](../opencode/tui-cli) 及 claude-code 的 `main.tsx` 相同：

- **yargs** 负责参数解析与帮助文本生成
- 每个子命令是独立模块，导出 `CommandModule<TArgs>` 对象
- `cmd<T>()` 辅助函数提供完整的 TypeScript 类型推断
- 入口文件仅负责注册子命令，保持极简

### 快速开始

```bash
cd ts-cli
npm install
# 直接运行（无需 build）：
npx tsx src/index.ts --help
npx tsx src/index.ts version
npx tsx src/index.ts run "你好世界"
npx tsx src/index.ts run "hello" --output json
npx tsx src/index.ts chat --model gpt-4o
```

示例输出：

```
$ npx tsx src/index.ts run "解释量子纠缠" --output json
{
  "prompt": "解释量子纠缠",
  "text": "Stub answer to: \"解释量子纠缠\"",
  "tokens": 2
}

$ npx tsx src/index.ts chat
╔══════════════════════════════════╗
║   ts-cli-demo  ·  chat mode      ║
╚══════════════════════════════════╝
Model: claude-3-5-sonnet
Type your message and press Enter. Type /exit or Ctrl-D to quit.

you> 你好
ai> [claude-3-5-sonnet] Echo: "你好" — (stub response, wire up your API key here)
you> /exit
Session ended.
```

---

## 2. C 语言 CLI 示例 (`c-examples/`)

### 编译

```bash
cd c-examples
# 编译全部（readline_repl 需要 libreadline-dev）：
make
# Ubuntu/Debian 安装 readline：
sudo apt-get install libreadline-dev
```

---

### 示例 1：`01_basic_getopt.c` — getopt_long（最经典）

**用法**：几乎所有 Unix 工具（`grep`、`git`、`curl`）的标准方式。

```bash
./basic_getopt --name Alice --count 3 --verbose
./basic_getopt -n Bob -c 5
./basic_getopt --help
```

**核心代码模式**：

```c
static const struct option long_opts[] = {
    { "name",    required_argument, NULL, 'n' },
    { "count",   required_argument, NULL, 'c' },
    { "verbose", no_argument,       NULL, 'v' },
    { NULL, 0, NULL, 0 }  /* sentinel */
};

while ((opt = getopt_long(argc, argv, "n:c:v", long_opts, NULL)) != -1) {
    switch (opt) {
    case 'n': name  = optarg;       break;
    case 'c': count = atoi(optarg); break;
    case 'v': verbose = 1;          break;
    }
}
```

---

### 示例 2：`02_readline_repl.c` — GNU readline REPL

**用法**：bash、python、sqlite3、gdb 的交互式 shell 模式。

```bash
./readline_repl
repl> /help
repl> hello world
repl> /history
repl> /exit
```

**核心代码模式**：

```c
using_history();
while (1) {
    char *line = readline("repl> ");  /* 支持方向键编辑 */
    if (!line) break;                 /* Ctrl-D = EOF */
    add_history(line);                /* 历史记录 */
    process_input(line);
    free(line);                       /* readline 分配，需手动释放 */
}
```

---

### 示例 3：`03_subcommands.c` — 子命令分派（git 风格）

**用法**：`git`、`docker`、`cargo`、`kubectl` 等工具的标准模式。

```bash
./subcommands --help
./subcommands greet --name Alice
./subcommands count --from 1 --to 10
./subcommands greet --help
```

**核心代码模式**：

```c
typedef struct {
    const char *name;
    const char *description;
    int (*fn)(int argc, char *argv[]);  /* 函数指针 */
} Subcommand;

static const Subcommand commands[] = {
    { "greet", "print a greeting",  cmd_greet },
    { "count", "count from N to M", cmd_count },
    { NULL, NULL, NULL }
};

/* dispatcher */
for (int i = 0; commands[i].name; i++)
    if (strcmp(argv[1], commands[i].name) == 0)
        return commands[i].fn(argc - 1, argv + 1);
```

---

## 其他语言的命令行构建方案

| 语言 | 推荐库 | 特点 |
|---|---|---|
| **TypeScript/JS** | [yargs](https://yargs.js.org) / [commander.js](https://github.com/tj/commander.js) | 声明式，自动生成帮助文本 |
| **Python** | [argparse](https://docs.python.org/3/library/argparse.html) / [click](https://click.palletsprojects.com) / [typer](https://typer.tiangolo.com) | 标准库内置 / 装饰器风格 / 类型注解驱动 |
| **Go** | [cobra](https://github.com/spf13/cobra) / [urfave/cli](https://github.com/urfave/cli) | kubectl/hugo/git 同款；编译单二进制 |
| **Rust** | [clap](https://docs.rs/clap) | derive macro，零开销，类型安全 |
| **C** | [getopt_long](https://man7.org/linux/man-pages/man3/getopt.3.html) + [readline](https://tiswww.case.edu/php/chet/readline/rltop.html) | POSIX 标准，无依赖 |

---

## 参考架构：opencode / claude-code 的 CLI 层

本 `ts-cli` demo 提取自 [opencode/tui-cli](../opencode/tui-cli) 模式，要点：

1. **入口精简**：`index.ts` 只注册命令，不含业务逻辑
2. **命令即模块**：每个子命令独立文件，导出 `CommandModule` 对象
3. **类型安全**：`cmd<TArgs>()` 辅助确保 `handler` 参数类型与 `builder` 一致
4. **Worker RPC**：重型任务（AI 调用、文件系统）放入 Web Worker，通过 `Rpc.client()` 异步调用
5. **可测试性**：所有依赖通过 deps 注入，便于单元测试 mock
