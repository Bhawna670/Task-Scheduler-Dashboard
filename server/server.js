const fs = require('fs'), path = require('path');
const { SchedulerModel } = require('./models/SchedulerModel');
const { TaskRepository } = require('./models/TaskRepository');
const createApp = require('./app');

const dbFile = process.env.DB_FILE || path.join(__dirname, 'data', 'scheduler.db');
if (dbFile !== ':memory:') fs.mkdirSync(path.dirname(dbFile), { recursive: true });
const model = new SchedulerModel(4, new TaskRepository(dbFile));
const info = model.recover();
console.log(`Database: ${dbFile} (recovered ${info.tasks} tasks, ${info.requeued} requeued)`);

setInterval(() => { try { model.tick(); } catch (e) { console.error('tick failed:', e.message); } }, 200); // simulation clock
const PORT = process.env.PORT || 3001;
createApp(model).listen(PORT, () => console.log(`Scheduler API on http://localhost:${PORT}`));
