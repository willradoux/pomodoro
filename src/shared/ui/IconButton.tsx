import { useId, useState, type ReactNode } from 'react'
import { springs } from '../lib/spring'
import { useHover } from '../hooks/useHover'
import { useSpring } from '../hooks/useSpring'
import { PressButton } from './PressButton'
import './ui.css'

type HoverMotion = 'spin' | 'pulse' | 'lift'

const TRANSFORMS: Record<HoverMotion, (h: number) => string> = {
  spin: (h) => `rotate(${-28 * h}deg) scale(${1 + 0.06 * h})`,
  pulse: (h) => `scale(${1 + 0.14 * h})`,
  lift: (h) => `translateY(${-2 * h}px) rotate(${-8 * h}deg) scale(${1 + 0.08 * h})`,
}

type Props = {
  /** nome acessível e texto do tooltip */
  label: string
  onClick: () => void
  disabled?: boolean
  pressed?: boolean
  /** definido quando o botão abre um diálogo */
  expanded?: boolean
  motion?: HoverMotion
  children: ReactNode
}

/**
 * Botão de ícone com tooltip acessível (é o próprio nome do botão; abre no hover e no foco
 * por teclado, fecha com Esc) e movimento de mola no hover do mouse.
 * Desabilitado usa `aria-disabled` para continuar focável.
 */
export function IconButton({ label, onClick, disabled = false, pressed, expanded, motion = 'lift', children }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [hovered, hover] = useHover()
  const [h] = useSpring(hovered && !disabled ? 1 : 0, springs.bouncy)

  return (
    <span className="tip-anchor">
      <PressButton
        className="icon-button"
        aria-labelledby={id}
        aria-disabled={disabled || undefined}
        aria-pressed={pressed}
        aria-haspopup={expanded === undefined ? undefined : 'dialog'}
        aria-expanded={expanded}
        onClick={() => {
          if (!disabled) onClick()
        }}
        onPointerEnter={(e) => {
          hover.onPointerEnter(e)
          if (e.pointerType === 'mouse') setOpen(true)
        }}
        onPointerLeave={() => {
          hover.onPointerLeave()
          setOpen(false)
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(':focus-visible')) setOpen(true)
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        <span className="icon-motion" style={h === 0 ? undefined : { transform: TRANSFORMS[motion](h) }}>
          {children}
        </span>
      </PressButton>
      <span role="tooltip" id={id} className="tooltip" data-open={open || undefined}>
        {label}
      </span>
    </span>
  )
}
