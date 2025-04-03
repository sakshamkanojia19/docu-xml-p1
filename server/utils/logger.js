
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(info => {
    return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // Write to error log file
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error' 
    }),
    // Write to combined log file
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

module.exports = logger;
