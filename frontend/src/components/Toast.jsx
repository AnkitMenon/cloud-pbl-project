import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const show = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const toast = { success: (m) => show(m, 'success'), error: (m) => show(m, 'error') }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pop-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg"
          >
            {t.type === 'error'
              ? <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-300" />
              : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />}
            <p className="flex-1 leading-snug">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
