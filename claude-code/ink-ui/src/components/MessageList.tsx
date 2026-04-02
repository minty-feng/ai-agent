/**
 * MessageList — scrollable conversation history
 *
 * Learned from claude-code: src/components/messages/ contains separate
 * components for user/assistant messages rendered inside a scrollable Box.
 *
 * Key Ink APIs shown:
 *   Box       — flexbox-style layout container
 *   Text      — text with color / bold / dim modifiers
 *   flexDirection, gap, paddingLeft — CSS-like props
 */

import React, { useMemo } from "react"
import { Box, Text } from "ink"
import { RainbowText } from "./RainbowText.js"
import { Dice3D } from "./Dice3D.js"
import { Timer } from "./Timer.js"
import { ProgressBar } from "./ProgressBar.js"

export type Message = {
  role: "user" | "assistant" | "system" | "rainbow" | "dice3d" | "timer" | "progress"
  text: string
}

type Props = {
  messages: Message[]
  /**
   * Called when the live Dice3D animation settles.
   * The host (App) should replace the message at `index` with a compact
   * static line so the 18-line dice box is freed from the terminal height.
   */
  onDiceComplete?: (index: number, value: number) => void
}

// Unicode dice face symbols ⚀–⚅
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const

export const MessageList = React.memo(function MessageList({ messages, onDiceComplete }: Props) {
  if (messages.length === 0) {
    return <Text dimColor>No messages yet — type something below, or /help for commands.</Text>
  }

  // Only the last animated component of each type renders as live.
  // Previous instances show a compact static state so Ink doesn't repaint
  // their lines on every animation frame of the current active one.
  const lastDiceIdx = useMemo(
    () => messages.reduce((last, m, i) => (m.role === "dice3d" ? i : last), -1),
    [messages],
  )
  const lastProgressIdx = useMemo(
    () => messages.reduce((last, m, i) => (m.role === "progress" ? i : last), -1),
    [messages],
  )

  return (
    <Box flexDirection="column" gap={1}>
      {messages.map((msg, i) => (
        <Box key={i} flexDirection="row" gap={1}>
          {msg.role === "user" ? (
            <>
              <Text color="cyan" bold>you›</Text>
              <Text>{msg.text}</Text>
            </>
          ) : msg.role === "assistant" ? (
            <>
              <Text color="magenta" bold>ai› </Text>
              <Text color="white">{msg.text}</Text>
            </>
          ) : msg.role === "rainbow" ? (
            /* /rainbow <text> — each character gets its own hue */
            <>
              <Text color="cyan" bold>🌈 </Text>
              <RainbowText text={msg.text} />
            </>
          ) : msg.role === "dice3d" ? (
            /* /dice3d — animated 3D dice roll (live only for the latest roll) */
            (() => {
              const v = parseInt(msg.text, 10) || 1
              if (i === lastDiceIdx) {
                return (
                  <Dice3D
                    value={v}
                    onComplete={onDiceComplete ? () => onDiceComplete(i, v) : undefined}
                  />
                )
              }
              const face = DICE_FACES[v - 1] ?? "🎲"
              const ratio = v / 6
              const label = ratio >= 0.8 ? " ★ Critical!" : ratio <= 1 / 6 ? " ☠ Fumble!" : ""
              const color = v >= 5 ? "green" : v >= 3 ? "yellow" : "red"
              return (
                <Text color={color} bold>
                  🎲 d6 → {v}  {face}{label}
                </Text>
              )
            })()
          ) : msg.role === "timer" ? (
            /* /timer <seconds> — countdown timer */
            <Timer seconds={parseInt(msg.text, 10) || 30} />
          ) : msg.role === "progress" ? (
            /* /progress [label] — animated progress bar (live only for the latest) */
            i === lastProgressIdx
              ? <ProgressBar label={msg.text} duration={5} />
              : (
                <Text color="green" bold>
                  ✅ {msg.text} [████████████████████████████████████████] 100%
                </Text>
              )
          ) : (
            /* system messages: command output, errors, info */
            <>
              <Text color="yellow" bold>sys›</Text>
              <Text color="yellow">{msg.text}</Text>
            </>
          )}
        </Box>
      ))}
    </Box>
  )
})
