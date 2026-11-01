class Worker {
  constructor(id) { Object.assign(this, { id, name: `node-${id}`, online: true, taskId: null, completed: 0, busyMs: 0 }); }
  get isIdle() { return this.online && this.taskId === null; }
}
module.exports = { Worker };
