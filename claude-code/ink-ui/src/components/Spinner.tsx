/**
 * Spinner — animated loading indicator
 *
 * Learned from claude-code: it has a dedicated Spinner component
 * (src/components/Spinner/) that uses Ink's useEffect + useState to
 * cycle through frames, exactly like this.
 *
 * Key Ink APIs shown:
 *   Text  — renders coloured terminal text
 *   useEffect / useState — standard React hooks, work identically in Ink
 */

import React, { useEffect, useState } from "react"
import { Text } from "ink"

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
const INTERVAL_MS = 80

type Props = {
  label?: string
}

export function Spinner({ label = "Thinking…" }: Props) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <Text color="cyan">
      {FRAMES[frame]} {label}
    </Text>
  )
}
