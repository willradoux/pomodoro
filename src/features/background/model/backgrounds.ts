export type BackgroundId = 'azul' | 'verde' | 'laranja' | 'neutro'

export type Background = {
  id: BackgroundId
  label: string
  /** [forte, clara, intermediária]: a forte ocupa um canto, a clara o oposto */
  colors: [string, string, string]
}

export const BACKGROUNDS: Background[] = [
  { id: 'azul', label: 'Azul', colors: ['#2f7bff', '#eef5ff', '#a9cfff'] },
  { id: 'verde', label: 'Verde', colors: ['#25b26a', '#effaf3', '#ade5c3'] },
  { id: 'laranja', label: 'Laranja', colors: ['#ff7a2f', '#fff4ea', '#ffc89e'] },
  { id: 'neutro', label: 'Neutro', colors: ['#2c2c2e', '#f5f5f7', '#c7c7cc'] },
]

export const backgroundById = (id: BackgroundId) => BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]

export type BackgroundPrefs = { id: BackgroundId; animate: boolean }

export const DEFAULT_BACKGROUND: BackgroundPrefs = { id: 'azul', animate: true }
