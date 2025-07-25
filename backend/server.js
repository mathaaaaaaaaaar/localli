import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import appointmentRoutes from './routes/appointments.js';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';
import reviewRoutes from './routes/reviews.js';
import userRoutes from './routes/user.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const corsOptions = {
  origin: 'http://localhost:8081',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ✅ Root
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// ✅ Routes
app.use('/auth', authRoutes);
app.use('/businesses', businessRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/user', userRoutes);
app.use('/api/reviews', reviewRoutes);

// ✅ Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Start
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});