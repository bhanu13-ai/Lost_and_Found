import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { closeDatabase, initDatabase } from './server/config/db.ts';
import authRoutes from './server/routes/auth.ts';
import itemsRoutes from './server/routes/items.ts';
import claimsRoutes from './server/routes/claims.ts';
import uploadRoutes from './server/routes/upload.ts';
import notificationsRoutes from './server/routes/notifications.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const dbInfo = await initDatabase();

  app.use(cors());
  app.use(express.json({ limit: '6mb' }));
  app.use(express.urlencoded({ extended: true }));

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', databaseMode: dbInfo.mode, dbName: dbInfo.dbName });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/items', itemsRoutes);
  app.use('/api/claims', claimsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/notifications', notificationsRoutes);

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sai University Lost & Found Portal running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    await closeDatabase();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
