// Lógica pura do Pomodoro: sem React nem DOM, baseada em timestamps e determinística (recebe `now`).
// Só sintaxe TypeScript "apagável" (sem enum/namespace): os testes rodam com o type stripping do Node.

export type Mode = 'focus' | 'short' | 'long'
export type Status = 'idle' | 'running' | 'paused' | 'complete'

export const MODES: Record<Mode, { label: string; minutes: number }> = {
  focus: { label: 'Foco', minutes: 25 },
  short: { label: 'Pausa', minutes: 5 },
  long: { label: 'Pausa longa', minutes: 15 },
}

export const MODE_ORDER: Mode[] = ['focus', 'short', 'long']
export const LONG_EVERY = 4
export const MINUTE = 60_000

export type TimerState = {
  mode: Mode
  status: Status
  /** instante em que a sessão termina — só enquanto `running` */
  endAt: number | null
  /** ms restantes enquanto `idle`/`paused`; 0 quando `complete` */
  remaining: number
  /** total de sessões de foco concluídas (o ciclo é `completed % LONG_EVERY`) */
  completed: number
}

export const durationOf = (mode: Mode) => MODES[mode].minutes * MINUTE

export function createState(mode: Mode = 'focus', completed = 0): TimerState {
  return { mode, status: 'idle', endAt: null, remaining: durationOf(mode), completed }
}

export function remainingAt(s: TimerState, now: number): number {
  if (s.status === 'running' && s.endAt !== null) return Math.max(0, s.endAt - now)
  return s.remaining
}

/** Reiniciar ou trocar de modo agora perderia tempo de sessão? */
export function hasProgress(s: TimerState, now: number): boolean {
  if (s.status === 'running') return true
  return s.status === 'paused' && remainingAt(s, now) < durationOf(s.mode)
}

export function start(s: TimerState, now: number): TimerState {
  if (s.status !== 'idle' && s.status !== 'paused') return s
  return { ...s, status: 'running', endAt: now + s.remaining }
}

export function pause(s: TimerState, now: number): TimerState {
  if (s.status !== 'running') return s
  return { ...s, status: 'paused', endAt: null, remaining: remainingAt(s, now) }
}

export function reset(s: TimerState): TimerState {
  return createState(s.mode, s.completed)
}

/** Clicar no modo já selecionado nunca descarta uma sessão em andamento ou pausada. */
export function selectMode(s: TimerState, mode: Mode): TimerState {
  if (mode === s.mode && s.status !== 'complete') return s
  return createState(mode, s.completed)
}

/** Próxima etapa após a conclusão: pausa longa a cada LONG_EVERY focos. */
export function nextMode(s: TimerState): Mode {
  if (s.mode !== 'focus') return 'focus'
  return s.completed > 0 && s.completed % LONG_EVERY === 0 ? 'long' : 'short'
}

/** Inicia a próxima etapa — só por ação explícita. */
export function startNext(s: TimerState, now: number): TimerState {
  if (s.status !== 'complete') return s
  return start(createState(nextMode(s), s.completed), now)
}

/** Ação do botão principal e do espaço. */
export function primaryAction(s: TimerState, now: number): TimerState {
  if (s.status === 'running') return pause(s, now)
  if (s.status === 'complete') return startNext(s, now)
  return start(s, now)
}

/** Conclui a sessão se o tempo acabou. Idempotente: a conclusão (e o alarme) acontece uma vez. */
export function settle(s: TimerState, now: number): { state: TimerState; finished: boolean } {
  if (s.status !== 'running' || s.endAt === null || now < s.endAt) return { state: s, finished: false }
  return {
    state: {
      ...s,
      status: 'complete',
      endAt: null,
      remaining: 0,
      completed: s.mode === 'focus' ? s.completed + 1 : s.completed,
    },
    finished: true,
  }
}

// ---------- textos de estado ----------

/** Número da sessão de foco no ciclo atual (1..LONG_EVERY). */
export function sessionNumber(s: TimerState): number {
  const upcoming = s.mode === 'focus' && s.status !== 'complete'
  const n = upcoming ? s.completed : s.completed - 1
  return n < 0 ? 1 : (n % LONG_EVERY) + 1
}

export function statusText(s: TimerState): string {
  if (s.status === 'complete') {
    return s.mode === 'focus' ? 'Foco concluído' : s.mode === 'long' ? 'Pausa longa concluída' : 'Pausa concluída'
  }
  const n = sessionNumber(s)
  const base =
    s.mode === 'focus' ? `Sessão ${n} de ${LONG_EVERY}` : s.mode === 'short' ? `Pausa curta · ${n} de ${LONG_EVERY}` : 'Pausa longa · ciclo completo'
  return s.status === 'paused' ? `Pausado · ${base}` : base
}

export function primaryLabel(s: TimerState): string {
  if (s.status === 'running') return 'Pausar'
  if (s.status === 'paused') return 'Retomar'
  if (s.status === 'complete') {
    const next = nextMode(s)
    return next === 'focus' ? 'Iniciar foco' : next === 'long' ? 'Iniciar pausa longa' : 'Iniciar pausa'
  }
  return 'Iniciar'
}

export function formatTime(ms: number): string {
  const s = Math.ceil(Math.max(0, ms) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// ---------- desfazer ----------

/**
 * Estado que o "Desfazer" restaura após uma ação destrutiva: o atual, se tem progresso;
 * senão o snapshot pendente (trocar de modo várias vezes seguidas não perde a sessão original).
 */
export function undoSnapshot(current: TimerState, pending: TimerState | null, now: number): TimerState | null {
  return hasProgress(current, now) ? current : pending
}

// ---------- persistência ----------

export const STORAGE_KEY = 'pomodoro.session.v1'

export function serialize(s: TimerState): string {
  return JSON.stringify(s)
}

const isMode = (v: unknown): v is Mode => typeof v === 'string' && v in MODES
const isStatus = (v: unknown): v is Status => v === 'idle' || v === 'running' || v === 'paused' || v === 'complete'
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

/**
 * Recupera a sessão salva; dados inválidos viram um estado novo. Uma sessão que expirou com a
 * página fechada é concluída aqui, em silêncio, e o estado salvo passa a ser `complete` (não conta duas vezes).
 */
export function restore(raw: string | null, now: number): { state: TimerState; finishedWhileAway: boolean } {
  let data: Partial<TimerState> | null = null
  try {
    data = raw ? (JSON.parse(raw) as Partial<TimerState>) : null
  } catch {
    data = null
  }
  if (!data || !isMode(data.mode) || !isStatus(data.status) || !isCount(data.completed) || !isCount(data.remaining)) {
    return { state: createState(), finishedWhileAway: false }
  }

  const duration = durationOf(data.mode)
  const completed = Math.floor(data.completed)
  // estados válidos voltam idênticos (serialize ∘ restore = identidade): evita eco entre abas
  const remaining = data.status === 'complete' ? 0 : Math.min(data.remaining, duration)
  let state: TimerState

  if (data.status === 'running') {
    if (!isCount(data.endAt)) return { state: createState(data.mode, completed), finishedWhileAway: false }
    // relógio do sistema mudou: nunca mais que uma sessão inteira pela frente
    const endAt = Math.min(data.endAt, now + duration)
    state = { mode: data.mode, status: 'running', endAt, remaining, completed }
  } else {
    state = { mode: data.mode, status: data.status, endAt: null, remaining, completed }
  }

  const settled = settle(state, now)
  return { state: settled.state, finishedWhileAway: settled.finished }
}
