// Controllers, views and error handler tested with fake req/res (no Express needed).
const assert = require('assert');
const { SchedulerModel } = require('../models/SchedulerModel');
const tasks = require('../controllers/taskController'), state = require('../controllers/stateController'), workers = require('../controllers/workerController');
const errorHandler = require('../middleware/errorHandler');
const mkRes = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };

const m = new SchedulerModel(2), T = tasks(m);
let res = mkRes(); T.create({ body: { name: 'Index', priority: 2, duration: 3 } }, res);
assert.equal(res.code, 201); assert.equal(res.body.priorityLabel, 'High'); assert.ok(!('version' in res.body) && !('seq' in res.body), 'view hides internals');
assert.throws(() => T.create({ body: { name: 'x', priority: 9 } }, mkRes()), e => e.status === 400);
res = mkRes(); errorHandler(Object.assign(new Error('boom'), { status: 409 }), {}, res, () => {}); assert.deepEqual([res.code, res.body], [409, { error: 'boom' }]);
m.tick(); res = mkRes(); state(m).show({}, res);
assert.equal(res.body.priorities[1], 'Critical'); assert.equal(res.body.workers[0].taskId, 1); assert.equal(res.body.stats.running, 1);
res = mkRes(); workers(m).toggle({ params: { id: 1 } }, res); assert.equal(res.body.online, false);
res = mkRes(); T.seed({}, res); assert.equal(res.body.created, 8);
console.log('controller tests passed');
