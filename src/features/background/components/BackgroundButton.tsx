import type { RefObject } from 'react'
import { IconButton } from '../../../shared/ui/IconButton'
import { ImageIcon } from '../../../shared/ui/icons/ImageIcon'

type Props = {
  anchor: RefObject<HTMLDivElement>
  expanded: boolean
  onOpen: () => void
}

/** Abre o painel de fundo; o wrapper serve de âncora para posicionar o painel. */
export function BackgroundButton({ anchor, expanded, onOpen }: Props) {
  return (
    <div className="secondary surface" ref={anchor}>
      <IconButton label="Fundo" motion="lift" expanded={expanded} onClick={onOpen}>
        <ImageIcon />
      </IconButton>
    </div>
  )
}
