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
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be a positive number'],
  },
  businessHours: {
    start: { type: String, required: true },         // Format: 'HH:mm'
    end: { type: String, required: true },           // Format: 'HH:mm'
    slotDuration: { type: Number, default: 60 },     // Duration in minutes
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Business', businessSchema);