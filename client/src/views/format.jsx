export const secs = ms => (ms / 1000).toFixed(1) + 's'
export const Chip = ({ task }) => <span className={`chip p${task.priority}`}>{task.priorityLabel}</span>
export const PrioritySelect = ({ priorities, value, onChange }) => (
  <select value={value} onChange={onChange}>{Object.entries(priorities).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}</select>
)
