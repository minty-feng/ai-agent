/**
 * RainbowText — render text with each character in a different hue
 *
 * Demonstrates:
 * • Mapping characters to Ink <Text color> elements
 * • Using chalk.hex() indirectly via Ink's color prop (Ink accepts hex strings)
 * • HSL → hex conversion for evenly-spaced hues
 *
 * Key Ink APIs shown:
 *   Box flexDirection="row"  — lays characters out horizontally
 *   Text color="#rrggbb"     — Ink accepts CSS hex colors directly
 */

import React from "react"
import { Box, Text } from "ink"

// Standard HSL → CSS hex conversion (no external deps)
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, "0")
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

type Props = {
  text: string
  /** Starting hue offset (0–360, default 0) */
  offset?: number
  saturation?: number
  lightness?: number
}

export function RainbowText({ text, offset = 0, saturation = 100, lightness = 60 }: Props) {
  const chars = [...text]  // spread handles multi-byte Unicode correctly
  return (
    <Box flexDirection="row" flexWrap="wrap">
      {chars.map((ch, i) => {
        const hue = (offset + Math.floor((i / Math.max(chars.length - 1, 1)) * 360)) % 360
        return (
          <Text key={i} color={hslToHex(hue, saturation, lightness)}>
            {ch}
          </Text>
        )
      })}
    </Box>
  )
}
