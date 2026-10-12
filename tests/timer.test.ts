import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createState,
  durationOf,
  formatTime,
  hasProgress,
  MINUTE,
  nextMode,
  pause,
  primaryAction,
  primaryLabel,
  remainingAt,
  reset,
  restore,
  selectMode,
  serialize,
  sessionNumber,
  settle,
  start,
  startNext,
  statusText,
  undoSnapshot,
  type TimerState,
} from '../src/features/timer/model/timer.ts'

const T0 = 1_700_000_000_000

/** Roda uma sessão de foco inteira e conclui. */
function finishFocus(s: TimerState, now: number) {
  const running = start(s, now)
  return settle(running, now + durationOf('focus')).state
}

test('iniciar, pausar e retomar usam timestamps sem perder precisão', () => {
  let s = start(createState(), T0)
  assert.equal(remainingAt(s, T0 + 10_000), 25 * MINUTE - 10_000)

  s = pause(s, T0 + 10_000)
  assert.equal(s.status, 'paused')
  // o tempo não corre enquanto pausado
  assert.equal(remainingAt(s, T0 + 999_999), 25 * MINUTE - 10_000)

  s = start(s, T0 + 60_000)
  assert.equal(s.endAt, T0 + 60_000 + 25 * MINUTE - 10_000)
})

test('conclusão acontece uma única vez e só conta sessões de foco', () => {
  const running = start(createState(), T0)
  assert.equal(settle(running, T0 + 1000).finished, false)

  const first = settle(running, T0 + durationOf('focus'))
  assert.equal(first.finished, true)
  assert.equal(first.state.status, 'complete')
  assert.equal(first.state.completed, 1)

  // idempotente: nada de conclusão (nem alarme) duplicada
  const again = settle(first.state, T0 + durationOf('focus') + 5000)
  assert.equal(again.finished, false)
  assert.equal(again.state.completed, 1)

  const brk = settle(start(createState('short', 1), T0), T0 + durationOf('short')).state
  assert.equal(brk.completed, 1)
})

test('pausa longa a cada quatro focos, e a próxima etapa nunca começa sozinha', () => {
  let s = createState()
  const seen: string[] = []
  for (let i = 0; i < 4; i++) {
    s = finishFocus(s, T0)
    assert.equal(s.status, 'complete', 'para em "concluído" esperando ação')
    seen.push(nextMode(s))
    s = startNext(s, T0) // inicia a pausa
    s = settle(s, T0 + durationOf(s.mode)).state
    s = startNext(s, T0) // volta ao foco
    s = pause(s, T0)
    s = reset(s)
  }
  assert.deepEqual(seen, ['short', 'short', 'short', 'long'])
})

test('startNext só funciona a partir de "concluído"', () => {
  const idle = createState()
  assert.equal(startNext(idle, T0), idle)
  const done = finishFocus(idle, T0)
  const next = startNext(done, T0 + 1)
  assert.equal(next.mode, 'short')
  assert.equal(next.status, 'running')
})

test('clicar no modo atual não reinicia sessão em andamento ou pausada', () => {
  const running = start(createState(), T0)
  assert.equal(selectMode(running, 'focus'), running)
  const paused = pause(running, T0 + 5000)
  assert.equal(selectMode(paused, 'focus'), paused)

  const switched = selectMode(paused, 'short')
  assert.equal(switched.mode, 'short')
  assert.equal(switched.status, 'idle')
  assert.equal(switched.remaining, durationOf('short'))
})

test('reiniciar preserva o progresso do ciclo', () => {
  const s = reset(pause(start(createState('focus', 3), T0), T0 + 1000))
  assert.equal(s.completed, 3)
  assert.equal(s.status, 'idle')
  assert.equal(s.remaining, durationOf('focus'))
})

test('hasProgress e undoSnapshot protegem só o que tem progresso', () => {
  const idle = createState()
  const running = start(idle, T0)
  const pausedAtStart = pause(running, T0)
  const pausedMid = pause(running, T0 + 1000)

  assert.equal(hasProgress(idle, T0), false)
  assert.equal(hasProgress(running, T0), true)
  assert.equal(hasProgress(pausedAtStart, T0), false)
  assert.equal(hasProgress(pausedMid, T0), true)

  assert.equal(undoSnapshot(running, null, T0), running)
  // trocar de novo a partir de um estado sem progresso mantém o snapshot original
  assert.equal(undoSnapshot(idle, running, T0), running)
  assert.equal(undoSnapshot(idle, null, T0), null)
})

test('ação principal: iniciar → pausar → retomar → próxima etapa', () => {
  let s = primaryAction(createState(), T0)
  assert.equal(s.status, 'running')
  s = primaryAction(s, T0 + 1000)
  assert.equal(s.status, 'paused')
  s = primaryAction(s, T0 + 2000)
  assert.equal(s.status, 'running')
  s = settle(s, T0 + 2 * durationOf('focus')).state
  assert.equal(primaryLabel(s), 'Iniciar pausa')
  s = primaryAction(s, T0)
  assert.equal(s.mode, 'short')
  assert.equal(s.status, 'running')
})

test('textos de estado e numeração da sessão', () => {
  assert.equal(statusText(createState()), 'Sessão 1 de 4')
  assert.equal(statusText(createState('focus', 5)), 'Sessão 2 de 4')
  const paused = pause(start(createState('focus', 1), T0), T0 + 1000)
  assert.equal(statusText(paused), 'Pausado · Sessão 2 de 4')

  const done = finishFocus(createState('focus', 1), T0)
  assert.equal(sessionNumber(done), 2)
  assert.equal(statusText(done), 'Foco concluído')
  assert.equal(statusText(createState('short', 2)), 'Pausa curta · 2 de 4')
  assert.equal(statusText(createState('long', 4)), 'Pausa longa · ciclo completo')

  const afterLong = finishFocus(createState('focus', 3), T0)
  assert.equal(primaryLabel(afterLong), 'Iniciar pausa longa')
})

test('formatTime arredonda para cima e nunca fica negativo', () => {
  assert.equal(formatTime(25 * MINUTE), '25:00')
  assert.equal(formatTime(1), '00:01')
  assert.equal(formatTime(59_001), '01:00')
  assert.equal(formatTime(-50), '00:00')
})

test('persistência: retoma sessão em andamento após recarregar', () => {
  const running = start(createState('focus', 2), T0)
  const { state, finishedWhileAway } = restore(serialize(running), T0 + 60_000)
  assert.equal(finishedWhileAway, false)
  assert.equal(state.status, 'running')
  assert.equal(remainingAt(state, T0 + 60_000), 24 * MINUTE)
  assert.equal(state.completed, 2)
})

test('persistência: sessão pausada volta pausada com o mesmo tempo', () => {
  const paused = pause(start(createState(), T0), T0 + 90_000)
  const { state } = restore(serialize(paused), T0 + 10 * MINUTE)
  assert.equal(state.status, 'paused')
  assert.equal(state.remaining, 25 * MINUTE - 90_000)
})

test('persistência: sessão expirada conclui uma vez, em silêncio, sem duplicar', () => {
  const running = start(createState('focus', 0), T0)
  const later = T0 + 2 * durationOf('focus')

  const first = restore(serialize(running), later)
  assert.equal(first.finishedWhileAway, true)
  assert.equal(first.state.status, 'complete')
  assert.equal(first.state.completed, 1)

  // recarregar de novo a partir do estado salvo não conclui de novo
  const second = restore(serialize(first.state), later + 1000)
  assert.equal(second.finishedWhileAway, false)
  assert.equal(second.state.completed, 1)
})

test('persistência: salvar e restaurar devolve exatamente o mesmo estado (sem eco entre abas)', () => {
  const states = [
    createState(),
    start(createState('short', 2), T0),
    pause(start(createState('long', 4), T0), T0 + 30_000),
    settle(start(createState(), T0), T0 + durationOf('focus')).state,
  ]
  for (const s of states) {
    const raw = serialize(s)
    assert.equal(serialize(restore(raw, T0 + 1000).state), raw)
  }
})

test('persistência: dados inválidos ou corrompidos viram estado novo', () => {
  for (const raw of [null, '', '{', '"x"', '{"mode":"nap","status":"idle","remaining":1,"completed":0}', '{"mode":"focus","status":"running","remaining":0,"completed":0}']) {
    const { state } = restore(raw, T0)
    assert.equal(state.status, 'idle', `raw=${raw}`)
  }
})

test('persistência: relógio adiantado não gera sessão maior que a duração', () => {
  const tampered = { ...start(createState(), T0), endAt: T0 + 10 * 60 * MINUTE }
  const { state } = restore(JSON.stringify(tampered), T0)
  assert.equal(remainingAt(state, T0), durationOf('focus'))
})
