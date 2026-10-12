import type { CSSProperties } from 'react'

type Props = { colors: [string, string, string]; animate: boolean }

/** Mantém a paleta escolhida também sem WebGL e durante o carregamento. */
export function BlobBackdrop({ colors, animate }: Props) {
  return (
    <div
      className="backdrop"
      data-animate={animate}
      style={{ '--bg-strong': colors[0], '--bg-light': colors[1], '--bg-mid': colors[2] } as CSSProperties}
      aria-hidden
    >
      <span className="blob blob-1" />
      <span className="blob blob-2" />
      <span className="blob blob-3" />
    </div>
  )
}
