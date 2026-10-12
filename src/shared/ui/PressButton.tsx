import type { ButtonHTMLAttributes } from 'react'
import { usePress } from '../hooks/usePress'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { depth?: number }

/** Botão que afunda ao pressionar e volta com mola. Compõe (não sobrescreve) os handlers de ponteiro. */
export function PressButton({ style, depth, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, ...props }: Props) {
  const { scale, handlers } = usePress(depth)
  const inert = props.disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true'

  return (
    <button
      type="button"
      {...props}
      onPointerDown={(e) => {
        onPointerDown?.(e)
        if (!inert) handlers.onPointerDown()
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e)
        handlers.onPointerUp()
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        handlers.onPointerLeave()
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e)
        handlers.onPointerCancel()
      }}
      // sem transform em repouso: não cria camada à toa
      style={scale === 1 ? style : { ...style, transform: `scale(${scale})` }}
    />
  )
}
