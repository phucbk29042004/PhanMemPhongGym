/**
 * Entry Point — Paradise GYM Backend
 * Khởi động server và load biến môi trường
 */

import 'dotenv/config';
import app from './src/app.js';
import { startCronJob } from './src/jobs/cron-pt-confirm.js';
import { startDailyCronJobs } from './src/jobs/cron-daily.js';

const PORT = process.env.PORT || 3000;

// Khởi động cron jobs
startCronJob();
startDailyCronJobs();

app.listen(PORT, () => {
  console.log('');
  console.log('🏋️  ════════════════════════════════════════════');
  console.log('🏋️   PARADISE GYM BACKEND API');
  console.log(`🏋️   Đang chạy tại: http://localhost:${PORT}`);
  console.log(`🏋️   Môi trường:    ${process.env.NODE_ENV || 'development'}`);
  console.log('🏋️  ════════════════════════════════════════════');
  console.log('');
  console.log('📋 API Endpoints:');
  console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET    http://localhost:${PORT}/api/members`);
  console.log(`   GET    http://localhost:${PORT}/api/packages`);
  console.log(`   GET    http://localhost:${PORT}/api/trainers`);
  console.log(`   GET    http://localhost:${PORT}/api/checkins`);
  console.log(`   GET    http://localhost:${PORT}/api/pt/schedules`);
  console.log(`   GET    http://localhost:${PORT}/api/revenue`);
  console.log(`   GET    http://localhost:${PORT}/api/health`);
  console.log('');
});
