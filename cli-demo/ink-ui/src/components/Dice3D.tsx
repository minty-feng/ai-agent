/**
 * Dice3D — animated 3D isometric dice roller for the terminal
 *
 * Renders a true isometric cube using box-drawing and Unicode characters,
 * showing pip (●) patterns on the three visible faces (top, front, right).
 * The animation cycles through random orientations before settling on the
 * final roll, creating a convincing "tumbling dice" effect.
 *
 * Key Ink APIs shown:
 *   useState / useEffect  — drive the frame-by-frame animation
 *   Text                  — coloured terminal output
 *   Box                   — layout container
 */

import React, { useEffect, useState, useMemo } from "react"
import { Box, Text } from "ink"

// ── Pip layout definitions for d6 faces ─────────────────────────────────────
// Each face value (1–6) maps to a 3×3 grid of booleans.
// true = pip present, false = empty.
// Grid rows are top-to-bottom, columns are left-to-right.
type PipGrid = boolean[][]

const PIP_LAYOUTS: Record<number, PipGrid> = {
  1: [
    [false, false, false],
    [false, true,  false],
    [false, false, false],
  ],
  2: [
    [false, false, true ],
    [false, false, false],
    [true,  false, false],
  ],
  3: [
    [false, false, true ],
    [false, true,  false],
    [true,  false, false],
  ],
  4: [
    [true,  false, true ],
    [false, false, false],
    [true,  false, true ],
  ],
  5: [
    [true,  false, true ],
    [false, true,  false],
    [true,  false, true ],
  ],
  6: [
    [true,  false, true ],
    [true,  false, true ],
    [true,  false, true ],
  ],
}

// ── 3D Isometric Dice Renderer ──────────────────────────────────────────────
// Renders an isometric cube with pips on the three visible faces.
//
// The cube looks like:
//        ╱‾‾‾‾‾‾‾‾‾╲
//       ╱  TOP FACE  ╲
//      ╱─────────────╲│
//     │               ││
//     │  FRONT FACE   ││ Right
//     │               ││ Face
//     │               ││
//      ╲─────────────╱│
//       ╲           ╱
//

const PIP_CHAR = "●"

// For each top-face value, define plausible (front, right) face pairs.
// These are valid orientations of a standard Western die.
const ORIENTATIONS: Record<number, [number, number][]> = {
  1: [[2, 3], [3, 5], [5, 4], [4, 2]],
  2: [[1, 3], [3, 6], [6, 4], [4, 1]],
  3: [[1, 5], [5, 6], [6, 2], [2, 1]],
  4: [[1, 2], [2, 6], [6, 5], [5, 1]],
  5: [[1, 4], [4, 6], [6, 3], [3, 1]],
  6: [[2, 4], [4, 5], [5, 3], [3, 2]],
}

function getOrientation(top: number): { top: number; front: number; right: number } {
  const pairs = ORIENTATIONS[top] ?? [[2, 3]]
  const [front, right] = pairs[Math.floor(Math.random() * pairs.length)]!
  return { top, front, right }
}

/**
 * Build the full isometric 3D dice as a string array (one string per line).
 */
function buildDice3D(top: number, front: number, right: number): string[] {
  const topPips = PIP_LAYOUTS[top] ?? PIP_LAYOUTS[1]!
  const frontPips = PIP_LAYOUTS[front] ?? PIP_LAYOUTS[1]!

  // Front face pip rows (3 rows × 3 cols)
  const fRows = frontPips.map(row =>
    row.map(p => p ? PIP_CHAR : " ").join("   ")
  )

  // Top face pip rows
  const tRows = topPips.map(row =>
    row.map(p => p ? PIP_CHAR : " ").join("   ")
  )

  const lines: string[] = []

  // ── Top face (isometric parallelogram) ──
  lines.push(`         ╭─────────────╮`)
  lines.push(`        ╱   ${tRows[0]}   ╱│`)
  lines.push(`       ╱     ${tRows[1]}     ╱ │`)
  lines.push(`      ╱   ${tRows[2]}   ╱  │`)
  lines.push(`     ├─────────────┤   │`)

  // ── Front face + Right face edge ──
  lines.push(`     │   ${fRows[0]}   │   │`)
  lines.push(`     │             │  ╱`)
  lines.push(`     │   ${fRows[1]}   │ ╱`)
  lines.push(`     │             │╱`)
  lines.push(`     │   ${fRows[2]}   │`)
  lines.push(`     ╰─────────────╯`)

  return lines
}

// ── Animation frames: "tumbling" dice ───────────────────────────────────────
// During the spin, we show random face orientations cycling rapidly.

const SPIN_FRAMES = 12      // number of intermediate frames
const SPIN_INTERVAL = 100   // ms between spin frames
const SETTLE_DELAY = 300    // ms pause before showing final result

type AnimState = {
  phase: "spinning" | "settled"
  frameIdx: number
  top: number
  front: number
  right: number
}

type Props = {
  /** The final rolled value (1–6) */
  value: number
  /** Called when animation completes */
  onComplete?: () => void
}

export function Dice3D({ value, onComplete }: Props) {
  const finalOrientation = useMemo(() => getOrientation(value), [value])

  const [state, setState] = useState<AnimState>({
    phase: "spinning",
    frameIdx: 0,
    // Start with a random orientation
    ...getOrientation(Math.floor(Math.random() * 6) + 1),
  })

  useEffect(() => {
    if (state.phase === "spinning") {
      if (state.frameIdx >= SPIN_FRAMES) {
        // Transition to settled
        const timer = setTimeout(() => {
          setState({
            phase: "settled",
            frameIdx: 0,
            ...finalOrientation,
          })
        }, SETTLE_DELAY)
        return () => clearTimeout(timer)
      }

      // Show next random frame — speed slows down toward the end
      const delay = SPIN_INTERVAL + state.frameIdx * 20
      const timer = setTimeout(() => {
        const randTop = Math.floor(Math.random() * 6) + 1
        const o = getOrientation(randTop)
        setState(prev => ({
          ...prev,
          frameIdx: prev.frameIdx + 1,
          ...o,
        }))
      }, delay)
      return () => clearTimeout(timer)
    }

    // Phase === settled: call onComplete
    if (state.phase === "settled" && onComplete) {
      const timer = setTimeout(onComplete, 200)
      return () => clearTimeout(timer)
    }
  }, [state.phase, state.frameIdx, finalOrientation, onComplete])

  const diceLines = buildDice3D(state.top, state.front, state.right)
  const isSpinning = state.phase === "spinning"

  // Color: spinning = cyan (motion), settled = bright green/yellow based on value
  const diceColor = isSpinning
    ? "cyan"
    : value >= 5
      ? "green"
      : value >= 3
        ? "yellow"
        : "red"

  const ratio = value / 6
  const label = ratio >= 0.8 ? " ★ Critical!" : ratio <= 1 / 6 ? " ☠ Fumble!" : ""

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {diceLines.map((line, i) => (
          <Text key={i} color={diceColor} bold={!isSpinning}>
            {line}
          </Text>
        ))}
      </Box>
      {state.phase === "settled" && (
        <Box marginTop={1}>
          <Text bold color={diceColor}>
            🎲 结果: {value}  (d6){label}
          </Text>
        </Box>
      )}
      {isSpinning && (
        <Box marginTop={1}>
          <Text color="cyan" dimColor>
            🎲 掷骰子中...
          </Text>
        </Box>
      )}
    </Box>
  )
}
