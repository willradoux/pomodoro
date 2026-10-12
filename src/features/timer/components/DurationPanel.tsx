import type { RefObject } from 'react'
import { Popover } from '../../../shared/ui/Popover'
import { DURATION_LIMITS, MODE_ORDER, MODES, type Durations, type Mode } from '../model/timer'

type Props = {
  open: boolean
  onClose: () => void
  durations: Durations
  onChange: (mode: Mode, minutes: number) => void
  anchor: RefObject<HTMLElement>
}

/** Ajuste dos minutos de foco, pausa e pausa longa. */
export function DurationPanel({ open, onClose, durations, onChange, anchor }: Props) {
  return (
    <Popover open={open} onClose={onClose} title="Tempos" anchor={anchor}>
      <div className="durations">
        {MODE_ORDER.map((m) => {
          const { min, max, step } = DURATION_LIMITS[m]
          const value = durations[m]
          const label = MODES[m].label
          return (
            <div key={m} className="duration-row" role="group" aria-label={label}>
              <span>{label}</span>
              <div className="stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  aria-label={`Diminuir ${label}`}
                  disabled={value <= min}
                  onClick={() => onChange(m, value - step)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                    <path d="M6 12h12" />
                  </svg>
                </button>
                <output className="stepper-value" aria-live="polite">
                  {value} min
                </output>
                <button
                  type="button"
                  className="stepper-btn"
                  aria-label={`Aumentar ${label}`}
                  disabled={value >= max}
                  onClick={() => onChange(m, value + step)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                    <path d="M6 12h12M12 6v12" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Popover>
  )
}
