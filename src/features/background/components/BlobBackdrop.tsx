/** Fundo de reserva (sem WebGL ou até o degradê carregar). */
export function BlobBackdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <span className="blob blob-1" />
      <span className="blob blob-2" />
      <span className="blob blob-3" />
    </div>
  )
}
