import { useCallback, useEffect, useRef, useState } from 'react'
import { usePanel } from '../../../shared/hooks/usePanel'
import { useStored } from '../../../shared/hooks/useStored'
import { sounds } from '../../../shared/lib/sounds'
import type { TimerRingHandle } from '../components/TimerRing'
import type { Toast } from '../components/UndoToast'
import { primaryAction, reset, selectMode, setDuration, undoSnapshot, type Mode, type TimerState } from '../model/timer'
import { setFavicon } from '../favicon'
import { askNotificationPermission, notify } from '../notifications'
import { useAlarm } from './useAlarm'
import { useTimer } from './useTimer'

/** Controles que já tratam o espaço por conta própria: o atalho não interfere neles. */
const HANDLES_SPACE =
  'button, a[href], input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="radio"], [role="checkbox"], [role="switch"], [role="slider"], [role="textbox"], [role="dialog"]'

type UndoToast = Toast & { snapshot: TimerState }

/**
 * Orquestra a sessão: ações do usuário, alarme, sons, "Desfazer" e atalhos de teclado.
 * Ações que descartam progresso não pedem confirmação — oferecem "Desfazer".
 */
export function usePomodoro() {
  const [soundOn, setSoundOn] = useStored('pomodoro.sound', true)
  const ring = useRef<TimerRingHandle>(null)
  const [toast, setToast] = useState<UndoToast | null>(null)
  const toastRef = useRef(toast)
  toastRef.current = toast
  const durationsPanel = usePanel()

  useEffect(() => {
    sounds.muted = !soundOn
  }, [soundOn])

  const { start: startAlarm, stop: stopAlarm, ringing } = useAlarm(sounds.ring)

  const onFinish = useCallback(
    (mode: Mode) => {
      startAlarm()
      ring.current?.pulse()
      notify(mode === 'focus' ? 'Foco concluído. Hora de uma pausa.' : 'Pausa concluída. Pronto para focar?')
    },
    [startAlarm],
  )

  const { state, current, run, replace } = useTimer(onFinish)

  useEffect(() => setFavicon(state.status === 'running'), [state.status])

  const applyGuarded = useCallback(
    (message: string, fn: (s: TimerState, now: number) => TimerState) => {
      const before = current()
      const snapshot = undoSnapshot(before, toastRef.current?.snapshot ?? null, Date.now())
      const after = run(fn)
      if (after === before) return false
      if (snapshot) setToast({ id: Date.now(), message, snapshot })
      return true
    },
    [current, run],
  )

  const primary = useCallback(() => {
    stopAlarm()
    if (current().status === 'running') sounds.pause()
    else {
      sounds.start()
      askNotificationPermission()
      setToast(null)
    }
    run(primaryAction)
  }, [current, run, stopAlarm])

  const resetSession = useCallback(() => {
    stopAlarm()
    if (applyGuarded('Sessão reiniciada', (s) => reset(s))) sounds.stop()
  }, [applyGuarded, stopAlarm])

  const changeMode = useCallback(
    (mode: Mode) => {
      stopAlarm()
      if (applyGuarded('Sessão descartada', (s) => selectMode(s, mode))) sounds.select()
      else sounds.tap() // modo já selecionado: só confirma o clique
    },
    [applyGuarded, stopAlarm],
  )

  const undo = useCallback(() => {
    const t = toastRef.current
    if (!t) return
    stopAlarm()
    sounds.tap()
    replace(t.snapshot)
    setToast(null)
  }, [replace, stopAlarm])

  const dismissToast = useCallback(() => setToast(null), [])

  const changeDuration = useCallback(
    (mode: Mode, minutes: number) => {
      sounds.select()
      run((s) => setDuration(s, mode, minutes))
    },
    [run],
  )

  const toggleSound = useCallback(() => {
    if (soundOn) {
      stopAlarm()
      sounds.tap()
    } else sounds.unmuted()
    setSoundOn(!soundOn)
  }, [soundOn, setSoundOn, stopAlarm])

  // espaço inicia/pausa; Esc silencia o alarme
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ringing) {
        stopAlarm()
        return
      }
      if (e.key !== ' ' || e.repeat || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest(HANDLES_SPACE)) return
      e.preventDefault()
      primary()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [primary, ringing, stopAlarm])

  return {
    state,
    ring,
    soundOn,
    toast,
    durationsPanel,
    primary,
    resetSession,
    changeMode,
    changeDuration,
    undo,
    dismissToast,
    toggleSound,
  }
}
