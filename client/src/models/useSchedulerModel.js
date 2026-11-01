import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

// Holds the server snapshot and keeps it fresh by polling.
export function useSchedulerModel(intervalMs = 700) {
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const refresh = useCallback(() => api('/state').then(d => { setState(d); setError('') })
    .catch(() => setError('Cannot reach the API. Start the server on port 3001.')), [])
  useEffect(() => { refresh(); const id = setInterval(refresh, intervalMs); return () => clearInterval(id) }, [refresh, intervalMs])
  return { state, error, setError, refresh }
}
