/**
 * StatusBar — bottom status line
 *
 * Learned from claude-code: src/components/PromptInput/ renders a footer
 * showing the current model, token cost, and permission mode.
 *
 * Key Ink APIs shown:
 *   Box with justifyContent="space-between"  — spreads children across width
 *   Text dimColor                            — muted/hint text
 */

import React from "react"
import { Box, Text, useStdout } from "ink"

type Props = {
  model: string
  tokenCount: number
}

export function StatusBar({ model, tokenCount }: Props) {
  const { stdout } = useStdout()
  const width = stdout?.columns ?? 80

  return (
    <Box width={width} justifyContent="space-between" borderStyle="single" borderColor="gray">
      <Text dimColor> model: {model}</Text>
      <Text dimColor>tokens: {tokenCount} </Text>
    </Box>
  )
}
