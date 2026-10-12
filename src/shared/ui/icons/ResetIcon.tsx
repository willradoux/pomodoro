import { forwardRef, useImperativeHandle } from 'react'
import { springs } from '../../lib/spring'
import { useSpring } from '../../hooks/useSpring'

export type ResetIconHandle = { spin: () => void }

/** Seta circular; `spin()` dá uma volta para trás com mola. */
export const ResetIcon = forwardRef<ResetIconHandle, { size?: number }>(function ResetIcon({ size = 22 }, ref) {
  const [angle, spring] = useSpring(0, springs.bouncy)

  useImperativeHandle(ref, () => ({
    spin: () => {
      spring.from(spring.x + 360)
      spring.set(0)
    },
  }))

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: `rotate(${angle}deg)` }}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4 4v4h4" />
    </svg>
  )
})
