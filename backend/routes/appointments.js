// routes/appointments.js
import express from 'express';
import Appointment from '../models/Appointment.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: generate 1-hour slots between 11 AM and 6 PM
const generateSlots = () => {
  const slots = [];
  for (let hour = 11; hour < 18; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push(`${start}-${end}`);
  }
  return slots;
};

// ✅ GET available slots for a business on a date
router.get('/:businessId/slots', authMiddleware, async (req, res) => {
  const { businessId } = req.params;
  const { date } = req.query; // Format: YYYY-MM-DD

  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    const booked = await Appointment.find({ business: businessId, date });
    const bookedSlots = booked.map(a => a.slot);
    const allSlots = generateSlots();

    const result = allSlots.map(slot => ({
      time: slot,
      available: !bookedSlots.includes(slot)
    }));

    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching slots:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST book an appointment
router.post('/book', authMiddleware, async (req, res) => {
  const { businessId, date, slot } = req.body;
  const userId = req.user.id;

  if (!businessId || !date || !slot) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const newAppointment = new Appointment({
      business: businessId,
      customer: userId,
      date,
      slot
    });
    await newAppointment.save();
    res.json({ message: 'Appointment booked successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Slot already booked' });
    }
    console.error('❌ Booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;