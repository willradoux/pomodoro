import { springs } from '../../lib/spring'
import { useSpring } from '../../hooks/useSpring'

export function SpeakerIcon({ on, size = 20 }: { on: boolean; size?: number }) {
  const [w] = useSpring(on ? 1 : 0, springs.bouncy)
  // a onda externa atrasa em relação à interna: sensação de propagação
  const [w2] = useSpring(on ? 1 : 0, springs.gentle)

  const wave = (v: number) => ({
    opacity: Math.max(0, Math.min(1, v)),
    transform: `translateX(${(1 - v) * -3}px) scale(${0.6 + 0.4 * v})`,
    transformOrigin: '11px 12px',
    transformBox: 'view-box' as const,
  })

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" fill="currentColor" />
      <path d="M15 9a4 4 0 0 1 0 6" style={wave(w)} />
      <path d="M17.5 6.5a7.5 7.5 0 0 1 0 11" style={wave(w2)} />
      <path d="M3.5 3.5l17 17" pathLength={1} strokeDasharray={1} strokeDashoffset={Math.max(0, Math.min(1, w))} />
    </svg>
  )
}
