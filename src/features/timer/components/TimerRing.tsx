import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion'
import { useSpring } from '../../../shared/hooks/useSpring'
import { clamp, springs } from '../../../shared/lib/spring'

export type TimerRingHandle = { pulse: () => void }

type Props = {
  /** fração restante (1 → 0) */
  fraction: number
  /** > 0: desliza em linha reta até `fraction` nesse tempo; 0: salto */
  glideMs: number
}

const R = 46
const C = 2 * Math.PI * R

/**
 * Anel de progresso sem render por frame: o React define o alvo uma vez por segundo e a
 * transição CSS linear faz o movimento contínuo. Saltos grandes usam uma curva curta.
 */
export const TimerRing = forwardRef<TimerRingHandle, Props>(function TimerRing({ fraction, glideMs }, ref) {
  const reduced = useReducedMotion()
  const [scale, pulse] = useSpring(1, springs.gentle)
  useImperativeHandle(ref, () => ({ pulse: () => pulse.kick(0.9) }), [pulse])

  const prev = useRef(fraction)
  const jump = Math.abs(fraction - prev.current) > 0.004
  useEffect(() => {
    prev.current = fraction
  })

  const f = clamp(fraction, 0, 1)
  const transition = reduced
    ? 'none'
    : glideMs > 0
      ? `stroke-dashoffset ${glideMs}ms linear`
      : jump
        ? 'stroke-dashoffset 600ms var(--ease-out)'
        : 'none'

  return (
    <div className="ring" aria-hidden style={scale === 1 ? undefined : { transform: `scale(${scale})` }}>
      <svg viewBox="0 0 100 100">
        <circle className="ring-track" cx="50" cy="50" r={R} />
        <circle
          className="ring-arc"
          cx="50"
          cy="50"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - f)}
          style={{ transition, opacity: f > 0.001 ? 1 : 0 }}
        />
      </svg>
    </div>
  )
})
