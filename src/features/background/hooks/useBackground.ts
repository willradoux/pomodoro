import { useCallback, useRef, useState } from 'react'
import { useStored } from '../../../shared/hooks/useStored'
import { sounds } from '../../../shared/lib/sounds'
import { backgroundById, DEFAULT_BACKGROUND, type BackgroundId, type BackgroundPrefs } from '../model/backgrounds'
import { playBackgroundSound } from '../sounds'

/** Preferências do fundo (persistidas) e estado do painel de escolha. */
export function useBackground() {
  const [prefs, setPrefs] = useStored<BackgroundPrefs>('pomodoro.background', DEFAULT_BACKGROUND)
  const [panelOpen, setPanelOpen] = useState(false)
  const openRef = useRef(false)
  const anchor = useRef<HTMLDivElement>(null)

  const select = useCallback(
    (id: BackgroundId) => {
      playBackgroundSound(id)
      setPrefs((p) => ({ ...p, id }))
    },
    [setPrefs],
  )

  const setAnimate = useCallback(
    (animate: boolean) => {
      sounds.tap()
      setPrefs((p) => ({ ...p, animate }))
    },
    [setPrefs],
  )

  // ref, não o estado: X, Esc e clique fora podem chamar fechar no mesmo ciclo — toca uma vez só
  const openPanel = useCallback(() => {
    if (openRef.current) return
    openRef.current = true
    sounds.open()
    setPanelOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    if (!openRef.current) return
    openRef.current = false
    sounds.close()
    setPanelOpen(false)
  }, [])

  return {
    prefs,
    colors: backgroundById(prefs.id).colors,
    panelOpen,
    openPanel,
    closePanel,
    anchor,
    select,
    setAnimate,
  }
}
