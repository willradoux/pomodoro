import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const RINGS = 5
const INTERVAL_MS = 1800
const RING_TAIL_MS = 1400

/** Alarme que toca `RINGS` vezes e para sozinho; `stop()` interrompe antes. */
export function useAlarm(onRing: () => void) {
  const timers = useRef<number[]>([])
  const ringRef = useRef(onRing)
  ringRef.current = onRing
  const [ringing, setRinging] = useState(false)

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setRinging(false)
  }, [])

  const start = useCallback(() => {
    stop()
    setRinging(true)
    for (let i = 0; i < RINGS; i++) {
      timers.current.push(window.setTimeout(() => ringRef.current(), i * INTERVAL_MS))
    }
    timers.current.push(window.setTimeout(() => setRinging(false), (RINGS - 1) * INTERVAL_MS + RING_TAIL_MS))
  }, [stop])

  useEffect(() => stop, [stop])

  return useMemo(() => ({ start, stop, ringing }), [start, stop, ringing])
}
