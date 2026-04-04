import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import seedRoutes from './routes/seed.js';
import seedDefaultAdmin from './utils/seed.js';
import personnelsRoutes from './routes/personnels.js';
import vehiclesRoutes from './routes/vehicles.js';
import destinationsRoutes from './routes/destinations.js';
import deliveryChargesRoutes from './routes/deliveryCharges.js';
import deliveriesRoutes from './routes/deliveries.js';
import assignPersonnelRoutes from './routes/assignPersonnel.js';
import purchasesRoutes from './routes/purchases.js';
import deliveryRequestsRoutes from './routes/deliveryRequests.js';
import usersRoutes from './routes/users.js';

const app = express();

// Allow specific origins and credentials
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://logistic-monitoring-system.vercel.app',
    'https://logitrack-app.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serverless-friendly MongoDB connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected');
    // Seed default admin account on first connection
    await seedDefaultAdmin();
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Ensure DB is connected before handling any requests
app.use(async (req, res, next) => {
  await connectDB();
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

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
