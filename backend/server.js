import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

import authMiddleware from './middleware/authMiddleware.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';
import appointmentRoutes from './routes/appointments.js'; // ✅ NEW

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const corsOptions = {
  origin: 'http://localhost:8081', // Replace with your frontend's origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ✅ Root route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// ✅ Main routes
app.use('/auth', authRoutes);
app.use('/businesses', businessRoutes);
app.use('/appointments', appointmentRoutes); // ✅ ADDED

// ✅ Profile endpoint
app.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch {
    res.status(500).send('Error fetching profile');
  }
});

// ✅ Get all users (optional filtering by role)
app.get('/user/all', authMiddleware, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).send('Error fetching users');
  }
});

// 🧪 Dummy Service routes (can remove later)
app.get('/services', (req, res) => res.send('Fetch all services'));
app.post('/services', (req, res) => res.send('Add a new service'));

// 🧪 Dummy Booking routes (can remove later)
app.get('/bookings', (req, res) => res.send('Fetch all bookings'));
app.post('/bookings', (req, res) => res.send('Create a new booking'));
app.get('/bookings/:id', (req, res) => res.send(`Fetch details of booking with ID: ${req.params.id}`));

// 🧪 Dummy Availability routes (can remove later)
app.get('/availabilities/:businessId', (req, res) => res.send(`Fetch availability slots for business ID: ${req.params.businessId}`));
app.post('/availabilities', (req, res) => res.send('Add availability slots for a business'));

// ✅ Start server
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});