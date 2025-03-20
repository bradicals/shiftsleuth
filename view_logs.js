/**
 * Simple log viewer for ShiftSleuth
 * Run with: node view_logs.js
 */

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
  console.log('Created logs directory. No logs found yet.');
  process.exit(0);
}

// Get all log files
const logFiles = fs.readdirSync(logDir).filter(file => file.endsWith('.log'));

if (logFiles.length === 0) {
  console.log('No log files found in logs directory.');
  process.exit(0);
}

// Display available log files
console.log('Available log files:');
logFiles.forEach((file, index) => {
  const stats = fs.statSync(path.join(logDir, file));
  const fileSize = (stats.size / 1024).toFixed(2);
  console.log(`${index + 1}. ${file} (${fileSize} KB)`);
});

// Get the most recent log file
const getLatestLog = () => {
  let latestFile = null;
  let latestTime = 0;
  
  logFiles.forEach(file => {
    const stats = fs.statSync(path.join(logDir, file));
    if (stats.mtimeMs > latestTime) {
      latestTime = stats.mtimeMs;
      latestFile = file;
    }
  });
  
  return latestFile;
};

// Display the latest log's contents
const latestLog = getLatestLog();
console.log(`\nShowing latest log file: ${latestLog}\n`);
console.log('='.repeat(80));

const logContent = fs.readFileSync(path.join(logDir, latestLog), 'utf8');
console.log(logContent);
console.log('='.repeat(80));

console.log('\nTo view a specific log file, run:');
console.log('node view_logs.js date (for date_extraction.log)');
console.log('node view_logs.js ordinal (for ordinal_date.log)');
console.log('Or just check the logs directory manually.');