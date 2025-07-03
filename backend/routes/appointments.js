// 📁 backend/routes/appointments.js
import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import authMiddleware from '../middleware/authMiddleware.js';
import Business from '../models/Business.js';
import User from '../models/User.js';

const router = express.Router();

const generateSlots = () => {
  const slots = [];
  for (let hour = 11; hour < 18; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push(`${start}-${end}`);
  }
  return slots;
};

// ✅ GET available slots for a business on a date (keep this at the top)
router.get('/:businessId/slots', authMiddleware, async (req, res) => {
  const { businessId } = req.params;
  const { date } = req.query;

  if (!date) return res.status(400).json({ error: 'Date is required' });
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    return res.status(400).json({ error: 'Invalid business ID' });
  }

  try {
    const booked = await Appointment.find({ business: businessId, date });
    const bookedSlots = booked.map(a => a.slot);

    const allSlots = generateSlots();
    const result = allSlots.map(slot => ({
      time: slot,
      available: !bookedSlots.includes(slot),
    }));

    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching slots:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

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
      slot,
      confirmed: false,
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

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const customerId = req.user.id;
    const appointments = await Appointment.find({ customer: customerId })
      .populate('business', 'name address category')
      .sort({ date: 1, slot: 1 });
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching my appointments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/business/:businessId', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ _id: req.params.businessId, owner: req.user.id });
    if (!business) return res.status(403).json({ error: 'Not authorized' });

    const appointments = await Appointment.find({ business: business._id })
      .populate('customer', 'name email')
      .sort({ date: 1, slot: 1 });

    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching business appointments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE and PUT routes come after the slots route
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    if (
      req.user.role === 'customer' && appt.customer.toString() !== req.user.id ||
      req.user.role === 'owner'
    ) {
      await appt.deleteOne();
      res.json({ message: 'Appointment deleted' });
    } else {
      res.status(403).json({ error: 'Not authorized' });
    }
  } catch (err) {
    console.error('❌ Error deleting appointment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { newDate, newSlot } = req.body;

  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    if (
      req.user.role === 'customer' && appt.customer.toString() !== req.user.id ||
      req.user.role === 'owner'
    ) {
      const exists = await Appointment.findOne({
        business: appt.business,
        date: newDate,
        slot: newSlot,
      });
      if (exists) return res.status(409).json({ error: 'Slot already booked' });

      appt.date = newDate;
      appt.slot = newSlot;
      await appt.save();
      res.json({ message: 'Rescheduled successfully' });
    } else {
      res.status(403).json({ error: 'Not authorized' });
    }
  } catch (err) {
    console.error('❌ Error rescheduling appointment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Confirm an appointment (owner only) – keep this last
router.post('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const business = await Business.findById(appt.business);
    if (business.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    appt.confirmed = true;
    await appt.save();
    res.json({ message: 'Appointment confirmed' });
  } catch (err) {
    console.error('❌ Error confirming appointment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;