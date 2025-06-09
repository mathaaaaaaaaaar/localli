import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
console.log('✅ Loaded MONGO_URI:', process.env.MONGO_URI); // <--- ADD THIS
const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB error:', err));

// Root route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Auth routes
app.use('/auth', authRoutes);

// Business routes (real MongoDB logic)
app.use('/businesses', businessRoutes);

// Dummy Service routes
app.get('/services', (req, res) => {
    res.send('Fetch all services');
});

app.post('/services', (req, res) => {
    res.send('Add a new service');
});

// Dummy Booking routes
app.get('/bookings', (req, res) => {
    res.send('Fetch all bookings');
});

app.post('/bookings', (req, res) => {
    res.send('Create a new booking');
});

app.get('/bookings/:id', (req, res) => {
    res.send(`Fetch details of booking with ID: ${req.params.id}`);
});

// Dummy Availability routes
app.get('/availabilities/:businessId', (req, res) => {
    res.send(`Fetch availability slots for business ID: ${req.params.businessId}`);
});

app.post('/availabilities', (req, res) => {
    res.send('Add availability slots for a business');
});

app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});