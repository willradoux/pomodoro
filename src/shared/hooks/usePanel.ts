import { useCallback, useRef, useState } from 'react'
import { sounds } from '../lib/sounds'

/** Estado de um painel flutuante: abrir/fechar com som e a âncora onde ele aparece. */
export function usePanel() {
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const anchor = useRef<HTMLDivElement>(null)

  // ref, não o estado: X, Esc e clique fora podem fechar no mesmo ciclo — toca uma vez só
  const openPanel = useCallback(() => {
    if (openRef.current) return
    openRef.current = true
    sounds.open()
    setOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    if (!openRef.current) return
    openRef.current = false
    sounds.close()
    setOpen(false)
  }, [])

  return { open, openPanel, closePanel, anchor }
}
