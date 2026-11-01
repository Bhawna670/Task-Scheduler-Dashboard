// Presenters: turn domain objects into the JSON the client sees. Internal fields (version, seq) never leave the server.
const { PRIORITIES } = require('../models/Task');

const taskView = t => ({ id: t.id, name: t.name, priority: t.priority, priorityLabel: PRIORITIES[t.priority], duration: t.duration,
  status: t.status, progress: t.progress, workerId: t.workerId, createdAt: t.createdAt, runAt: t.runAt, readyAt: t.readyAt,
  startedAt: t.startedAt, finishedAt: t.finishedAt, waitMs: t.waitMs });
const workerView = w => ({ id: w.id, name: w.name, online: w.online, taskId: w.taskId, completed: w.completed, busyMs: w.busyMs });
const stateView = s => ({ now: s.now, priorities: PRIORITIES, tasks: s.tasks.map(taskView), queue: s.queue.map(taskView),
  scheduled: s.scheduled.map(taskView), workers: s.workers.map(workerView), stats: s.stats, log: s.log });

module.exports = { taskView, workerView, stateView };
