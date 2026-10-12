// Mola amortecida: F = -k(x - alvo) - c·v, integrada com sub-passos para ficar estável em qualquer frame rate.

export type SpringConfig = {
  stiffness: number
  damping: number
  mass?: number
}

export const springs = {
  snappy: { stiffness: 520, damping: 34 },
  bouncy: { stiffness: 380, damping: 14 },
  gentle: { stiffness: 160, damping: 22 },
} satisfies Record<string, SpringConfig>

const REST_DELTA = 0.0005
const REST_SPEED = 0.005
const SUBSTEPS = 4

export class Spring {
  x: number
  v = 0
  target: number
  config: SpringConfig
  /** movimento reduzido: tudo vira salto instantâneo, inclusive kick()/from() */
  instant = false
  private raf = 0
  private last = 0
  private onUpdate: (x: number) => void

  constructor(initial: number, config: SpringConfig, onUpdate: (x: number) => void) {
    this.x = initial
    this.target = initial
    this.config = config
    this.onUpdate = onUpdate
  }

  set(target: number) {
    if (this.instant) return this.jump(target)
    this.target = target
    this.start()
  }

  /** Impulso de velocidade (pulsos). */
  kick(velocity: number) {
    if (this.instant) return
    this.v += velocity
    this.start()
  }

  /** Parte de `x` e assenta no alvo atual. */
  from(x: number) {
    if (this.instant) return this.jump(this.target)
    this.x = x
    this.v = 0
    this.onUpdate(x)
    this.start()
  }

  jump(x: number) {
    this.stop()
    this.x = this.target = x
    this.v = 0
    this.onUpdate(x)
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private start() {
    if (this.raf) return
    this.last = 0
    this.raf = requestAnimationFrame(this.step)
  }

  private step = (t: number) => {
    const dt = this.last ? Math.min((t - this.last) / 1000, 1 / 30) : 1 / 60
    this.last = t

    const { stiffness, damping, mass = 1 } = this.config
    const h = dt / SUBSTEPS
    for (let i = 0; i < SUBSTEPS; i++) {
      const force = -stiffness * (this.x - this.target) - damping * this.v
      this.v += (force / mass) * h
      this.x += this.v * h
    }

    if (Math.abs(this.v) < REST_SPEED && Math.abs(this.x - this.target) < REST_DELTA) {
      this.x = this.target
      this.v = 0
      this.raf = 0
      this.onUpdate(this.x)
      return
    }

    this.onUpdate(this.x)
    this.raf = requestAnimationFrame(this.step)
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max))
