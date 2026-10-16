import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';

import { getSupabase, isSupabaseConfigured } from './db/supabase.js';
import { seedDefaultAdmin } from './repositories/users.js';
import authRoutes from './routes/auth.js';
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
  'http://localhost:5173',
  'https://logitrack-ops.vercel.app',
  'https://logitrack-app.vercel.app',
  'https://logistic-monitoring-system.vercel.app',
];
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];
const allowedOrigins = [...defaultOrigins, ...envOrigins];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Exact match in whitelist
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow all vercel deployment subdomains and localhost on any port
    if (
      /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

let supabaseReady = false;

const connectDb = async () => {
  if (supabaseReady) return;
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.warn('[Supabase] Connected to project, but query returned:', error.message);
    } else {
      supabaseReady = true;
      console.log('[Supabase] Connected successfully to Supabase!');
      await seedDefaultAdmin();
    }
  } catch (err) {
    console.error('[Supabase] Connection error:', err.message);
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
  res.json({
    status: 'ok',
    message: 'Server is running',
    database: {
      supabaseConfigured: isSupabaseConfigured(),
      supabaseReady,
    },
  });
});

app.use('/api/auth', authRoutes);
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

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
