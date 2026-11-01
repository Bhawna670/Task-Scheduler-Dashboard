const { HttpError } = require('../utils/HttpError');
const PRIORITIES = { 1: 'Critical', 2: 'High', 3: 'Normal', 4: 'Low', 5: 'Batch' };

class Task {
  constructor({ id, name, priority, duration, delay }, now = Date.now()) {
    Object.assign(this, { id, name, priority, duration, createdAt: now, runAt: now + delay, status: delay > 0 ? 'scheduled' : 'queued',
      version: 0, seq: 0, readyAt: null, progress: 0, workerId: null, startedAt: null, finishedAt: null, waitMs: null });
  }
  get isFinished() { return this.status === 'completed' || this.status === 'cancelled'; }
  get isWaiting() { return this.status === 'queued' || this.status === 'scheduled'; }

  static fromRow(r) {
    const t = new Task({ id: r.id, name: r.name, priority: r.priority, duration: r.duration, delay: 0 }, r.createdAt);
    return Object.assign(t, { status: r.status, runAt: r.runAt, readyAt: r.readyAt, startedAt: r.startedAt, finishedAt: r.finishedAt,
      waitMs: r.waitMs, workerId: r.workerId, progress: r.status === 'completed' ? 1 : 0 });
  }
  static parsePriority(p) {
    p = Number(p);
    if (!Number.isInteger(p) || p < 1 || p > 5) throw new HttpError(400, 'Priority must be 1 (highest) to 5 (lowest)');
    return p;
  }
  static parseDelay(d) {
    d = Number(d);
    if (!Number.isFinite(d) || d < 0 || d > 3600) throw new HttpError(400, 'Delay must be 0 to 3600 seconds');
    return d * 1000;
  }
  static parseInput({ name, priority = 3, duration = 5, delay = 0 } = {}) {
    name = String(name || '').trim();
    if (!name) throw new HttpError(400, 'Task name is required');
    duration = Number(duration);
    if (!Number.isFinite(duration) || duration < 1 || duration > 600) throw new HttpError(400, 'Duration must be 1 to 600 seconds');
    return { name, priority: Task.parsePriority(priority), duration: duration * 1000, delay: Task.parseDelay(delay) };
  }
}
module.exports = { Task, PRIORITIES };
