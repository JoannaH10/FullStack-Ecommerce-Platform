// server/middleware/errorhandling.js
const AppError = require('../utils/appError');

// Handle specific database errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : (err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'UNKNOWN');
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

// Development error response
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Rendered website errors (EJS page)
  console.error('ERROR 💥', err); 
  return res.status(err.statusCode).render('pages/error', {
    title: `Error ${err.statusCode} | Global Snacks`,
    statusCode: err.statusCode,
    headline: err.statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong',
    message: err.message,
    error: err, 
    showHeader: false, 
    showFooter: false, 
    isAdminPanel: req.isAdminPanel || false 
  });
};

// Production error response
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or other unknown errors - don't leak details
    console.error('ERROR 💥', err); 
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

  // Rendered website errors (EJS page)
  if (err.isOperational) {
    return res.status(err.statusCode).render('pages/error', {
      title: `Error ${err.statusCode} | Global Snacks`,
      statusCode: err.statusCode,
      headline: err.statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong',
      message: err.message,
      showHeader: false, // Hide header on error page
      showFooter: false, // Hide footer on error page
      isAdminPanel: req.isAdminPanel || false // Pass admin flag for conditional redirect
    });
  }

  // Programming or other unknown errors - don't leak details to client
  console.error('ERROR 💥', err); 
  return res.status(500).render('pages/error', {
    title: 'Error 500 | Global Snacks',
    statusCode: 500,
    headline: 'Something Went Wrong',
    message: 'Please try again later.', // Generic message for unknown errors
    showHeader: false, // Hide header on error page
    showFooter: false, // Hide footer on error page
    isAdminPanel: req.isAdminPanel || false // Pass admin flag for conditional redirect
  });
};

// Main error handling middleware function
module.exports = (err, req, res, next) => {
  // Set default status code and status if not already set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // In development, send detailed error
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // In production, prepare a clone of the error to avoid modifying the original
    let error = { ...err };
    error.message = err.message;
    error.name = err.name; // Copy name for error type checks
    error.code = err.code; // Copy code for duplicate key error check

    // Handle specific MongoDB/Mongoose errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); // Mongoose duplicate key error
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error); // Mongoose validation error

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Send the appropriate error response for production
    sendErrorProd(error, req, res);
  }
};