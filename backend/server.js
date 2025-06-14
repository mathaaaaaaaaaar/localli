import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authMiddleware from './middleware/authMiddleware.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const corsOptions = {
  origin: 'http://localhost:8081/register', // Replace with your frontend's origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies and credentials
};

const app = express();

app.use(cors(corsOptions)); // Optional: helps if calling from mobile/web

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:8081'); // Allow frontend origin
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allowed methods
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allowed headers
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200); // Respond OK to preflight requests
//   }
//   next();
// });

// app.options('*', cors(corsOptions)); // Handle preflight requests

app.use(express.json());

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ✅ Root route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// ✅ Auth and Business routes
app.use('/auth', authRoutes);
app.use('/businesses', businessRoutes);

// ✅ Profile endpoint
app.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
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

// 🧪 Dummy Service routes
app.get('/services', (req, res) => res.send('Fetch all services'));
app.post('/services', (req, res) => res.send('Add a new service'));

// 🧪 Dummy Booking routes
app.get('/bookings', (req, res) => res.send('Fetch all bookings'));
app.post('/bookings', (req, res) => res.send('Create a new booking'));
app.get('/bookings/:id', (req, res) => res.send(`Fetch details of booking with ID: ${req.params.id}`));

// 🧪 Dummy Availability routes
app.get('/availabilities/:businessId', (req, res) => res.send(`Fetch availability slots for business ID: ${req.params.businessId}`));
app.post('/availabilities', (req, res) => res.send('Add availability slots for a business'));

// ✅ Start server
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});