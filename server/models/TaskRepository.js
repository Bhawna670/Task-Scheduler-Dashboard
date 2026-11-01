// Persistence layer (SQLite via Node's built-in node:sqlite, Node 22.5+). The model never writes SQL itself.
const { DatabaseSync } = require('node:sqlite');
const { Task } = require('./Task');

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
  duration INTEGER NOT NULL, status TEXT NOT NULL,
  created_at INTEGER NOT NULL, run_at INTEGER NOT NULL, ready_at INTEGER,
  started_at INTEGER, finished_at INTEGER, wait_ms INTEGER, worker_id INTEGER);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE TABLE IF NOT EXISTS workers (id INTEGER PRIMARY KEY, online INTEGER NOT NULL, completed INTEGER NOT NULL, busy_ms INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, msg TEXT NOT NULL);`;

class TaskRepository {
  constructor(file = ':memory:') {
    this.db = new DatabaseSync(file);
    this.db.exec(SCHEMA);
    this.stmt = {
      saveTask: this.db.prepare(`INSERT OR REPLACE INTO tasks (id, name, priority, duration, status, created_at, run_at, ready_at, started_at, finished_at, wait_ms, worker_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`),
      loadTasks: this.db.prepare(`SELECT id, name, priority, duration, status, created_at AS createdAt, run_at AS runAt, ready_at AS readyAt, started_at AS startedAt, finished_at AS finishedAt, wait_ms AS waitMs, worker_id AS workerId FROM tasks ORDER BY id`),
      saveWorker: this.db.prepare(`INSERT OR REPLACE INTO workers (id, online, completed, busy_ms) VALUES (?,?,?,?)`),
      loadWorkers: this.db.prepare(`SELECT id, online, completed, busy_ms AS busyMs FROM workers`),
      addEvent: this.db.prepare(`INSERT INTO events (t, msg) VALUES (?,?)`),
      pruneEvents: this.db.prepare(`DELETE FROM events WHERE id < (SELECT MAX(id) FROM events) - 500`),
      loadEvents: this.db.prepare(`SELECT t, msg FROM events ORDER BY id DESC LIMIT ?`),
    };
  }
  saveTask(t) { this.stmt.saveTask.run(t.id, t.name, t.priority, t.duration, t.status, t.createdAt, t.runAt, t.readyAt, t.startedAt, t.finishedAt, t.waitMs, t.workerId); }
  loadTasks() { return this.stmt.loadTasks.all().map(Task.fromRow); }
  saveWorker(w) { this.stmt.saveWorker.run(w.id, w.online ? 1 : 0, w.completed, w.busyMs); }
  loadWorkers() { return this.stmt.loadWorkers.all(); }
  addEvent(e) { this.stmt.addEvent.run(e.t, e.msg); this.stmt.pruneEvents.run(); }
  loadEvents(limit = 40) { return this.stmt.loadEvents.all(limit).map(r => ({ t: r.t, msg: r.msg })); }
  transaction(fn) {
    this.db.exec('BEGIN');
    try { fn(); this.db.exec('COMMIT'); } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  close() { this.db.close(); }
}
module.exports = { TaskRepository };
