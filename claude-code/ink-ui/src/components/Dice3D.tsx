/**
 * Dice3D — animated 3D isometric dice roller for the terminal
 *
 * Renders a realistic isometric cube using box-drawing and Unicode characters,
 * showing pip (●) patterns on the three visible faces (top, front-left, right).
 * The animation cycles through random orientations before settling on the
 * final roll, creating a convincing "tumbling dice" effect.
 *
 * The dice uses a proper isometric projection with:
 *   - Slanted top face (parallelogram) with dot pips
 *   - Front face with rounded corners and proper pip layout
 *   - Right face (side) visible with perspective depth
 *   - Shadow effect at the bottom
 *
 * Key Ink APIs shown:
 *   useState / useEffect  — drive the frame-by-frame animation
 *   Text                  — coloured terminal output
 *   Box                   — layout container
 */

import React, { useEffect, useState, useMemo, useRef } from "react"
import { Box, Text } from "ink"

// ── Pip layout definitions for d6 faces ─────────────────────────────────────
// Each face value (1–6) maps to a 3×3 grid of booleans.
// true = pip present, false = empty.
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

// Right-side pip layouts (2-column layout for narrow side face)
const SIDE_PIP_LAYOUTS: Record<number, boolean[][]> = {
  1: [
    [false, false],
    [false, true ],
    [false, false],
  ],
  2: [
    [false, true ],
    [false, false],
    [true,  false],
  ],
  3: [
    [false, true ],
    [false, true ],
    [true,  false],
  ],
  4: [
    [true,  true ],
    [false, false],
    [true,  true ],
  ],
  5: [
    [true,  true ],
    [false, true ],
    [true,  true ],
  ],
  6: [
    [true,  true ],
    [true,  true ],
    [true,  true ],
  ],
}

const PIP = "●"
const PIP_DIM = "○"

// For each top-face value, define plausible (front, right) face pairs.
// These are valid orientations of a standard Western die (opposite faces sum to 7).
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
 * Build a realistic isometric 3D dice as a string array (one string per line).
 *
 * Visual layout (13 lines):
 *
 *           ╱─────────────╲
 *          ╱  ●       ●    ╲
 *         ╱       ●         ╲
 *        ╱  ●       ●    ╱   (top face with slanted perspective)
 *       ┌─────────────┐╱
 *       │             │╲
 *       │  ●   ●   ●  │ ╲
 *       │             │○ ╲
 *       │  ●   ●   ●  │○  │  (front + right side)
 *       │             │   │
 *       │  ●   ●   ●  │○  │
 *       │             │ ╱
 *       └─────────────┘╱
 *        ░░░░░░░░░░░░░░      (shadow)
 */
function buildDice3D(top: number, front: number, right: number): string[] {
  const topPips = PIP_LAYOUTS[top] ?? PIP_LAYOUTS[1]!
  const frontPips = PIP_LAYOUTS[front] ?? PIP_LAYOUTS[1]!
  const rightPips = SIDE_PIP_LAYOUTS[right] ?? SIDE_PIP_LAYOUTS[1]!

  // Front face pip rows (3 cols, spaced with 3 chars between)
  const fRow = (r: number) =>
    frontPips[r]!.map(p => p ? PIP : " ").join("   ")

  // Top face pip row (skewed for isometric look)
  const tRow = (r: number) =>
    topPips[r]!.map(p => p ? PIP : " ").join("   ")

  // Right face pip columns (2 cols per row)
  const rPip = (r: number, c: number) =>
    rightPips[r]?.[c] ? PIP_DIM : " "

  const lines: string[] = []

  // ── Top face (isometric parallelogram slanting right-to-left) ──
  lines.push(`        ╱───────────────╲`)
  lines.push(`       ╱   ${tRow(0)}   ╲`)
  lines.push(`      ╱                   ╲`)
  lines.push(`     ╱   ${tRow(1)}     ╱`)
  lines.push(`    ╱                   ╱`)
  lines.push(`   ╱   ${tRow(2)}   ╱`)

  // ── Join edge between top and front ──
  lines.push(`  ┌───────────────┐ ╱`)

  // ── Front face (3 pip rows) + right face edge ──
  lines.push(`  │               │${rPip(0, 0)} ╲`)
  lines.push(`  │  ${fRow(0)}   │${rPip(0, 1)}  │`)
  lines.push(`  │               │    │`)
  lines.push(`  │  ${fRow(1)}   │${rPip(1, 0)}  │`)
  lines.push(`  │               │${rPip(1, 1)}  │`)
  lines.push(`  │  ${fRow(2)}   │${rPip(2, 0)} ╱`)
  lines.push(`  │               │${rPip(2, 1)}╱`)
  lines.push(`  └───────────────┘╱`)

  // ── Shadow ──
  lines.push(`   ░░░░░░░░░░░░░░░░`)

  return lines
}

// ── Animation frames: "tumbling" dice ───────────────────────────────────────

const SPIN_FRAMES = 12
const SPIN_INTERVAL = 100
const SETTLE_DELAY = 300

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

export const Dice3D = React.memo(function Dice3D({ value, onComplete }: Props) {
  const finalOrientation = useMemo(() => getOrientation(value), [value])
  // Stabilize callback ref to avoid re-triggering useEffect on every render
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  // Track whether onComplete has already been called to prevent repeated fires
  const completedRef = useRef(false)

  const [state, setState] = useState<AnimState>({
    phase: "spinning",
    frameIdx: 0,
    ...getOrientation(Math.floor(Math.random() * 6) + 1),
  })

  useEffect(() => {
    if (state.phase === "spinning") {
      if (state.frameIdx >= SPIN_FRAMES) {
        const timer = setTimeout(() => {
          setState({
            phase: "settled",
            frameIdx: 0,
            ...finalOrientation,
          })
        }, SETTLE_DELAY)
        return () => clearTimeout(timer)
      }

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

    if (state.phase === "settled" && !completedRef.current) {
      completedRef.current = true
      if (onCompleteRef.current) {
        const timer = setTimeout(onCompleteRef.current, 200)
        return () => clearTimeout(timer)
      }
    }
  }, [state.phase, state.frameIdx, finalOrientation])

  const diceLines = useMemo(
    () => buildDice3D(state.top, state.front, state.right),
    [state.top, state.front, state.right],
  )
  const isSpinning = state.phase === "spinning"

  const diceColor = isSpinning
    ? "cyan"
    : value >= 5
      ? "green"
      : value >= 3
        ? "yellow"
        : "red"

  const ratio = value / 6
  const label = ratio >= 0.8 ? " ★ Critical!" : ratio <= 1 / 6 ? " ☠ Fumble!" : ""

  // Fixed height prevents layout shifts during animation and after settling.
  // 16 dice art lines + 1 marginTop + 1 status line = 18 rows.
  return (
    <Box flexDirection="column" height={18}>
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
})
