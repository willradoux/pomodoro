import { useRef } from 'react'
import { IconButton } from '../../../shared/ui/IconButton'
import { ResetIcon, type ResetIconHandle } from '../../../shared/ui/icons/ResetIcon'
import { SpeakerIcon } from '../../../shared/ui/icons/SpeakerIcon'

type Props = {
  canReset: boolean
  onReset: () => void
  soundOn: boolean
  onToggleSound: () => void
}

/** Reiniciar e som numa única pílula de vidro. */
export function SessionControls({ canReset, onReset, soundOn, onToggleSound }: Props) {
  const resetIcon = useRef<ResetIconHandle>(null)

  return (
    <div className="secondary surface" role="group" aria-label="Controles">
      <IconButton
        label="Reiniciar"
        motion="spin"
        disabled={!canReset}
        onClick={() => {
          resetIcon.current?.spin()
          onReset()
        }}
      >
        <ResetIcon ref={resetIcon} size={20} />
      </IconButton>
      <IconButton label={soundOn ? 'Desativar sons' : 'Ativar sons'} motion="pulse" pressed={soundOn} onClick={onToggleSound}>
        <SpeakerIcon on={soundOn} size={20} />
      </IconButton>
    </div>
  )
}
