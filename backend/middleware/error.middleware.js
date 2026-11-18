export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = "NOT_FOUND";
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;
  let statusCode = error.statusCode || 500;
  let code = error.code || "INTERNAL_SERVER_ERROR";
  let message = statusCode >= 500 ? "Internal server error" : error.message;
  if (error.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    message = "An account with this email already exists";
  }
  if (error.name === "ValidationError") {
    statusCode = 400;
    code = "DATABASE_VALIDATION_ERROR";
    message = "Invalid data";
  }
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
};
