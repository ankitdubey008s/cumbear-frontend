import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

interface ToastData {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

let toastId = 0
const listeners: Set<(toasts: ToastData[]) => void> = new Set()
let toasts: ToastData[] = []

function notify() {
  listeners.forEach(fn => fn([...toasts]))
}

export function showToast(message: string, type: ToastData['type'] = 'info') {
  const id = ++toastId
  toasts = [...toasts, { id, message, type }]
  notify()
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    notify()
  }, 3000)
}

export default function ToastContainer() {
  const [, setLocalToasts] = useState<ToastData[]>([])

  useEffect(() => {
    const update = (t: ToastData[]) => setLocalToasts(t)
    listeners.add(update)
    return () => { listeners.delete(update) }
  }, [])

  const icons = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertCircle size={18} />,
    info: <Info size={18} />,
  }

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item ${t.type}`}>
          {icons[t.type]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

