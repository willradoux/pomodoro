import { useEffect, useState } from 'react'

/** useState persistido no localStorage; sem storage (modo privado), funciona só em memória. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage bloqueado */
    }
  }, [key, value])

  return [value, setValue] as const
}
