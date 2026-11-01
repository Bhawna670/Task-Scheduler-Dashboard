# Task Scheduler Dashboard

React + Express app around a priority-queue task scheduler with simulated worker nodes.

## Run
Requires **Node 22.13+** (uses the built-in `node:sqlite`, so no native database package to install).
```
cd server && npm install && npm start      # API on :3001  (npm test runs model, controller and persistence tests)
cd client && npm install && npm run dev    # UI on :5173 (proxies /api to :3001)
```

## API
| Method | Path | Purpose |
|---|---|---|
| GET | /api/state | tasks, queue order, workers, stats, activity log |
| POST | /api/tasks | create `{name, priority 1-5, duration s, delay s}` |
| POST | /api/tasks/:id/cancel | cancel a queued, scheduled or running task |
| PATCH | /api/tasks/:id | reschedule `{priority?, delay?}` (queued/scheduled only) |
| POST | /api/workers/:id/toggle | take a node offline/online; its running task is requeued |
| POST | /api/demo | add 8 sample tasks |

## MVC architecture
```
server/                              client/src/
  models/      domain + queue logic    models/       API client + state (polling)
    PriorityQueue.js  Task.js           api.js  useSchedulerModel.js
    Worker.js  SchedulerModel.js      controllers/  user intents -> API calls
  controllers/ HTTP in, model calls     useSchedulerController.js
    task / worker / state             views/        presentational components
  views/       JSON presenters          Dashboard TaskForm WaitingList
    schedulerView.js                    WorkerGrid Panels format
  routes/ middleware/ utils/          App.jsx       wires controller to view
  app.js (Express)  server.js (boot + simulation clock)
```
Request flow: route -> controller -> model (mutates state) -> view presenter -> JSON -> React model -> controller -> view.
Models know nothing about HTTP; controllers receive the model by injection, so they are tested with fake req/res.

## Design notes
- Binary min-heap ordered by priority (1 = highest), then wait time, then insertion order.
- Cancel and reschedule use versioned heap entries (lazy deletion), so both stay O(log n).
- Idle nodes are served least-completed first, which balances load across workers.
- The server view hides internal fields (`version`, `seq`) and adds `priorityLabel`.

## Database (SQLite)
`models/TaskRepository.js` is the only file that writes SQL. The in-memory priority queue still decides what runs next;
the database is the durable record.
- Tables: `tasks` (full lifecycle + timestamps), `workers` (online flag, completed count, busy time), `events` (activity log, pruned to ~500 rows).
- Every state change (create, cancel, reschedule, start, finish, node toggle) is saved; each scheduler tick runs in one transaction.
- On startup `model.recover()` reloads everything: queued and scheduled tasks resume, tasks that were `running` return to the queue
  (their worker is gone), ids continue where they left off, and worker stats and the activity log are restored.
- File: `server/data/scheduler.db` (override with `DB_FILE=/path/to.db`, or `DB_FILE=:memory:` for a throwaway run).
- Limitation: all tasks are loaded into memory at startup. Fine for demo scale; at larger scale load only unfinished tasks and query history with SQL.

## Checkpoints
- [x] 1. Server models: PriorityQueue, Task (validation), Worker, SchedulerModel
- [x] 2. Server views: JSON presenters
- [x] 3. Server controllers: task, worker, state (model injected)
- [x] 4. Routes, error middleware, app.js and server.js split
- [x] 5. Tests: model and controller (passing)
- [x] 6. Client model: api.js, useSchedulerModel
- [x] 7. Client controller: useSchedulerController
- [x] 8. Client views: Dashboard, TaskForm, WaitingList, WorkerGrid, Panels
- [x] 9. SQLite repository: schema, prepared statements, transactions
- [x] 10. Model saves on every state change; tick runs in a transaction
- [x] 11. Crash recovery: `recover()` rebuilds queue, workers, ids and log
- [x] 12. Boot wiring, `DB_FILE` option, `.gitignore`; persistence test simulating a restart (passing)
- [ ] 13. Run full stack on your machine; SSE instead of polling

## Deploy
One Docker image serves the API and the built React app on a single URL (`Dockerfile`, `render.yaml`).
```
docker build -t task-scheduler . && docker run -p 3001:3001 -v sched-data:/data task-scheduler   # http://localhost:3001
```
- CI (`.github/workflows/ci.yml`) runs the server tests and a client build on every push.
- Render free tier: sleeps after 15 min idle (about 1 min cold start) and has no persistent disk, so the SQLite file resets on redeploy. Fine for a demo; use a paid instance with a disk (see `render.yaml`) or a host with volumes to keep data.
- GitHub Pages cannot host this app because it only serves static files and the API needs a running server.
