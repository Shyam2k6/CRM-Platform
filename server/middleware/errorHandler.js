// Centralized Error Handling Middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  let message = err.message;
  let errors = null;
  
  if (err.name === 'ValidationError') {
    res.statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(val => val.message);
  } else if (err.name === 'CastError') {
    res.statusCode = 400;
    message = `Resource not found. Invalid format for ${err.path}`;
  } else if (err.code === 11000) {
    res.statusCode = 400;
    message = 'Duplicate field value entered';
  }

  res.status(res.statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

// NotFound middleware for 404 routes
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
