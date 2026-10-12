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
  setDuration,
  sessionNumber,
  settle,
  start,
  startNext,
  statusText,
  undoSnapshot,
  type TimerState,
} from '../src/features/timer/model/timer.ts'

const T0 = 1_700_000_000_000

/** Duração padrão de um modo, em ms. */
const D = (mode: 'focus' | 'short' | 'long') => durationOf(createState(), mode)

/** Roda uma sessão de foco inteira e conclui. */
function finishFocus(s: TimerState, now: number) {
  const running = start(s, now)
  return settle(running, now + D('focus')).state
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

  const first = settle(running, T0 + D('focus'))
  assert.equal(first.finished, true)
  assert.equal(first.state.status, 'complete')
  assert.equal(first.state.completed, 1)

  // idempotente: nada de conclusão (nem alarme) duplicada
  const again = settle(first.state, T0 + D('focus') + 5000)
  assert.equal(again.finished, false)
  assert.equal(again.state.completed, 1)

  const brk = settle(start(createState('short', 1), T0), T0 + D('short')).state
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
    s = settle(s, T0 + durationOf(s)).state
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
  assert.equal(switched.remaining, D('short'))
})

test('reiniciar preserva o progresso do ciclo', () => {
  const s = reset(pause(start(createState('focus', 3), T0), T0 + 1000))
  assert.equal(s.completed, 3)
  assert.equal(s.status, 'idle')
  assert.equal(s.remaining, D('focus'))
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
  s = settle(s, T0 + 2 * D('focus')).state
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
  const later = T0 + 2 * D('focus')

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
    settle(start(createState(), T0), T0 + D('focus')).state,
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
  assert.equal(remainingAt(state, T0), D('focus'))
})

test('tempos personalizados: foco de 50 min vale para o timer, a persistência e o ciclo', () => {
  let s = setDuration(createState(), 'focus', 50)
  assert.equal(s.durations.focus, 50)
  assert.equal(s.remaining, 50 * MINUTE, 'parado no foco: o tempo exibido acompanha')

  s = start(s, T0)
  assert.equal(remainingAt(s, T0 + MINUTE), 49 * MINUTE)

  // a troca de modo e o reinício respeitam as durações escolhidas
  assert.equal(selectMode(s, 'short').remaining, 5 * MINUTE)
  assert.equal(reset(setDuration(createState('short'), 'short', 10)).remaining, 10 * MINUTE)

  const done = settle(s, T0 + 50 * MINUTE).state
  const brk = startNext(setDuration(done, 'short', 8), T0)
  assert.equal(remainingAt(brk, T0), 8 * MINUTE)

  const { state } = restore(serialize(brk), T0 + 1000)
  assert.deepEqual(state.durations, { focus: 50, short: 8, long: 15 })
})

test('tempos personalizados: sessão em andamento não é cortada', () => {
  const running = start(createState(), T0)
  const changed = setDuration(running, 'focus', 50)
  assert.equal(changed.endAt, running.endAt)
  assert.equal(changed.durations.focus, 50)
  assert.equal(reset(changed).remaining, 50 * MINUTE, 'a próxima sessão já usa o novo tempo')
  // o anel continua medindo a sessão atual de 25 min, não os 50 novos
  assert.equal(changed.total, 25 * MINUTE)
  const { state } = restore(serialize(pause(changed, T0 + MINUTE)), T0 + 2 * MINUTE)
  assert.equal(state.total, 25 * MINUTE)
  assert.equal(state.durations.focus, 50)
})

test('tempos personalizados: limites e valores inválidos', () => {
  assert.equal(setDuration(createState(), 'focus', 500).durations.focus, 120)
  assert.equal(setDuration(createState(), 'short', 0).durations.short, 1)
  const same = createState()
  assert.equal(setDuration(same, 'focus', 25), same, 'mesmo valor não cria estado novo')

  // salvo sem durações (versão antiga) ou com valores inválidos: volta ao padrão sem perder a sessão
  const legacy = JSON.stringify({ mode: 'focus', status: 'paused', endAt: null, remaining: 60_000, completed: 2 })
  const { state } = restore(legacy, T0)
  assert.equal(state.status, 'paused')
  assert.deepEqual(state.durations, { focus: 25, short: 5, long: 15 })
  const weird = JSON.stringify({ ...createState(), durations: { focus: 999, short: 'x', long: 30 } })
  assert.deepEqual(restore(weird, T0).state.durations, { focus: 25, short: 5, long: 30 })
})
