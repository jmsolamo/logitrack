import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import { getPool } from './db/pool.js';
import seedDefaultAdmin from './utils/seed.js';
import authRoutes from './routes/auth.js';
import seedRoutes from './routes/seed.js';
import personnelsRoutes from './routes/personnels.js';
import vehiclesRoutes from './routes/vehicles.js';
import destinationsRoutes from './routes/destinations.js';
import deliveryChargesRoutes from './routes/deliveryCharges.js';
import deliveriesRoutes from './routes/deliveries.js';
import assignPersonnelRoutes from './routes/assignPersonnel.js';
import purchasesRoutes from './routes/purchases.js';
import deliveryRequestsRoutes from './routes/deliveryRequests.js';
import usersRoutes from './routes/users.js';
import announcementsRoutes from './routes/announcements.js';
import dashboardRoutes from './routes/dashboard.js';
import historyRoutes from './routes/history.js';
import departmentsRoutes from './routes/departments.js';

const app = express();
app.set('trust proxy', true);

// Build allowed origins from env var + defaults
const defaultOrigins = [
  'http://localhost:3000',
  'https://logistic-monitoring-system.vercel.app',
  'https://logitrack-app.vercel.app',
];
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];
const allowedOrigins = [...defaultOrigins, ...envOrigins];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

let dbReady = false;
const connectDb = async () => {
  if (dbReady) return;
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    dbReady = true;
    console.log('MySQL connected');
    await seedDefaultAdmin();
  } catch (error) {
    console.error('MySQL connection error:', error);
  }
};

app.use(async (req, res, next) => {
  await connectDb();
  next();
});

app.get('/', (req, res) => {
  res.send('server is running');
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/personnels', personnelsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/destinations', destinationsRoutes);
app.use('/api/delivery-charges', deliveryChargesRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/deliveries', assignPersonnelRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/delivery-requests', deliveryRequestsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/departments', departmentsRoutes);

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
