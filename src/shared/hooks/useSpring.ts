import { useEffect, useRef, useState } from 'react'
import { Spring, springs, type SpringConfig } from '../lib/spring'
import { useReducedMotion } from './useReducedMotion'

/**
 * Valor que persegue `target` com física de mola. Retorna [valor, spring];
 * o spring expõe `kick()`/`from()` imperativos, que também respeitam movimento reduzido.
 * Use configs estáveis (os presets de `springs`).
 */
export function useSpring(target: number, config: SpringConfig = springs.snappy) {
  const [value, setValue] = useState(target)
  const ref = useRef<Spring | null>(null)
  if (!ref.current) ref.current = new Spring(target, config, setValue)
  const spring = ref.current
  // no render, para valer também para chamadas imperativas no mesmo ciclo
  spring.instant = useReducedMotion()

  useEffect(() => {
    spring.config = config
    spring.set(target)
  }, [spring, target, config, spring.instant])

  useEffect(() => () => spring.stop(), [spring])

  return [value, spring] as const
}
