import { sounds } from '../../shared/lib/sounds'
import type { BackgroundId } from './model/backgrounds'

/** Cada cor tem seu timbre ao ser escolhida. */
const BACKGROUND_SOUNDS: Record<BackgroundId, () => void> = {
  // cristalino: sinos em quinta (mi6, si6)
  azul: () => {
    sounds.bell(1318.5, 0, 0.5, 0.1)
    sounds.bell(1975.5, 0.06, 0.6, 0.07)
  },
  // madeira: marimba (sol5 → ré6)
  verde: () => {
    sounds.note(783.99, 0, 0.22, 0.16, 'triangle')
    sounds.note(1174.66, 0.07, 0.28, 0.12, 'triangle')
  },
  // quente: acorde maior arpejado (dó5, mi5, sol5)
  laranja: () => {
    sounds.note(523.25, 0, 0.4, 0.12, 'triangle')
    sounds.note(659.25, 0.05, 0.45, 0.1, 'triangle')
    sounds.note(783.99, 0.1, 0.5, 0.08)
  },
  // "game over": três semitons descendo e a última nota despencando
  neutro: () => {
    sounds.glide(392, 392, 0, 0.17, 0.16)
    sounds.glide(370, 370, 0.18, 0.17, 0.16)
    sounds.glide(349, 349, 0.36, 0.17, 0.16)
    sounds.glide(330, 110, 0.54, 0.8, 0.18)
  },
}

export const playBackgroundSound = (id: BackgroundId) => sounds.play(BACKGROUND_SOUNDS[id])
