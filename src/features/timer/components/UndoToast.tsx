import { useEffect, useState } from 'react'

export type Toast = { id: number; message: string }

const VISIBLE_MS = 6000

/** Aviso com "Desfazer". Some sozinho, mas pausa com o mouse ou o foco nele (WCAG 2.2.1). */
export function UndoToast({ toast, onUndo, onDismiss }: { toast: Toast | null; onUndo: () => void; onDismiss: () => void }) {
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (!toast || held) return
    const id = window.setTimeout(onDismiss, VISIBLE_MS)
    return () => clearTimeout(id)
  }, [toast, held, onDismiss])

  return (
    <div className="toast-region" role="status">
      {toast && (
        <div
          key={toast.id}
          className="toast surface"
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
        >
          <span>{toast.message}</span>
          <button type="button" className="toast-action" onClick={onUndo}>
            Desfazer
          </button>
        </div>
      )}
    </div>
  )
}
