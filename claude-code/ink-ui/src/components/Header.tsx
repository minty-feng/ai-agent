/**
 * Header — animated cycling-color title bar
 *
 * Demonstrates Ink's useEffect + setInterval pattern:
 * The header color cycles through the rainbow every 500ms,
 * giving the TUI a lively feel without any external animation lib.
 *
 * Key Ink APIs shown:
 *   useEffect / useState — standard React hooks, identical to web React
 *   Text bold color      — coloured terminal text
 */

import React, { useEffect, useState } from "react"
import { Box, Text } from "ink"

// Cycle through 6 hues for a rainbow-shift effect
const CYCLE_COLORS = ["green", "cyan", "blue", "magenta", "red", "yellow"] as const
type CycleColor = (typeof CYCLE_COLORS)[number]

const CYCLE_MS = 500

export function Header() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % CYCLE_COLORS.length), CYCLE_MS)
    return () => clearInterval(t)
  }, [])

  const color: CycleColor = CYCLE_COLORS[idx]!

  return (
    <Box>
      <Text bold color={color}>✦ ink-ui-demo</Text>
      <Text dimColor>  ·  React + Ink TUI  ·  /help for commands  ·  Ctrl-C to quit</Text>
    </Box>
  )
}
