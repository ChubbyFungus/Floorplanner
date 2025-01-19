// This file is optional, only an example of how you'd implement the server logging in Node/Express.
// Place it in your server folder (e.g., server/routes/debugLoggerRoute.js).
// Then import and use it in your Express app: app.use('/api', debugLoggerRouter).

const express = require('express');
const fs = require('fs');
const path = require('path');

const debugLoggerRouter = express.Router();
const LOG_FILE_PATH = path.join(__dirname, '..', 'debug.log');

// Ensure the file exists
if (!fs.existsSync(LOG_FILE_PATH)) {
  fs.writeFileSync(LOG_FILE_PATH, '', 'utf8');
}

debugLoggerRouter.post('/debug-logger', (req, res) => {
  const logEntry = req.body;
  const logLine = `[${logEntry.timestamp}] ${logEntry.id} - ${logEntry.message} - ${JSON.stringify(logEntry.data)}\n`;
  
  fs.appendFile(LOG_FILE_PATH, logLine, 'utf8', (err) => {
    if (err) {
      console.error('Failed to append to debug.log:', err);
      return res.status(500).json({ error: 'Failed to write log entry' });
    }
    return res.json({ success: true });
  });
});

module.exports = debugLoggerRouter;