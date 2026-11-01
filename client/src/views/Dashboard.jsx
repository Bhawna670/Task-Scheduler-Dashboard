import TaskForm from './TaskForm'
import WaitingList from './WaitingList'
import WorkerGrid from './WorkerGrid'
import { ActivityLog, StatsBar, TaskTable } from './Panels'

export default function Dashboard({ state: s, error, actions }) {
  if (!s) return <main><p className="muted">{error || 'Connecting…'}</p></main>
  return (
    <main>
      <header>
        <div><h1>Task scheduler</h1><p className="muted">Priority queue feeding {s.workers.length} simulated worker nodes</p></div>
        <StatsBar stats={s.stats} />
      </header>
      {error && <div className="err" role="alert">{error}</div>}
      <section className="grid">
        <div className="col"><TaskForm priorities={s.priorities} onCreate={actions.createTask} /><button onClick={actions.seedDemo}>Add 8 sample tasks</button></div>
        <div className="col">
          <WorkerGrid workers={s.workers} tasks={s.tasks} completed={s.stats.completed} onToggle={actions.toggleWorker} />
          <WaitingList tasks={[...s.queue, ...s.scheduled]} now={s.now} priorities={s.priorities} actions={actions} />
        </div>
        <div className="col"><ActivityLog log={s.log} /><TaskTable tasks={s.tasks} /></div>
      </section>
    </main>
  )
}
