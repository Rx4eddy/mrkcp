import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import schedulerService from './services/scheduler.service.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import contestRoutes from './routes/contest.routes.js';
import reminderRoutes from './routes/reminder.routes.js';
import platformRoutes from './routes/platform.routes.js';
import journalRoutes from './routes/journal.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import devRoutes from './routes/dev.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Security & Parsing Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible dev script loads and SPA assets
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and specified appUrl
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === config.appUrl) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local Docker & dev
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiter for API
app.use('/api', apiLimiter);

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/dev', devRoutes);

// Production Static Serving
const clientDistPath = path.resolve(__dirname, '../../dist/client');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Start Server if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`  🚀 mrkcp server running on port ${config.port}`);
    console.log(`  🌐 Web App URL: ${config.appUrl}`);
    console.log(`  📡 API Base:   http://localhost:${config.port}/api`);
    console.log(`===============================================`);

    // Start background contest synchronization & reminder scheduler
    schedulerService.start();
  });
}

export default app;
