/** Ícone de imagem (moldura, sol e montanha) para o seletor de fundo. */
export function ImageIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" />
      <circle cx="9" cy="9.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="m4 17 4.6-4.6a1.5 1.5 0 0 1 2.1 0L14 15.7" />
      <path d="m13 14.7 1.6-1.6a1.5 1.5 0 0 1 2.1 0L20 16.4" />
    </svg>
  )
}
