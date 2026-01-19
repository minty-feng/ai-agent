# OpenCode TUI CLI extraction

This directory contains an extracted, minimal TUI CLI command-line layer based on
the opencode dev branch. The goal is to isolate the CLI entry points and their
worker/RPC bridge without pulling in the full application.

Source references (dev branch):
- packages/opencode/src/cli/cmd/tui/thread.ts
- packages/opencode/src/cli/cmd/tui/attach.ts
- packages/opencode/src/cli/cmd/tui/worker.ts
- packages/opencode/src/cli/network.ts
- packages/opencode/src/util/rpc.ts

Intentionally omitted:
- TUI UI components, routes, and context providers
- Server/config/project subsystems
- Non-TUI CLI commands
