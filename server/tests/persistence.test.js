const assert = require('assert'), os = require('os'), path = require('path'), fs = require('fs');
const { SchedulerModel } = require('../models/SchedulerModel');
const { TaskRepository } = require('../models/TaskRepository');
const file = path.join(os.tmpdir(), `sched-${process.pid}.db`);
for (const s of ['', '-wal', '-shm']) fs.rmSync(file + s, { force: true });

// --- first "process" ---
const repo1 = new TaskRepository(file), m1 = new SchedulerModel(2, repo1);
m1.toggleWorker(2);                                        // node-2 offline
const t0 = Date.now();
const A = m1.create({ name: 'A', priority: 1, duration: 1 }); m1.tick(t0); m1.tick(t0 + 1500);
assert.equal(A.status, 'completed');
const B = m1.create({ name: 'B', priority: 1, duration: 5 });
const C = m1.create({ name: 'C', priority: 5, duration: 5 });
const D = m1.create({ name: 'D', priority: 3, duration: 5, delay: 100 });
const E = m1.create({ name: 'E', priority: 2, duration: 5 }); m1.cancel(E.id);
m1.tick(); assert.equal(B.status, 'running');
repo1.close();                                             // crash: B was mid-run

// --- second "process" ---
const m2 = new SchedulerModel(2, new TaskRepository(file));
const info = m2.recover();
assert.deepEqual(info, { tasks: 5, requeued: 1 });
const st = id => m2.tasks.get(id).status;
assert.deepEqual([A, B, C, D, E].map(t => st(t.id)), ['completed', 'queued', 'queued', 'scheduled', 'cancelled']);
assert.equal(m2.workers[0].completed, 1, 'worker stats persisted');
assert.equal(m2.workers[1].online, false, 'offline flag persisted');
assert.ok(m2.log.length > 0 && m2.log[0].msg.startsWith('Recovered'), 'activity log restored');
m2.tick(); assert.equal(st(B.id), 'running', 'recovered queue still runs highest priority first');
assert.equal(m2.create({ name: 'F' }).id, 6, 'ids continue after restart');
assert.equal(m2.snapshot().stats.completed, 1);
m2.repo.close();
for (const s of ['', '-wal', '-shm']) fs.rmSync(file + s, { force: true });
console.log('persistence tests passed');
