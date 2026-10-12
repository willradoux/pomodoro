import { useEffect, useRef, useState } from 'react'
import { useSpring } from '../../../shared/hooks/useSpring'
import { springs } from '../../../shared/lib/spring'

/** Dígito que rola ao mudar: o novo desce de cima, o antigo sai por baixo. */
function Digit({ ch }: { ch: string }) {
  const [prev, setPrev] = useState(ch)
  const last = useRef(ch)
  const [p, spring] = useSpring(0, springs.snappy)

  useEffect(() => {
    if (ch === last.current) return
    setPrev(last.current)
    last.current = ch
    spring.from(1)
  }, [ch, spring])

  return (
    <span className="digit">
      <span style={{ transform: `translateY(${-p * 100}%)`, opacity: 1 - p }}>{ch}</span>
      {p > 0.001 && <span style={{ transform: `translateY(${(1 - p) * 100}%)`, opacity: p }}>{prev}</span>}
    </span>
  )
}

export function Digits({ value }: { value: string }) {
  return (
    <div className="digits" role="timer" aria-live="off" aria-label={value}>
      {value.split('').map((ch, i) =>
        ch === ':' ? (
          <span key={i} className="colon">
            :
          </span>
        ) : (
          <Digit key={i} ch={ch} />
        ),
      )}
    </div>
  )
}
