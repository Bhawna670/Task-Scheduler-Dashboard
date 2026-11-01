import { Chip, secs } from './format'

export const StatsBar = ({ stats }) => (
  <div className="stats">
    {[['Queued', stats.queued], ['Scheduled', stats.scheduled], ['Running', stats.running], ['Completed', stats.completed], ['Avg wait', secs(stats.avgWaitMs)]]
      .map(([k, v]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}
  </div>
)
export const ActivityLog = ({ log }) => (
  <div className="panel"><h2>Activity</h2>
    <ul className="log">{log.slice(0, 14).map((l, i) => <li key={i}><span className="muted">{new Date(l.t).toLocaleTimeString()}</span> {l.msg}</li>)}</ul></div>
)
export const TaskTable = ({ tasks }) => (
  <div className="panel"><h2>All tasks</h2>
    <table><thead><tr><th>ID</th><th>Name</th><th>Priority</th><th>Status</th></tr></thead>
      <tbody>{tasks.slice(0, 15).map(t => <tr key={t.id}><td>{t.id}</td><td>{t.name}</td><td><Chip task={t} /></td><td className={`st ${t.status}`}>{t.status}</td></tr>)}</tbody></table></div>
)
