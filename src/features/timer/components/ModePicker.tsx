import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useSpring } from '../../../shared/hooks/useSpring'
import { rovingIndex } from '../../../shared/lib/keyboard'
import { springs } from '../../../shared/lib/spring'
import { MODE_ORDER, MODES, type Mode } from '../model/timer'

/** Controle segmentado (radio group ARIA, roving tabindex) com "thumb" que desliza com mola. */
export function ModePicker({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const refs = useRef<Record<Mode, HTMLButtonElement | null>>({ focus: null, short: null, long: null })
  const [box, setBox] = useState({ x: 0, w: 0 })
  const [x, xSpring] = useSpring(box.x, springs.bouncy)
  const [w, wSpring] = useSpring(box.w, springs.snappy)
  const placed = useRef(false)

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value]
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
    // re-mede quando a fonte carrega ou o layout muda
    const ro = new ResizeObserver(measure)
    Object.values(refs.current).forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [value, xSpring, wSpring])

  const onKeyDown = (e: KeyboardEvent) => {
    const next = rovingIndex(e.key, MODE_ORDER.indexOf(value), MODE_ORDER.length)
    if (next < 0) return
    e.preventDefault()
    const mode = MODE_ORDER[next]
    refs.current[mode]?.focus()
    onChange(mode)
  }

  return (
    <div className="segmented surface" role="radiogroup" aria-label="Modo" onKeyDown={onKeyDown}>
      {box.w > 0 && <span className="segmented-thumb" aria-hidden style={{ transform: `translateX(${x}px)`, width: w }} />}
      {MODE_ORDER.map((m) => (
        <button
          key={m}
          type="button"
          ref={(el) => (refs.current[m] = el)}
          role="radio"
          aria-checked={value === m}
          tabIndex={value === m ? 0 : -1}
          className={'segment' + (value === m ? ' is-active' : '')}
          onClick={() => onChange(m)}
        >
          {MODES[m].label}
        </button>
      ))}
    </div>
  )
}
