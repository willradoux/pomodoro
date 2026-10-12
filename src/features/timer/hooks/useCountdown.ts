import { useEffect, useState } from 'react'
import { remainingAt, type TimerState } from '../model/timer'

type Tick = {
  ms: number
  /** tempo restante na próxima virada de segundo */
  nextMs: number
  /** ms até essa virada (0 quando parado) */
  stepMs: number
}

function measure(state: TimerState, now: number): Tick {
  const ms = remainingAt(state, now)
  if (state.status !== 'running' || ms <= 0) return { ms, nextMs: ms, stepMs: 0 }
  const stepMs = ms % 1000 || 1000
  return { ms, nextMs: ms - stepMs, stepMs }
}

/** Contagem local ao mostrador: um render por segundo, alinhado à virada do segundo. */
export function useCountdown(state: TimerState) {
  const [tick, setTick] = useState(() => measure(state, Date.now()))

  useEffect(() => {
    let id = 0
    const loop = () => {
      const t = measure(state, Date.now())
      setTick(t)
      if (t.stepMs > 0) id = window.setTimeout(loop, t.stepMs + 8)
    }
    loop()
    return () => clearTimeout(id)
  }, [state])

  return tick
}
