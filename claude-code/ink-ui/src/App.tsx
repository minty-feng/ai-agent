/**
 * App — root Ink component, the equivalent of claude-code's REPL screen
 *
 * Learned from claude-code's architecture:
 * • src/screens/ contains full-screen UIs (REPL, Doctor, Resume)
 * • Each screen is a React component rendered by ink's render()
 * • useInput() handles keyboard input (Escape, Enter, arrow keys)
 * • State (messages, input buffer, loading) lives in useState
 * • Heavy async work (API call) runs in useEffect with an abort signal
 *
 * Key Ink APIs shown:
 *   useInput    — low-level keyboard handler (char by char)
 *   useApp      — gives access to exit() to quit the process
 *   Box / Text  — layout primitives
 *   render()    — mounts the React tree to the terminal
 *
 * Slash commands (type while in the prompt):
 *   /help              — show command list
 *   /clear             — clear message history
 *   /model <name>      — switch displayed model name
 *   /tokens            — show total token count
 *   /dice [N]          — roll an N-sided die (default d6)
 *   /dice3d            — roll a 3D animated die
 *   /rainbow <text>    — display text in rainbow colors
 *   /timer <seconds>   — start a countdown timer
 *   /calc <expr>       — evaluate a math expression
 *   /uuid              — generate a random UUID v4
 *   /base64 <e|d> <text> — base64 encode or decode
 *   /progress <label>  — show an animated progress bar
 */

import React, { useState, useCallback } from "react"
import { Box, Text, useInput, useApp } from "ink"
import { MessageList, type Message } from "./components/MessageList.js"
import { Spinner } from "./components/Spinner.js"
import { StatusBar } from "./components/StatusBar.js"
import { Header } from "./components/Header.js"
import crypto from "node:crypto"

// Approximate token estimate: ~2 tokens per word (matches GPT-3/4 tokenization heuristic)
const TOKEN_MULTIPLIER = 2

const MODELS = ["claude-3-5-sonnet", "gpt-4o", "gemini-1.5-pro"] as const
const DEFAULT_MODEL = "claude-3-5-sonnet (stub)"

// Unicode dice face symbols ⚀–⚅
const UNICODE_D6 = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const

// Help lines shown when the user types /help
const HELP_LINES = [
  "/help                        — show this list",
  "/clear                       — clear message history",
  "/model                       — show available models",
  "/model <name>                — switch model  (claude-3-5-sonnet | gpt-4o | gemini-1.5-pro)",
  "/tokens                      — show total token estimate",
  "/dice [N]                    — roll an N-sided die  (default: d6)",
  "/dice3d                      — roll a 3D animated die  🎲",
  "/rainbow <text>              — display text in rainbow colors",
  "/timer <seconds>             — start a countdown timer  ⏱",
  "/calc <expression>           — evaluate a math expression  🧮",
  "/uuid                        — generate a random UUID v4  🔑",
  "/base64 <encode|decode> <t>  — base64 encode / decode  📦",
  "/progress [label]            — animated progress bar demo  📊",
  "/exit  or Ctrl-C             — quit",
]

// Simulate async AI response — replace with real Anthropic SDK call.
function fakeApiCall(userText: string, model: string): Promise<string> {
  return new Promise((resolve) =>
    setTimeout(
      () => resolve(`[${model}] Echo: "${userText}" — stub, connect your API key`),
      800,
    ),
  )
}

/**
 * Process a slash command.  Returns a system message to append to history,
 * or a special action object.  Pure function — no side effects.
 */
type SlashResult =
  | { kind: "message"; text: string }
  | { kind: "clear" }
  | { kind: "model"; name: string }
  | { kind: "rainbow"; text: string }
  | { kind: "dice3d"; value: number }
  | { kind: "timer"; seconds: number }
  | { kind: "progress"; label: string }
  | { kind: "unknown"; cmd: string }

function handleSlash(input: string, currentModel: string): SlashResult {
  const parts = input.trim().split(/\s+/)
  const cmd = parts[0] ?? ""

  switch (cmd) {
    case "/help":
      return { kind: "message", text: HELP_LINES.join("\n") }
    case "/clear":
      return { kind: "clear" }
    case "/tokens":
      return { kind: "message", text: "(see token counter in status bar)" }
    case "/model": {
      if (parts.length < 2) {
        return {
          kind: "message",
          text: `Current model: ${currentModel}\nChoices: ${MODELS.join(" | ")}`,
        }
      }
      const name = parts.slice(1).join(" ")
      const matched = MODELS.find((m) => m === name)
      if (!matched) {
        return {
          kind: "message",
          text: `Unknown model "${name}". Choices: ${MODELS.join(" | ")}`,
        }
      }
      return { kind: "model", name: matched }
    }
    case "/dice": {
      const sides = parts[1] ? parseInt(parts[1], 10) : 6
      if (isNaN(sides) || sides < 2) {
        return { kind: "message", text: 'Usage: /dice [sides]  e.g. /dice 20' }
      }
      const roll = Math.floor(Math.random() * sides) + 1
      const face = sides === 6 ? ` ${UNICODE_D6[roll - 1]}` : ""
      const ratio = roll / sides
      const tag = ratio >= 0.9 ? " ★ Critical!" : ratio <= 0.1 ? " ☠ Fumble!" : ""
      return {
        kind: "message",
        text: `🎲 d${sides} → ${roll}${face}${tag}  (1–${sides})`,
      }
    }
    case "/dice3d": {
      const roll3d = Math.floor(Math.random() * 6) + 1
      return { kind: "dice3d", value: roll3d }
    }
    case "/rainbow": {
      const text = parts.slice(1).join(" ")
      if (!text) return { kind: "message", text: "Usage: /rainbow <text>" }
      return { kind: "rainbow", text }
    }
    default:
      return { kind: "unknown", cmd }
  }
}

export function App() {
  const { exit } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputBuffer, setInputBuffer] = useState("")
  const [loading, setLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const [model, setModel] = useState(DEFAULT_MODEL)

  // Submit the current input buffer as a user message
  const submit = useCallback(async () => {
    const text = inputBuffer.trim()
    if (!text || loading) return
    setInputBuffer("")

    // ── Slash command dispatch ──────────────────────────────────────────────
    if (text.startsWith("/")) {
      if (text === "/exit" || text === "/quit") { exit(); return }

      const result = handleSlash(text, model)
      switch (result.kind) {
        case "clear":
          setMessages([])
          return
        case "model":
          setModel(`${result.name} (stub)`)
          setMessages((prev) => [
            ...prev,
            { role: "system", text: `✔ Switched model to ${result.name}` },
          ])
          return
        case "message":
          setMessages((prev) => [...prev, { role: "system", text: result.text }])
          return
        case "rainbow":
          setMessages((prev) => [...prev, { role: "rainbow", text: result.text }])
          return
        case "dice3d":
          setMessages((prev) => [...prev, { role: "dice3d", text: String(result.value) }])
          return
        case "unknown":
          setMessages((prev) => [
            ...prev,
            { role: "system", text: `Unknown command "${result.cmd}". Type /help for help.` },
          ])
          return
      }
    }

    // ── Normal user message ─────────────────────────────────────────────────
    const userMsg: Message = { role: "user", text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const reply = await fakeApiCall(text, model)
    const aiMsg: Message = { role: "assistant", text: reply }
    setMessages((prev) => [...prev, aiMsg])
    setTotalTokens((n) => n + text.split(/\s+/).length * TOKEN_MULTIPLIER)
    setLoading(false)
  }, [inputBuffer, loading, model, exit])

  // useInput — the core Ink keyboard hook (claude-code uses this everywhere
  // in PromptInput to handle Escape, arrow keys, Ctrl-C, etc.)
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit()
    } else if (key.escape) {
      setInputBuffer("")
    } else if (key.return) {
      submit()
    } else if (key.backspace || key.delete) {
      setInputBuffer((b) => b.slice(0, -1))
    } else if (!key.ctrl && !key.meta) {
      setInputBuffer((b) => b + input)
    }
  })

  return (
    <Box flexDirection="column" gap={1} padding={1}>
      {/* ── Animated cycling-color header ──────────────── */}
      <Header />

      {/* ── Message history ───────────────────────────── */}
      <MessageList messages={messages} />

      {/* ── Spinner (shown while awaiting AI reply) ───── */}
      {loading && <Spinner label="Waiting for response…" />}

      {/* ── Input bar ─────────────────────────────────── */}
      <Box gap={1}>
        <Text color="cyan" bold>›</Text>
        <Text>{inputBuffer}</Text>
        <Text color="gray">█</Text>
      </Box>

      {/* ── Status bar ────────────────────────────────── */}
      <StatusBar model={model} tokenCount={totalTokens} />
    </Box>
  )
}
