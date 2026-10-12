import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useSpring } from '../../../shared/hooks/useSpring'
import { rovingIndex } from '../../../shared/lib/keyboard'
import { springs } from '../../../shared/lib/spring'
import { MODES, type Mode } from '../model/timer'

/**
 * Controle segmentado Foco · Pausa (radio group ARIA, roving tabindex) com "thumb" que desliza com mola.
 * A pausa longa não tem botão próprio: entra sozinha no ciclo e, enquanto dura, o segmento de pausa mostra "Pausa longa".
 */
export function ModePicker({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const segments: Mode[] = ['focus', value === 'long' ? 'long' : 'short']
  const active = value === 'focus' ? 0 : 1
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const [box, setBox] = useState({ x: 0, w: 0 })
  const [x, xSpring] = useSpring(box.x, springs.bouncy)
  const [w, wSpring] = useSpring(box.w, springs.snappy)
  const placed = useRef(false)

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[active]
      if (!el) return
      // primeira medição posiciona direto: o thumb não "cresce" do zero ao carregar
      if (!placed.current) {
        xSpring.jump(el.offsetLeft)
        wSpring.jump(el.offsetWidth)
        placed.current = true
      }
      setBox({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    // re-mede quando a fonte carrega ou o rótulo muda ("Pausa" ↔ "Pausa longa")
    const ro = new ResizeObserver(measure)
    refs.current.forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [active, xSpring, wSpring])

  const onKeyDown = (e: KeyboardEvent) => {
    const next = rovingIndex(e.key, active, segments.length)
    if (next < 0) return
    e.preventDefault()
    refs.current[next]?.focus()
    onChange(segments[next])
  }

  return (
    <div className="segmented surface" role="radiogroup" aria-label="Modo" onKeyDown={onKeyDown}>
      {box.w > 0 && <span className="segmented-thumb" aria-hidden style={{ transform: `translateX(${x}px)`, width: w }} />}
      {segments.map((m, i) => (
        <button
          key={i}
          type="button"
          ref={(el) => (refs.current[i] = el)}
          role="radio"
          aria-checked={i === active}
          tabIndex={i === active ? 0 : -1}
          className={'segment' + (i === active ? ' is-active' : '')}
          onClick={() => onChange(m)}
        >
          {MODES[m].label}
        </button>
      ))}
    </div>
  )
}
