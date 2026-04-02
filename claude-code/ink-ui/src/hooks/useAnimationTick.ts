/**
 * useAnimationTick — unified global animation tick
 *
 * Problem this solves:
 *   Each animated component (Spinner, Header, ProgressBar, Dice3D) used its
 *   own independent setInterval with a different period (80 ms, 500 ms, …).
 *   Because they fired at different times, Ink had to redraw the terminal
 *   separately for each update, leading to jitter and occasional visual
 *   corruption where content appeared to "disappear".
 *
 * Solution:
 *   A module-level singleton interval fires every TICK_MS milliseconds and
 *   notifies all subscriber components synchronously in a single forEach loop.
 *   React 18's automatic batching collapses every resulting setState call in
 *   that loop into ONE render pass, so Ink performs a single terminal redraw
 *   per tick instead of one per component.
 *
 * Usage:
 *   const tick = useAnimationTick()   // monotonically increasing integer
 *   const frame = tick % FRAMES.length
 */

import { useEffect, useState } from "react"

/** Base interval shared by all animated components (10 fps). */
export const TICK_MS = 100

// ── Module-level singleton ────────────────────────────────────────────────────
let currentTick = 0
const listeners = new Set<() => void>()
let timerId: ReturnType<typeof setInterval> | null = null

function ensureLoop(): void {
  if (timerId !== null) return
  timerId = setInterval(() => {
    currentTick++
    // Notify all subscribers synchronously — React 18 batches these setState
    // calls into a single render so Ink issues one terminal redraw per tick.
    listeners.forEach((fn) => fn())
  }, TICK_MS)
}

function stopLoop(): void {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/** Returns a monotonically increasing tick counter (increments every TICK_MS). */
export function useAnimationTick(): number {
  const [tick, setTick] = useState(currentTick)

  useEffect(() => {
    const handler = () => setTick(currentTick)
    listeners.add(handler)
    ensureLoop()
    return () => {
      listeners.delete(handler)
      if (listeners.size === 0) stopLoop()
    }
  }, [])

  return tick
}
