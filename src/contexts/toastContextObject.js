import { createContext } from 'react'

// Split from ToastContext.jsx so that file can export only the
// ToastProvider component — react-refresh/only-export-components flags
// mixing a component export with a plain value export in the same file.
export const ToastContext = createContext(null)
