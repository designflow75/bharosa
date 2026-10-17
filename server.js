const express = require('express');
const path = require('path');
const apiApp = require('./api/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Mount API routes
app.use(apiApp);

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// SPA fallback for all web views (/freelancer, /client, /admin, /projects/:id, /403)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Bharosa OS full-stack server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
