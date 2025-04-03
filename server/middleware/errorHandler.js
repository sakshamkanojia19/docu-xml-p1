
const logger = require('../utils/logger');


const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};


const errorHandler = (err, req, res, next) => {

  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (err.stack) {
    logger.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
 
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Server error' : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = { notFound, errorHandler };
