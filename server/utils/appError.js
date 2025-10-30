// utils/appError.js

/**
 * Custom error class for operational errors.
 * This allows us to differentiate between operational errors (e.g., invalid input, resource not found)
 * and programming errors (e.g., code bugs). Operational errors can be handled gracefully.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent Error constructor

        this.statusCode = statusCode; // HTTP status code (e.g., 400, 404, 500)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // 'fail' for 4xx, 'error' for 5xx
        this.isOperational = true; // Mark this as an operational error

        // Capture the stack trace, excluding this constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
