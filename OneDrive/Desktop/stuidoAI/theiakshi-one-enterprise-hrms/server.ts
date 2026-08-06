import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './src/backend/routes/api.js';
import dbService from './src/backend/database/db.js';
import { responseHandlerMiddleware } from './src/backend/middlewares/responseHandler.js';
import { rateLimiterMiddleware } from './src/backend/middlewares/rateLimiterMiddleware.js';
import { errorHandlerMiddleware } from './src/backend/middlewares/errorHandlerMiddleware.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(responseHandlerMiddleware);
  app.use('/api', rateLimiterMiddleware);

  // Pre-initialize PostgreSQL Database Engine
  try {
    await dbService.getDb();
    console.log('[THEIAKSHI Backend] PostgreSQL engine initialized successfully.');
  } catch (err) {
    console.error('[THEIAKSHI Backend Error] Database initialization failed:', err);
  }

  // API Router Mount point
  app.use('/api/v1', apiRouter);

  // Global Error Handler Middleware
  app.use(errorHandlerMiddleware);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'THEIAKSHI ONE Enterprise HRMS',
      company: 'THEIAKSHI ENTERPRISES',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`THEIAKSHI ONE Enterprise HRMS Server Active`);
    console.log(`Company: THEIAKSHI ENTERPRISES`);
    console.log(`Running on: http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer();
