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
 */

import React, { useState, useCallback } from "react"
import { Box, Text, useInput, useApp } from "ink"
import { MessageList, type Message } from "./components/MessageList.js"
import { Spinner } from "./components/Spinner.js"
import { StatusBar } from "./components/StatusBar.js"

const MODEL = "claude-3-5-sonnet (stub)"

// Simulate async AI response — replace with real Anthropic SDK call.
function fakeApiCall(userText: string): Promise<string> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(`Echo: "${userText}" — stub, connect your API key`), 800),
  )
}

export function App() {
  const { exit } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputBuffer, setInputBuffer] = useState("")
  const [loading, setLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)

  // Submit the current input buffer as a user message
  const submit = useCallback(async () => {
    const text = inputBuffer.trim()
    if (!text || loading) return

    setInputBuffer("")
    const userMsg: Message = { role: "user", text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const reply = await fakeApiCall(text)
    const aiMsg: Message = { role: "assistant", text: reply }
    setMessages((prev) => [...prev, aiMsg])
    setTotalTokens((n) => n + text.split(/\s+/).length * 2)
    setLoading(false)
  }, [inputBuffer, loading])

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
      {/* ── Header ─────────────────────────────────────── */}
      <Box>
        <Text bold color="green">✦ ink-ui-demo</Text>
        <Text dimColor>  ·  React + Ink TUI  ·  Ctrl-C to quit</Text>
      </Box>

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
      <StatusBar model={MODEL} tokenCount={totalTokens} />
    </Box>
  )
}
