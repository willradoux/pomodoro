import { useId, useState, type ReactNode } from 'react'
import { useHover } from '../hooks/useHover'
import { useSpring } from '../hooks/useSpring'
import { sounds } from '../lib/sounds'
import { springs } from '../lib/spring'
import './ui.css'

type Props = {
  href: string
  /** nome acessível e texto do tooltip */
  label: string
  className?: string
  children: ReactNode
}

/** Link externo só de ícone, com o mesmo tooltip e movimento de hover dos botões de ícone. */
export function IconLink({ href, label, className = '', children }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [hovered, hover] = useHover()
  const [h] = useSpring(hovered ? 1 : 0, springs.bouncy)

  return (
    <span className={`tip-anchor ${className}`}>
      <a
        className="icon-button"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-labelledby={id}
        onClick={sounds.tap}
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
        <span
          className="icon-motion"
          style={h === 0 ? undefined : { transform: `translateY(${-2 * h}px) rotate(${-8 * h}deg) scale(${1 + 0.08 * h})` }}
        >
          {children}
        </span>
      </a>
      <span role="tooltip" id={id} className="tooltip tooltip-left" data-open={open || undefined}>
        {label}
      </span>
    </span>
  )
}
