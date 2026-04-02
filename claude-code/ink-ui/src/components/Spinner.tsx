/**
 * Spinner — animated loading indicator
 *
 * Learned from claude-code: it has a dedicated Spinner component
 * (src/components/Spinner/) that uses Ink's useEffect + useState to
 * cycle through frames, exactly like this.
 *
 * Now uses the shared useAnimationTick hook so it updates in the same
 * render cycle as every other animated component, eliminating the jitter
 * caused by the old 80 ms independent setInterval firing out-of-sync
 * with Dice3D (100 ms), Header (500 ms), and ProgressBar (variable).
 *
 * Key Ink APIs shown:
 *   Text  — renders coloured terminal text
 */

import React from "react"
import { Text } from "ink"
import { useAnimationTick } from "../hooks/useAnimationTick.js"

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

type Props = {
  label?: string
}

export function Spinner({ label = "Thinking…" }: Props) {
  const tick = useAnimationTick()
  const frame = tick % FRAMES.length

  return (
    <Text color="cyan">
      {FRAMES[frame]} {label}
    </Text>
  )
}
