import { useSchedulerController } from './controllers/useSchedulerController'
import Dashboard from './views/Dashboard'

export default function App() {
  const { state, error, actions } = useSchedulerController()
  return <Dashboard state={state} error={error} actions={actions} />
}
