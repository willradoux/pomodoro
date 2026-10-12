import { useEffect, useRef, type ReactNode } from 'react'
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion'
import { createGradientRenderer, hexToRgb, type RGB } from '../gl/gradient'

const RENDER_SCALE = 0.35 // degradê suave: ampliar de ~1/3 da resolução é invisível
const FRAME_MS = 1000 / 30
const COLOR_FADE_MS = 600
const TIME_OFFSET = 6 // parado, congela num ponto bonito da animação

type Props = {
  colors: [string, string, string]
  animate: boolean
  /** fundo exibido sem WebGL ou até o primeiro quadro */
  fallback: ReactNode
}

/**
 * Degradê fluido em WebGL a 30 fps e baixa resolução, com granulado em camada separada
 * (resolução nativa). Parado quando a animação está desligada; troca de cor com transição.
 */
export function GradientBackground({ colors, animate, fallback }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const moving = animate && !reduced

  const current = useRef<RGB[]>(colors.map(hexToRgb))
  const redraw = useRef<(() => void) | null>(null)
  const colorsDirty = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current!
    const renderer = createGradientRenderer(canvas)
    if (!renderer) return

    const start = performance.now()
    colorsDirty.current = true
    const draw = (now = performance.now()) => {
      renderer.resize(
        Math.max(1, Math.round(canvas.clientWidth * RENDER_SCALE)),
        Math.max(1, Math.round(canvas.clientHeight * RENDER_SCALE)),
      )
      if (colorsDirty.current) {
        renderer.setColors(current.current)
        colorsDirty.current = false
      }
      renderer.draw(moving ? TIME_OFFSET + (now - start) / 1000 : TIME_OFFSET)
    }
    redraw.current = draw

    // revela o canvas só depois do primeiro quadro e então tira o fundo de reserva
    draw(start)
    canvas.style.opacity = '1'
    const fallbackEl = fallbackRef.current
    if (fallbackEl) fallbackEl.style.opacity = '0'
    const hideFallback = window.setTimeout(() => fallbackEl && (fallbackEl.style.display = 'none'), 700)

    const ro = new ResizeObserver(() => draw())
    ro.observe(canvas)

    let raf = 0
    if (moving) {
      let last = 0
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        if (now - last < FRAME_MS) return
        last = now
        draw(now)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      redraw.current = null
      clearTimeout(hideFallback)
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [moving])

  // troca de paleta: interpola as cores (instantâneo com movimento reduzido)
  const key = colors.join()
  useEffect(() => {
    const from = current.current.map((c) => [...c] as RGB)
    const to = colors.map(hexToRgb)
    const apply = (next: RGB[]) => {
      current.current = next
      colorsDirty.current = true
      redraw.current?.()
    }
    if (reduced) return apply(to)

    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / COLOR_FADE_MS)
      const e = 1 - (1 - k) ** 3
      apply(from.map((c, i) => c.map((v, j) => v + (to[i][j] - v) * e) as RGB))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [key, reduced]) // `colors` entra via `key` (array novo a cada render)

  return (
    <>
      <div ref={fallbackRef} className="gradient-fallback" aria-hidden>
        {fallback}
      </div>
      <canvas ref={canvasRef} className="gradient-backdrop" aria-hidden />
      <div className="grain" aria-hidden />
    </>
  )
}
