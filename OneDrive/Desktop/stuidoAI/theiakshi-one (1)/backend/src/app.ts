import express from 'express';
import path from 'path';
import routes from './routes';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './database/db';
import { initializeAttendanceCronJob } from './jobs/cron/attendanceCron';

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Custom Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate limiting
app.use(rateLimiter(300, 60 * 1000));

// Uploads static directory
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API v1 router
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export async function bootstrapApp() {
  await initDatabase();
  initializeAttendanceCronJob();
  return app;
}

export default app;
