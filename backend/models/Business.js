// models/Business.js
import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Salon', 'Spa', 'Barbershop', 'Clinic', 'Gym', 'Dentist', 'Massage'],
    required: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/,
      'Invalid Canadian phone number',
    ],
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be a positive number'],
  },
  businessHours: {
    start: { type: String, required: true, trim: true },       // 'HH:mm'
    end: { type: String, required: true, trim: true },         // 'HH:mm'
    slotDuration: { type: Number, default: 60 },               // in minutes
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  bookings: [
    {
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: { type: Date, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  reviews: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Review' 

    }
  ],
},
  { timestamps: true }); // Adds createdAt and updatedAt



export default mongoose.model('Business', businessSchema);