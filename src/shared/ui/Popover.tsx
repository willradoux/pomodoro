import { useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { clamp } from '../lib/spring'
import './popover.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  /** elemento ao lado do qual o painel abre */
  anchor: RefObject<HTMLElement>
  children: ReactNode
}

const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"])'
const GAP = 12
const MARGIN = 16

/**
 * Diálogo flutuante: abre à direita da âncora (acima, se não couber). Foco entra no painel,
 * Tab fica preso nele, Esc ou clique fora fecha e o foco volta para quem abriu.
 */
export function Popover({ open, onClose, title, anchor, children }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const a = anchor.current?.getBoundingClientRect()
      const el = panel.current
      if (!a || !el) return
      const w = el.offsetWidth
      const h = el.offsetHeight
      const vw = window.innerWidth
      const vh = window.innerHeight
      let left: number
      let top: number
      if (a.right + GAP + w <= vw - MARGIN) {
        el.dataset.side = 'right'
        left = a.right + GAP
        top = clamp(a.top - 6, MARGIN, vh - h - MARGIN) // abre para baixo, sem cobrir o card
      } else {
        el.dataset.side = 'top'
        left = clamp(a.left + a.width / 2 - w / 2, MARGIN, vw - w - MARGIN)
        top = Math.max(MARGIN, a.top - GAP - h)
      }
      el.style.left = `${Math.round(left)}px`
      el.style.top = `${Math.round(top)}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, anchor])

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement | null
      panel.current?.focus()
    } else if (opener.current) {
      opener.current.focus()
      opener.current = null
    }
  }, [open])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panel.current) return
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <div className="panel-scrim" data-open={open || undefined} onPointerDown={onClose} aria-hidden />
      <div
        ref={panel}
        className="panel surface"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        data-open={open || undefined}
        onKeyDown={onKeyDown}
      >
        <header className="panel-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="panel-close" aria-label="Fechar" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        {children}
      </div>
    </>
  )
}
