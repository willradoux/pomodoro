import { useMemo, useState } from 'react'
import { springs } from '../lib/spring'
import { useSpring } from './useSpring'

/** Botão que "afunda" ao pressionar e volta com um quique leve. */
export function usePress(depth = 0.94) {
  const [pressed, setPressed] = useState(false)
  const [scale] = useSpring(pressed ? depth : 1, pressed ? springs.snappy : springs.bouncy)

  const handlers = useMemo(
    () => ({
      onPointerDown: () => setPressed(true),
      onPointerUp: () => setPressed(false),
      onPointerLeave: () => setPressed(false),
      onPointerCancel: () => setPressed(false),
    }),
    [],
  )

  return { scale, handlers }
}
