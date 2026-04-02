/**
 * Timer — countdown / stopwatch component
 *
 * Demonstrates:
 *   • useEffect + setInterval for real-time updates
 *   • useApp().exit() not needed — timer stays inline
 *   • Box + Text with dynamic color based on remaining time
 */

import React, { useEffect, useState } from "react"
import { Box, Text } from "ink"

type Props = {
  /** Total seconds for countdown (0 = stopwatch mode) */
  seconds: number
  /** Called when countdown reaches zero */
  onComplete?: () => void
}

function formatTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

const CLOCK_FRAMES = ["🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛"]

export function Timer({ seconds, onComplete }: Props) {
  const isCountdown = seconds > 0
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    const timer = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (isCountdown && next >= seconds) {
          setDone(true)
          onComplete?.()
          clearInterval(timer)
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [done, seconds, isCountdown, onComplete])

  const display = isCountdown ? seconds - elapsed : elapsed
  const clockIdx = elapsed % CLOCK_FRAMES.length
  const remaining = isCountdown ? seconds - elapsed : 0

  const color = done
    ? "green"
    : isCountdown && remaining <= 5
      ? "red"
      : isCountdown && remaining <= 15
        ? "yellow"
        : "cyan"

  // Progress bar for countdown mode
  const barWidth = 20
  const progress = isCountdown ? Math.min(elapsed / seconds, 1) : 0
  const filled = Math.round(progress * barWidth)
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled)

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={color}>{CLOCK_FRAMES[clockIdx]}</Text>
        <Text color={color} bold>
          {done ? "⏰ 时间到!" : isCountdown ? "倒计时" : "秒表"}
        </Text>
        <Text color={color} bold>
          {formatTime(Math.max(0, display))}
        </Text>
      </Box>
      {isCountdown && !done && (
        <Box>
          <Text color={color}> [{bar}] {Math.round(progress * 100)}%</Text>
        </Box>
      )}
    </Box>
  )
}
