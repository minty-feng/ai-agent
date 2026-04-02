/**
 * ProgressBar — animated progress bar with percentage
 *
 * Demonstrates:
 *   • Simulated async task progress driven by the shared animation tick
 *   • Dynamic terminal-width-aware rendering via useStdout
 *   • Color transitions based on completion percentage
 *
 * Previously used its own setInterval with a duration-dependent period
 * (duration × 1000 / 50 ms per step).  Now it subscribes to the shared
 * useAnimationTick hook (100 ms base) so its state updates are batched in
 * the same React render as Spinner and Header — one Ink redraw per tick.
 *
 * Progress is computed from elapsed ticks since mount:
 *   totalTicks = duration * 10   (10 ticks per second at 100 ms/tick)
 *   progress   = elapsedTicks / totalTicks
 */

import React, { useRef, useEffect } from "react"
import { Box, Text, useStdout } from "ink"
import { useAnimationTick } from "../hooks/useAnimationTick.js"

type Props = {
  /** Label to show next to the bar */
  label: string
  /** Duration in seconds for the simulated task */
  duration: number
  /** Called when progress reaches 100% */
  onComplete?: () => void
}

export function ProgressBar({ label, duration, onComplete }: Props) {
  const { stdout } = useStdout()
  const termWidth = stdout?.columns ?? 80
  const barWidth = Math.min(40, termWidth - 30)

  const tick = useAnimationTick()

  // Record the global tick value at mount time so we can compute elapsed ticks.
  // Initialized directly from the tick at first render — useRef(initialValue)
  // only evaluates the argument once, so this is safe and avoids side effects
  // in the render function.
  const startTickRef = useRef(tick)

  // Stabilize callback ref to avoid re-triggering useEffect on every render
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const completedRef = useRef(false)

  const totalTicks = duration * 10  // 100 ms per tick → 10 ticks per second
  const elapsedTicks = tick - startTickRef.current
  const progress = Math.min(elapsedTicks / totalTicks, 1)

  useEffect(() => {
    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true
      onCompleteRef.current?.()
    }
  }, [progress])

  const filled = Math.round(progress * barWidth)
  const empty = barWidth - filled
  const pct = Math.round(progress * 100)

  const color = pct >= 100 ? "green" : pct >= 60 ? "cyan" : pct >= 30 ? "yellow" : "red"

  const PHASES = ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"]
  const fullBlocks = "█".repeat(filled)
  const partialIdx = Math.floor((progress * barWidth - filled) * PHASES.length)
  const partial = partialIdx > 0 && empty > 0 ? PHASES[partialIdx] ?? "" : ""
  const emptyBlocks = "░".repeat(Math.max(0, empty - (partial ? 1 : 0)))

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={color} bold>{pct >= 100 ? "✅" : "⏳"}</Text>
        <Text color={color}>{label}</Text>
      </Box>
      <Box>
        <Text color={color}> [{fullBlocks}{partial}{emptyBlocks}] {pct}%</Text>
      </Box>
    </Box>
  )
}
