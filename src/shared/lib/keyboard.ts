/**
 * Navegação de radio group (padrão ARIA): setas circulam, Home/End vão às pontas.
 * Retorna o novo índice, ou -1 se a tecla não é de navegação.
 */
export function rovingIndex(key: string, index: number, count: number): number {
  const last = count - 1
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return index === last ? 0 : index + 1
    case 'ArrowLeft':
    case 'ArrowUp':
      return index === 0 ? last : index - 1
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return -1
  }
}
