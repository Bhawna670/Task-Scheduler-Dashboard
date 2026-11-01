// Domain model: owns all tasks, the priority queue and the worker nodes. No HTTP knowledge here.
// The optional repository persists every state change; the in-memory queue still decides what runs next.
const { PriorityQueue } = require('./PriorityQueue');
const { Task } = require('./Task');
const { Worker } = require('./Worker');
const { HttpError } = require('../utils/HttpError');

class SchedulerModel {
  constructor(workerCount = 4, repo = null) {
    this.repo = repo; this.tasks = new Map(); this.nextId = 1; this.seq = 0; this.log = [];
    this.queue = new PriorityQueue(); // lazy deletion: stale entries are skipped on peek
    this.workers = Array.from({ length: workerCount }, (_, i) => new Worker(i + 1));
  }
  _save(t) { if (this.repo) this.repo.saveTask(t); }
  _saveWorker(w) { if (this.repo) this.repo.saveWorker(w); }
  _note(msg) {
    const e = { t: Date.now(), msg }; this.log.unshift(e); this.log.length = Math.min(this.log.length, 40);
    if (this.repo) this.repo.addEvent(e);
  }
  _task(id) { const t = this.tasks.get(Number(id)); if (!t) throw new HttpError(404, 'Task not found'); return t; }
  _enqueue(t, readyAt = Date.now()) {
    t.status = 'queued'; t.readyAt = readyAt; t.seq = ++this.seq;
    this.queue.push({ id: t.id, version: t.version, priority: t.priority, readyAt: t.readyAt, seq: t.seq });
  }
  _nextValid() {
    while (this.queue.size) {
      const e = this.queue.peek(), t = this.tasks.get(e.id);
      if (t && t.status === 'queued' && t.version === e.version) return t;
      this.queue.pop();
    }
  }

  create(input) {
    const t = new Task({ id: this.nextId++, ...Task.parseInput(input) });
    this.tasks.set(t.id, t);
    if (t.status === 'queued') this._enqueue(t);
    this._save(t);
    this._note(`Task #${t.id} "${t.name}" created (P${t.priority})`);
    return t;
  }
  cancel(id) {
    const t = this._task(id);
    if (t.isFinished) throw new HttpError(409, `Task is already ${t.status}`);
    if (t.status === 'running') { const w = this.workers.find(w => w.id === t.workerId); if (w) w.taskId = null; }
    t.status = 'cancelled'; t.version++; t.finishedAt = Date.now(); this._save(t);
    this._note(`Task #${t.id} cancelled`); return t;
  }
  reschedule(id, { priority, delay } = {}) {
    const t = this._task(id);
    if (!t.isWaiting) throw new HttpError(409, `Cannot reschedule a ${t.status} task`);
    if (priority != null && priority !== '') t.priority = Task.parsePriority(priority);
    t.version++;
    if (delay != null && delay !== '') {
      const ms = Task.parseDelay(delay);
      if (ms > 0) { t.status = 'scheduled'; t.runAt = Date.now() + ms; } else { t.runAt = Date.now(); this._enqueue(t); }
    } else if (t.status === 'queued') this._enqueue(t);
    this._save(t);
    this._note(`Task #${t.id} rescheduled (P${t.priority}${t.status === 'scheduled' ? ', delayed' : ''})`); return t;
  }
  toggleWorker(id) {
    const w = this.workers.find(w => w.id === Number(id));
    if (!w) throw new HttpError(404, 'Worker not found');
    w.online = !w.online; this._saveWorker(w);
    if (!w.online && w.taskId) {
      const t = this.tasks.get(w.taskId); t.progress = 0; t.workerId = null; t.version++; this._enqueue(t); this._save(t); w.taskId = null;
      this._note(`${w.name} went offline; task #${t.id} requeued`);
    } else this._note(`${w.name} is ${w.online ? 'online' : 'offline'}`);
    return w;
  }
  tick(now = Date.now()) {
    if (this.repo) this.repo.transaction(() => this._tick(now)); else this._tick(now);
  }
  _tick(now) {
    for (const t of this.tasks.values()) if (t.status === 'scheduled' && t.runAt <= now) { this._enqueue(t); this._save(t); }
    for (const w of this.workers) {
      if (!w.taskId) continue;
      const t = this.tasks.get(w.taskId);
      t.progress = Math.min(1, (now - t.startedAt) / t.duration);
      if (t.progress >= 1) {
        t.status = 'completed'; t.finishedAt = now; w.taskId = null; w.completed++; w.busyMs += t.duration;
        this._save(t); this._saveWorker(w); this._note(`${w.name} finished task #${t.id}`);
      }
    }
    for (const w of this.workers.filter(w => w.isIdle).sort((a, b) => a.completed - b.completed)) {
      const t = this._nextValid(); if (!t) break;
      this.queue.pop();
      t.status = 'running'; t.workerId = w.id; t.startedAt = now; t.waitMs = now - t.createdAt; w.taskId = t.id;
      this._save(t); this._note(`${w.name} picked task #${t.id} (P${t.priority})`);
    }
  }

  // Rebuild in-memory state from the database after a restart. Running tasks lost their worker, so they go back to the queue.
  recover() {
    if (!this.repo) return { tasks: 0, requeued: 0 };
    let tasks = 0, requeued = 0;
    this.repo.transaction(() => {
      for (const row of this.repo.loadWorkers()) {
        const w = this.workers.find(x => x.id === row.id);
        if (w) Object.assign(w, { online: !!row.online, completed: row.completed, busyMs: row.busyMs });
      }
      for (const t of this.repo.loadTasks()) {
        tasks++; this.tasks.set(t.id, t); this.nextId = Math.max(this.nextId, t.id + 1);
        if (t.status === 'running') { t.progress = 0; t.workerId = null; t.startedAt = null; requeued++; this._enqueue(t, t.readyAt ?? t.createdAt); this._save(t); }
        else if (t.status === 'queued') this._enqueue(t, t.readyAt ?? t.createdAt);
      }
    });
    this.log = this.repo.loadEvents(40);
    if (tasks) this._note(`Recovered ${tasks} tasks from database (${requeued} requeued)`);
    return { tasks, requeued };
  }

  snapshot() {
    const all = [...this.tasks.values()], count = s => all.filter(t => t.status === s).length;
    const waits = all.filter(t => t.waitMs != null).map(t => t.waitMs);
    return {
      now: Date.now(),
      tasks: all.sort((a, b) => b.id - a.id).slice(0, 60),
      queue: all.filter(t => t.status === 'queued').sort((a, b) => a.priority - b.priority || a.readyAt - b.readyAt || a.seq - b.seq),
      scheduled: all.filter(t => t.status === 'scheduled').sort((a, b) => a.runAt - b.runAt),
      workers: this.workers,
      stats: { queued: count('queued'), scheduled: count('scheduled'), running: count('running'), completed: count('completed'), cancelled: count('cancelled'),
        avgWaitMs: waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0 },
      log: this.log,
    };
  }
}
module.exports = { SchedulerModel };
