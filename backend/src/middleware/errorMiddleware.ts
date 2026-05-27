import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod'; 

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {

  let statusCode = err.status || 500;
  let message = err.message || "Server Error";
  let errors: any = null; 

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.issues.map(issue => ({
      path: issue.path,
      message: issue.message
    }));
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }), 
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};