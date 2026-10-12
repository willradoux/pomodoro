import { useId, useRef, type KeyboardEvent, type RefObject } from 'react'
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion'
import { rovingIndex } from '../../../shared/lib/keyboard'
import { Popover } from '../../../shared/ui/Popover'
import { BACKGROUNDS, type BackgroundId } from '../model/backgrounds'

type Props = {
  open: boolean
  onClose: () => void
  value: BackgroundId
  onChange: (id: BackgroundId) => void
  animate: boolean
  onAnimateChange: (animate: boolean) => void
  anchor: RefObject<HTMLElement>
}

/** Escolha da paleta do fundo e da animação. */
export function BackgroundPanel({ open, onClose, value, onChange, animate, onAnimateChange, anchor }: Props) {
  const swatches = useRef<HTMLDivElement>(null)
  const animId = useId()
  const reduced = useReducedMotion()

  const onSwatchKey = (e: KeyboardEvent) => {
    const next = rovingIndex(e.key, BACKGROUNDS.findIndex((b) => b.id === value), BACKGROUNDS.length)
    if (next < 0) return
    e.preventDefault()
    const { id } = BACKGROUNDS[next]
    onChange(id)
    swatches.current?.querySelector<HTMLElement>(`[data-bg="${id}"]`)?.focus()
  }

  return (
    <Popover open={open} onClose={onClose} title="Fundo" anchor={anchor}>
      <div ref={swatches} className="swatches" role="radiogroup" aria-label="Cor do fundo" onKeyDown={onSwatchKey}>
        {BACKGROUNDS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            data-bg={b.id}
            aria-checked={value === b.id}
            tabIndex={value === b.id ? 0 : -1}
            className="swatch"
            onClick={() => onChange(b.id)}
          >
            <span
              className="swatch-preview"
              style={{ background: `linear-gradient(135deg, ${b.colors[0]}, ${b.colors[2]} 55%, ${b.colors[1]})` }}
            />
            <span className="swatch-label">{b.label}</span>
          </button>
        ))}
      </div>

      <div className="panel-row">
        <span id={animId}>Animação</span>
        <button
          type="button"
          role="switch"
          className="switch"
          aria-labelledby={animId}
          aria-checked={animate && !reduced}
          disabled={reduced}
          onClick={() => onAnimateChange(!animate)}
        >
          <span className="switch-knob" />
        </button>
      </div>
      {reduced && <p className="panel-note">Desligada porque o sistema está com “reduzir movimento”.</p>}
    </Popover>
  )
}
