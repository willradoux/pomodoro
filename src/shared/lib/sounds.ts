// Sons de interface sintetizados com WebAudio: sem arquivos, latência zero.

type Wave = OscillatorType

const RING_NOTES = [783.99, 987.77, 1174.66, 1567.98]

class SoundKit {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  muted = false

  private get audio() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.6
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return { ctx: this.ctx, out: this.master! }
  }

  /** Executa uma composição de sons, respeitando o mudo e falhas de áudio. */
  play(fn: () => void) {
    if (this.muted) return
    try {
      fn()
    } catch {
      /* áudio indisponível */
    }
  }

  note(freq: number, at: number, dur: number, gain: number, type: Wave = 'sine') {
    const { ctx, out } = this.audio
    const t = ctx.currentTime + at
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(gain, t + 0.006)
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(env).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  /** Nota que desliza entre alturas, abafada por um passa-baixa. */
  glide(from: number, to: number, at: number, dur: number, gain: number, type: Wave = 'triangle') {
    const { ctx, out } = this.audio
    const t = ctx.currentTime + at
    const osc = ctx.createOscillator()
    const lp = ctx.createBiquadFilter()
    const env = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, t)
    osc.frequency.exponentialRampToValueAtTime(to, t + dur)
    lp.type = 'lowpass'
    lp.frequency.value = 1400
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(gain, t + 0.02)
    env.gain.setValueAtTime(gain, t + dur * 0.6)
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(lp).connect(env).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  /** Nota com um parcial agudo: timbre de vidro. */
  bell(freq: number, at: number, dur: number, gain: number) {
    this.note(freq, at, dur, gain)
    this.note(freq * 4.01, at, dur * 0.25, gain * 0.18)
  }

  click(at = 0, gain = 0.25, freq = 2400) {
    const { ctx, out } = this.audio
    const t = ctx.currentTime + at
    const len = Math.floor(ctx.sampleRate * 0.012)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq
    bp.Q.value = 1.2
    const env = ctx.createGain()
    env.gain.value = gain
    src.connect(bp).connect(env).connect(out)
    src.start(t)
  }

  tap = () => this.play(() => this.click(0, 0.22))
  select = () => this.play(() => this.click(0, 0.18, 3200))

  start = () =>
    this.play(() => {
      this.click(0, 0.15)
      this.bell(659.25, 0.01, 0.35, 0.12)
      this.bell(987.77, 0.09, 0.5, 0.1)
    })

  pause = () =>
    this.play(() => {
      this.click(0, 0.15)
      this.bell(987.77, 0.01, 0.3, 0.1)
      this.bell(659.25, 0.08, 0.45, 0.1)
    })

  stop = () => this.play(() => this.bell(440, 0, 0.4, 0.12))

  /** Abrir um painel: clique e duas notas subindo. */
  open = () =>
    this.play(() => {
      this.click(0, 0.16, 2800)
      this.note(880, 0, 0.12, 0.08)
      this.note(1318.5, 0.05, 0.14, 0.06)
    })

  /** Fechar: o espelho do abrir, descendo. */
  close = () =>
    this.play(() => {
      this.click(0, 0.14, 2000)
      this.note(1046.5, 0, 0.1, 0.07)
      this.note(784, 0.05, 0.14, 0.06)
    })

  /** Um toque do alarme: arpejo ascendente de sinos. */
  ring = () => this.play(() => RING_NOTES.forEach((f, i) => this.bell(f, i * 0.12, 1.2, 0.14)))

  unmuted = () => {
    this.muted = false
    this.play(() => this.bell(1318.5, 0, 0.3, 0.08))
  }
}

export const sounds = new SoundKit()
