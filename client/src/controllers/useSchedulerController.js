import { api } from '../models/api'
import { useSchedulerModel } from '../models/useSchedulerModel'

// Turns user intents into API calls, then refreshes the model. Views never call the API directly.
export function useSchedulerController() {
  const { state, error, setError, refresh } = useSchedulerModel()
  const run = (path, method, body) => api(path, method, body).then(refresh).catch(e => setError(e.message))
  const actions = {
    createTask: form => form.name.trim() ? run('/tasks', 'POST', form) : (setError('Task name is required'), Promise.resolve()),
    cancelTask: id => run(`/tasks/${id}/cancel`, 'POST'),
    rescheduleTask: (id, priority, delay) => run(`/tasks/${id}`, 'PATCH', { priority, delay }),
    toggleWorker: id => run(`/workers/${id}/toggle`, 'POST'),
    seedDemo: () => run('/demo', 'POST'),
  }
  return { state, error, actions }
}
