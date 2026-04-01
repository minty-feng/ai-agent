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

export type Message = {
  role: "user" | "assistant"
  text: string
}

type Props = {
  messages: Message[]
}

export function MessageList({ messages }: Props) {
  if (messages.length === 0) {
    return <Text dimColor>No messages yet — type something below.</Text>
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
          ) : (
            <>
              <Text color="magenta" bold>ai› </Text>
              <Text color="white">{msg.text}</Text>
            </>
          )}
        </Box>
      ))}
    </Box>
  )
}
