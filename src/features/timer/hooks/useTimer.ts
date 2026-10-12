import { useCallback, useEffect, useRef, useState } from 'react'
import { restore, serialize, settle, STORAGE_KEY, type Mode, type TimerState } from '../model/timer'

function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Estado do timer em React, sobre o modelo puro.
 * Só re-renderiza em transições; a conclusão é agendada para o `endAt` exato e reconferida
 * quando a aba volta ao foco. Persiste no localStorage e sincroniza entre abas.
 */
export function useTimer(onFinish: (mode: Mode) => void) {
  const [state, setState] = useState(() => restore(readSaved(), Date.now()).state)
  const ref = useRef(state)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  const commit = useCallback((next: TimerState) => {
    ref.current = next
    setState(next)
  }, [])

  const current = useCallback(() => ref.current, [])

  const run = useCallback(
    (fn: (s: TimerState, now: number) => TimerState) => {
      const next = fn(ref.current, Date.now())
      if (next !== ref.current) commit(next)
      return next
    },
    [commit],
  )

  // `settle` é idempotente e o ref muda na hora: conclui no máximo uma vez
  const check = useCallback(() => {
    const { state: next, finished } = settle(ref.current, Date.now())
    if (!finished) return
    commit(next)
    finishRef.current(next.mode)
  }, [commit])

  useEffect(() => {
    if (state.status !== 'running' || state.endAt === null) return
    const id = window.setTimeout(check, Math.max(0, state.endAt - Date.now()) + 5)
    return () => clearTimeout(id)
  }, [state, check])

  // timers atrasam com a aba em segundo plano ou o computador suspenso
  useEffect(() => {
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [check])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serialize(state))
    } catch {
      /* storage bloqueado: segue sem persistir */
    }
  }, [state])

  // outra aba mudou a sessão: adota em silêncio, sem alarme duplicado
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === serialize(ref.current)) return
      commit(restore(e.newValue, Date.now()).state)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [commit])

  return { state, current, run, replace: commit }
}
