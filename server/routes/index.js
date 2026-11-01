const express = require('express');
const stateController = require('../controllers/stateController');
const taskController = require('../controllers/taskController');
const workerController = require('../controllers/workerController');

module.exports = model => {
  const r = express.Router(), state = stateController(model), tasks = taskController(model), workers = workerController(model);
  r.get('/state', state.show);
  r.post('/tasks', tasks.create);
  r.post('/tasks/:id/cancel', tasks.cancel);
  r.patch('/tasks/:id', tasks.reschedule);
  r.post('/workers/:id/toggle', workers.toggle);
  r.post('/demo', tasks.seed);
  return r;
};
