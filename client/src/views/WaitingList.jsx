import { useState } from 'react'
import { Chip, PrioritySelect, secs } from './format'

function TaskRow({ t, now, priorities, actions }) {
  const [edit, setEdit] = useState(false)
  const [p, setP] = useState(t.priority), [d, setD] = useState('')
  const note = t.status === 'scheduled' ? `starts in ${secs(Math.max(0, t.runAt - now))}` : `waiting ${secs(now - t.readyAt)}`
  return (
    <li className="item">
      <div className="itemtop">
        <Chip task={t} /><b>#{t.id} {t.name}</b><span className="muted">{note}</span><span className="spacer" />
        <button onClick={() => setEdit(!edit)}>Reschedule</button>
        <button className="danger" onClick={() => actions.cancelTask(t.id)}>Cancel</button>
      </div>
      {edit && (
        <div className="edit">
          <label>Priority<PrioritySelect priorities={priorities} value={p} onChange={e => setP(e.target.value)} /></label>
          <label>Delay (s)<input type="number" min="0" value={d} placeholder="keep" onChange={e => setD(e.target.value)} /></label>
          <button className="primary" onClick={() => { actions.rescheduleTask(t.id, p, d); setEdit(false) }}>Apply</button>
        </div>
      )}
    </li>
  )
}

export default function WaitingList({ tasks, now, priorities, actions }) {
  return (
    <div className="panel"><h2>Waiting ({tasks.length})</h2>
      {tasks.length ? <ul className="list">{tasks.map(t => <TaskRow key={t.id} t={t} now={now} priorities={priorities} actions={actions} />)}</ul>
        : <p className="muted">Nothing waiting. Add a task or load the sample tasks.</p>}
    </div>
  )
}
