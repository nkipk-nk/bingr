import { useState, useCallback } from 'react'
import { ToastContext } from './toastContextObject'

// CX11/GP9 (BINGR_UI_AUDIT.md) — the toast used to be local state in
// App.jsx, reachable only by whatever App.jsx passed down as props. Most
// of the app isn't a direct child of that tree (AccountSettings,
// UserProfilePage, ListsPage nested several levels deep, etc.), so nearly
// everything either improvised its own inline success/error box or gave no
// feedback at all.
// One context, reachable from anywhere via useToast() (see useToast.js).
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { id, message, tone, action }

  const showToast = useCallback((message, opts = {}) => {
    setToast({ id: Date.now(), message, tone: opts.tone || 'neutral', action: opts.action })
  }, [])

  const clearToast = useCallback(() => setToast(null), [])

  return (
    <ToastContext.Provider value={{ toast, showToast, clearToast }}>
      {children}
    </ToastContext.Provider>
  )
}
