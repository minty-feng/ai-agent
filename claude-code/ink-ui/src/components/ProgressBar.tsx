/**
 * ProgressBar — animated progress bar with percentage
 *
 * Demonstrates:
 *   • Simulated async task progress using useEffect + setTimeout
 *   • Dynamic terminal-width-aware rendering via useStdout
 *   • Color transitions based on completion percentage
 */

import React, { useEffect, useState, useRef } from "react"
import { Box, Text, useStdout } from "ink"

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

  const [progress, setProgress] = useState(0)
  // Stabilize callback ref to avoid re-triggering useEffect on every render
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const steps = 50
    const interval = (duration * 1000) / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      const p = Math.min(step / steps, 1)
      setProgress(p)
      if (step >= steps) {
        clearInterval(timer)
        onCompleteRef.current?.()
      }
    }, interval)

    return () => clearInterval(timer)
  }, [duration])

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
