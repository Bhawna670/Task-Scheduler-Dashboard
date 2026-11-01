const { stateView } = require('../views/schedulerView');
module.exports = model => ({ show: (req, res) => res.json(stateView(model.snapshot())) });
