const fs = require('fs'), path = require('path');
const express = require('express'), cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

module.exports = model => {
  const app = express();
  app.use(cors(), express.json());
  app.use('/api', routes(model));
  // Production: serve the built React client (Docker copies it to ./public; locally it is ../client/dist).
  const dist = [process.env.STATIC_DIR, path.join(__dirname, 'public'), path.join(__dirname, '..', 'client', 'dist')]
    .filter(Boolean).find(d => fs.existsSync(path.join(d, 'index.html')));
  if (dist) {
    app.use(express.static(dist));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use(errorHandler);
  return app;
};
