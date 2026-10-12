import { useCallback } from 'react'
import { usePanel } from '../../../shared/hooks/usePanel'
import { useStored } from '../../../shared/hooks/useStored'
import { sounds } from '../../../shared/lib/sounds'
import { backgroundById, DEFAULT_BACKGROUND, type BackgroundId, type BackgroundPrefs } from '../model/backgrounds'
import { playBackgroundSound } from '../sounds'

/** Preferências do fundo (persistidas) e estado do painel de escolha. */
export function useBackground() {
  const [prefs, setPrefs] = useStored<BackgroundPrefs>('pomodoro.background', DEFAULT_BACKGROUND)
  const panel = usePanel()

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

  const selected = backgroundById(prefs.id)

  return {
    prefs,
    colors: selected.colors,
    progressColor: selected.progressColor,
    panelOpen: panel.open,
    openPanel: panel.openPanel,
    closePanel: panel.closePanel,
    anchor: panel.anchor,
    select,
    setAnimate,
  }
}
