const { taskView } = require('../views/schedulerView');
const SAMPLE = ['Resize images', 'Send digest', 'Backup DB', 'Rebuild index', 'Sync CRM', 'Render report', 'Clean logs', 'Train model'];

module.exports = model => ({
  create: (req, res) => res.status(201).json(taskView(model.create(req.body))),
  cancel: (req, res) => res.json(taskView(model.cancel(req.params.id))),
  reschedule: (req, res) => res.json(taskView(model.reschedule(req.params.id, req.body))),
  seed: (req, res) => {
    SAMPLE.forEach((name, i) => model.create({ name, priority: 1 + (i * 3) % 5, duration: 4 + (i % 4) * 3, delay: i === 7 ? 15 : 0 }));
    res.status(201).json({ created: SAMPLE.length });
  },
});
