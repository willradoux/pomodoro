import { lerp, springs } from '../../lib/spring'
import { useSpring } from '../../hooks/useSpring'

type Pt = [number, number]
type Quad = [Pt, Pt, Pt, Pt] // TL, TR, BR, BL

// Morph clássico: cada barra do "pause" vira uma metade do triângulo do "play".
// O traço grosso com junções redondas dá volume e cantos macios às formas.
const PAUSE: [Quad, Quad] = [
  [[7, 6.5], [8.5, 6.5], [8.5, 17.5], [7, 17.5]],
  [[15.5, 6.5], [17, 6.5], [17, 17.5], [15.5, 17.5]],
]
const PLAY: [Quad, Quad] = [
  [[8.5, 6.5], [13.25, 9.25], [13.25, 14.75], [8.5, 17.5]],
  [[13.25, 9.25], [18, 12], [18, 12], [13.25, 14.75]],
]

const toPath = (a: Quad, b: Quad, t: number) =>
  'M' + a.map(([x, y], i) => `${lerp(x, b[i][0], t).toFixed(2)} ${lerp(y, b[i][1], t).toFixed(2)}`).join('L') + 'Z'

/** Tamanho definido pelo CSS (`.play-icon`). */
export function PlayPauseIcon({ playing }: { playing: boolean }) {
  // t = 0 → pause, t = 1 → play
  const [t] = useSpring(playing ? 0 : 1, springs.bouncy)

  return (
    <svg className="play-icon" viewBox="0 0 24 24" aria-hidden>
      <g fill="currentColor" stroke="currentColor" strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round">
        <path d={toPath(PAUSE[0], PLAY[0], t)} />
        <path d={toPath(PAUSE[1], PLAY[1], t)} />
      </g>
    </svg>
  )
}
