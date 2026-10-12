import type { RefObject } from 'react'
import { IconButton } from '../../../shared/ui/IconButton'
import { ClockIcon } from '../../../shared/ui/icons/ClockIcon'

type Props = {
  anchor: RefObject<HTMLDivElement>
  expanded: boolean
  onOpen: () => void
}

/** Abre o painel de tempos; o wrapper serve de âncora para posicionar o painel. */
export function DurationButton({ anchor, expanded, onOpen }: Props) {
  return (
    <div className="secondary surface" ref={anchor}>
      <IconButton label="Tempos" motion="spin" expanded={expanded} onClick={onOpen}>
        <ClockIcon />
      </IconButton>
    </div>
  )
}
