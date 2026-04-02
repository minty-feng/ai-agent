/**
 * Header — animated cycling-color title bar
 *
 * Demonstrates Ink's useEffect + setInterval pattern:
 * The header color cycles through the rainbow every 500ms,
 * giving the TUI a lively feel without any external animation lib.
 *
 * Now uses the shared useAnimationTick hook (100 ms base tick) so its
 * updates land in the same React render as Spinner, ProgressBar, and any
 * other animated component — one terminal redraw per tick instead of one
 * per component.
 *
 * The animation still stops after a few cycles (MAX_CYCLES ticks) because
 * once the index is capped the computed color no longer changes, Ink sees
 * identical output and skips the redraw for this component automatically.
 *
 * Key Ink APIs shown:
 *   useEffect / useState — standard React hooks, identical to web React
 *   Text bold color      — coloured terminal text
 */

import React from "react"
import { Box, Text } from "ink"
import { useAnimationTick } from "../hooks/useAnimationTick.js"

// Cycle through 6 hues for a rainbow-shift effect
const CYCLE_COLORS = ["green", "cyan", "blue", "magenta", "red", "yellow"] as const
type CycleColor = (typeof CYCLE_COLORS)[number]

// Stop cycling after this many ticks (3 full rotations × 6 colors × 100 ms = 1.8 s)
const MAX_CYCLES = CYCLE_COLORS.length * 3

export function Header() {
  const tick = useAnimationTick()
  // Cap at MAX_CYCLES so the color settles; after that every tick produces
  // the same output and Ink skips the terminal redraw for this component.
  const idx = Math.min(tick, MAX_CYCLES - 1)
  const color: CycleColor = CYCLE_COLORS[idx % CYCLE_COLORS.length]!

  return (
    <Box>
      <Text bold color={color}>✦ ink-ui-demo</Text>
      <Text dimColor>  ·  React + Ink TUI  ·  /help for commands  ·  Ctrl-C to quit</Text>
    </Box>
  )
}
