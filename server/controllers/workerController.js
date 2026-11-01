const { workerView } = require('../views/schedulerView');
module.exports = model => ({ toggle: (req, res) => res.json(workerView(model.toggleWorker(req.params.id))) });
