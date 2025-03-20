/**
 * Logger module for ShiftSleuth
 * Provides console logging and file logging capabilities
 */

const fs = require('fs');
const path = require('path');

// Ensure log directory exists
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Create log file name with current date
const getLogFilePath = () => {
  const now = new Date();
  const datePart = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logDir, `shiftbot-${datePart}.log`);
};

/**
 * Log a message to console and file
 * @param {string} level - Log level (INFO, DEBUG, ERROR)
 * @param {string} message - The message to log
 * @param {Object} [data] - Optional data to include in the log
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  // Add data if provided
  if (data) {
    try {
      if (typeof data === 'object') {
        logMessage += `\n${JSON.stringify(data, null, 2)}`;
      } else {
        logMessage += `\n${data}`;
      }
    } catch (err) {
      logMessage += `\n[Error stringifying data: ${err.message}]`;
    }
  }
  
  // Log to console
  const consoleMethod = level === 'ERROR' ? 'error' : 'log';
  console[consoleMethod](logMessage);
  
  // Log to file
  fs.appendFile(getLogFilePath(), logMessage + '\n', (err) => {
    if (err) {
      console.error(`Failed to write to log file: ${err.message}`);
    }
  });
}

// Convenience methods for different log levels
const logger = {
  info: (message, data) => log('INFO', message, data),
  debug: (message, data) => log('DEBUG', message, data),
  error: (message, data) => log('ERROR', message, data),
  
  // Date extraction specific logging
  dateExtraction: (message, data) => {
    log('DATE', message, data);
  }
};

module.exports = logger;