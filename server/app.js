import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check route
app.get('/api/health', (req, res) => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  res.status(200).json({
    success: true,
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    dbStatus: states[mongoose.connection.readyState] || 'Unknown'
  });
});

// 404 Route handler
app.use(notFound);

// Central error handler
app.use(errorHandler);

export default app;
