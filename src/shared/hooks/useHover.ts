import { useMemo, useState, type PointerEvent } from 'react'

/** Hover só de mouse (no toque, "hover" fica preso depois do tap). */
export function useHover() {
  const [hovered, setHovered] = useState(false)
  const handlers = useMemo(
    () => ({
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setHovered(true)
      },
      onPointerLeave: () => setHovered(false),
    }),
    [],
  )
  return [hovered, handlers] as const
}
