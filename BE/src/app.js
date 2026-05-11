/**
 * Cấu hình Express App
 * Gắn tất cả middlewares và routes vào đây
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Import routes
import authRoutes              from './routes/auth.routes.js';
import membersRoutes           from './routes/members.routes.js';
import packagesRoutes          from './routes/packages.routes.js';
import trainersRoutes          from './routes/trainers.routes.js';
import checkinsRoutes          from './routes/checkins.routes.js';
import ptSchedulesRoutes       from './routes/pt-schedules.routes.js';
import ptRegistrationsRoutes   from './routes/pt-registrations.routes.js';
import staffRoutes             from './routes/staff.routes.js';
import revenueRoutes           from './routes/revenue.routes.js';
import qrCheckinRoutes         from './routes/qr-checkin.routes.js';
import notificationsRoutes     from './routes/notifications.routes.js';

// Import error handlers
import { notFound, globalError } from './middlewares/error-handler.js';

const app = express();

// ── Middlewares ────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',              authRoutes);
app.use('/api/members',           membersRoutes);
app.use('/api/packages',          packagesRoutes);
app.use('/api/trainers',          trainersRoutes);
app.use('/api/checkins',          checkinsRoutes);
app.use('/api/pt/schedules',      ptSchedulesRoutes);
app.use('/api/pt/registrations',  ptRegistrationsRoutes);
app.use('/api/staff',             staffRoutes);
app.use('/api/revenue',           revenueRoutes);
app.use('/api/checkin',           qrCheckinRoutes);
app.use('/api/notifications',     notificationsRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '🏋️ Paradise GYM API đang hoạt động',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Error handlers (phải đặt CUỐI CÙNG) ───────────────────
app.use(notFound);
app.use(globalError);

export default app;
