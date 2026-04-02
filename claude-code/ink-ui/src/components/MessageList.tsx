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

import React from "react"
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
}

export function MessageList({ messages }: Props) {
  if (messages.length === 0) {
    return <Text dimColor>No messages yet — type something below, or /help for commands.</Text>
  }

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
            /* /dice3d — 3D animated dice roll */
            <Dice3D value={parseInt(msg.text, 10) || 1} />
          ) : msg.role === "timer" ? (
            /* /timer <seconds> — countdown timer */
            <Timer seconds={parseInt(msg.text, 10) || 30} />
          ) : msg.role === "progress" ? (
            /* /progress [label] — animated progress bar */
            <ProgressBar label={msg.text} duration={5} />
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
}
