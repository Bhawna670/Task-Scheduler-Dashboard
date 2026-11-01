import { useState } from 'react'
import { PrioritySelect } from './format'

export default function TaskForm({ priorities, onCreate }) {
  const [f, setF] = useState({ name: '', priority: 3, duration: 6, delay: 0 })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  return (
    <form className="panel form" onSubmit={e => { e.preventDefault(); onCreate(f); setF({ ...f, name: '' }) }}>
      <h2>New task</h2>
      <label>Name<input value={f.name} onChange={set('name')} placeholder="e.g. Rebuild search index" /></label>
      <div className="row">
        <label>Priority<PrioritySelect priorities={priorities} value={f.priority} onChange={set('priority')} /></label>
        <label>Runs for (s)<input type="number" min="1" max="600" value={f.duration} onChange={set('duration')} /></label>
        <label>Start in (s)<input type="number" min="0" value={f.delay} onChange={set('delay')} /></label>
      </div>
      <button className="primary">Add task</button>
    </form>
  )
}
