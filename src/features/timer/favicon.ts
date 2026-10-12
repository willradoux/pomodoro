// Favicon que acompanha o estado: pause enquanto o timer corre, play no resto do tempo.
// Só o ícone, sem fundo; a cor segue o tema do sistema para não sumir na aba.

const STYLE =
  '<style>path{fill:#1d1d1f;stroke:#1d1d1f}@media (prefers-color-scheme:dark){path{fill:#f5f5f7;stroke:#f5f5f7}}</style>'

const icon = (paths: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 16 16">${STYLE}` +
      `<g stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${paths}</g></svg>`,
  )

const PLAY = icon('<path d="M8.5 6.5 18 12l-9.5 5.5z"/>')
const PAUSE = icon('<path d="M7 6.5h1.5v11H7z"/><path d="M15.5 6.5H17v11h-1.5z"/>')

export function setFavicon(playing: boolean) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = 'image/svg+xml'
  link.href = playing ? PAUSE : PLAY
}
