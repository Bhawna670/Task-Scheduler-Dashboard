import { Chip } from './format'

function WorkerCard({ w, tasks, total, onToggle }) {
  const t = w.taskId && tasks.find(x => x.id === w.taskId)
  const share = total ? (w.completed / total) * 100 : 0
  const label = !w.online ? 'offline' : t ? 'running' : 'idle'
  return (
    <div className={`worker ${w.online ? '' : 'off'}`}>
      <div className="itemtop"><b>{w.name}</b><span className={`dot ${!w.online ? 'off' : t ? 'busy' : 'idle'}`} /><span className="muted">{label}</span>
        <span className="spacer" /><button onClick={() => onToggle(w.id)}>{w.online ? 'Take offline' : 'Bring online'}</button></div>
      <div className="slot">
        {t ? (<><div className="itemtop"><Chip task={t} /><span>#{t.id} {t.name}</span><span className="spacer" /><span className="muted">{Math.round(t.progress * 100)}%</span></div>
          <div className="bar"><i style={{ width: t.progress * 100 + '%' }} /></div></>)
          : <span className="muted">{w.online ? 'Waiting for work' : 'Not accepting tasks'}</span>}
      </div>
      <div className="muted small">{w.completed} done · {share.toFixed(0)}% of all completed work</div>
      <div className="bar thin"><i className="share" style={{ width: share + '%' }} /></div>
    </div>
  )
}

export default function WorkerGrid({ workers, tasks, completed, onToggle }) {
  return (
    <div className="panel"><h2>Worker nodes</h2>
      <div className="workers">{workers.map(w => <WorkerCard key={w.id} w={w} tasks={tasks} total={completed} onToggle={onToggle} />)}</div>
    </div>
  )
}
