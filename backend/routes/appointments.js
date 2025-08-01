import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

import authMiddleware from '../middleware/authMiddleware.js';
import transporter from '../middleware/emailer.js';
import Appointment from '../models/Appointment.js';
import Business from '../models/Business.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Generate slots based on business hours and slot duration
function generateSlots(start, end, slotDuration, date, bookedSlots = []) {
  const slots = [];

  const startTime = new Date(`${date}T${start}`);
  const endTime = new Date(`${date}T${end}`);
  let current = new Date(startTime);

  while (current < endTime) {
    const next = new Date(current.getTime() + slotDuration * 60000);
    if (next > endTime) break;

    const slot = `${formatTime(current)}-${formatTime(next)}`;
    slots.push({
      time: slot,
      available: !bookedSlots.includes(slot),
    });

    current = next;
  }

  return slots;
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

// ✅ GET available slots
router.get('/:businessId/slots', authMiddleware, async (req, res) => {
  const { businessId } = req.params;
  const { date } = req.query;

  if (!date) return res.status(400).json({ error: 'Date is required' });
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    return res.status(400).json({ error: 'Invalid business ID' });
  }

  try {
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const hours = business.businessHours;
    if (!hours || !hours.start || !hours.end) {
      return res.status(400).json({ error: 'Business hours not configured' });
    }

    const { start, end, slotDuration = 60 } = hours;

    const booked = await Appointment.find({ business: businessId, date });
    const bookedSlots = booked.map(a => a.slot);

    const slots = generateSlots(start, end, slotDuration, date, bookedSlots);
    res.json(slots);
  } catch (err) {
    console.error('❌ Error fetching slots:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Book appointment
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

    // Send immediate notification
    const business = await Business.findById(businessId);
    if (business) {
      let message = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: #1976d2;
      color: #ffffff;
      text-align: center;
      padding: 20px;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
    }
    .email-body {
      padding: 20px;
      color: #333333;
    }
    .email-body h2 {
      font-size: 20px;
      margin-bottom: 10px;
    }
    .email-body p {
      margin: 10px 0;
      line-height: 1.6;
    }
    .email-footer {
      background-color: #f4f4f4;
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #777777;
    }
    .button {
      display: inline-block;
      background-color: #1976d2;
      color: #ffffff;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin-top: 20px;
      font-size: 16px;
    }
    .button:hover {
      background-color: #155a9c;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <h1>Booking Confirmation</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <h2>Hi!</h2>
      <p>Thank you for booking with <strong>{{businessName}}</strong>! Your appointment has been successfully confirmed.</p>
      <p>Here are the details of your booking:</p>
      <ul>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Time:</strong> {{slot}}</li>
        <li><strong>Location:</strong> {{businessAddress}}</li>
      </ul>
      <p>If you have any questions or need to reschedule, feel free to contact us at <a href="mailto:{{businessEmail}}">{{businessEmail}}</a> or call us at {{businessPhone}}.</p>
      <a href="{{appointmentDetailsLink}}" class="button">View Appointment Details</a>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p>&copy; {{year}} {{businessName}}. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

        message = message
        .replace('{{businessName}}', business.name)
        .replace('{{date}}', date)
        .replace('{{slot}}', slot)
        .replace('{{businessAddress}}', business.address)
        .replace('{{businessEmail}}', business.email)
        .replace('{{businessPhone}}', business.phone)
        .replace('{{year}}', new Date().getFullYear());

      const notification = new Notification({
        user: userId,
        message,
        type: 'booking',
      });
      await notification.save();

      // Send email notification
      try {
        const info = await transporter.sendMail({
          from: process.env.EMAIL_USER || "elliott.wisoky@ethereal.email", // Sender address
          to: req.user.email, // Customer's email address
          subject: 'Booking Confirmation',
          html: message,
        });
        console.log(`Email sent to ${req.user.email}`);
        console.log(req.user);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info)); // Preview email in Ethereal
      } catch (err) {
        console.error(`❌ Error sending email to ${req.user.email}:`, err);
      }
    }

    await Business.findByIdAndUpdate(
      businessId,
      {
        $push: {
          bookings: {
            customer: userId,
            date,
            createdAt: new Date(),
          },
        },
      }
    );

    console.log('Calling scheduleNotifications...');
    console.log('newAppointment instance:', newAppointment);
    console.log('scheduleNotifications method:', newAppointment.scheduleNotifications);
    await newAppointment.scheduleNotifications(); // Schedule notifications

    res.json({ message: 'Appointment booked successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Slot already booked' });
    }
    console.error('❌ Booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get my appointments (for customer)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ customer: req.user.id })
      .populate('business', 'name address category')
      .sort({ date: 1, slot: 1 });
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching my appointments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get appointments for a business (for owner)
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

// ✅ Cancel appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const isCustomer = req.user.role === 'customer' && appt.customer.toString() === req.user.id;
    const isOwner = req.user.role === 'owner' && (
      await Business.exists({ _id: appt.business, owner: req.user.id })
    );

    if (isCustomer || isOwner) {
      await appt.deleteOne();
      console.log(`✅ Appointment ${appt._id} cancelled by ${req.user.role}`);
      return res.json({ message: 'Appointment deleted' });
    }

    return res.status(403).json({ error: 'Not authorized' });
  } catch (err) {
    console.error('❌ Error deleting appointment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Reschedule appointment
router.put('/:id', authMiddleware, async (req, res) => {
  const { newDate, newSlot } = req.body;

  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const isCustomer = req.user.role === 'customer' && appt.customer.toString() === req.user.id;
    const isOwner = req.user.role === 'owner' && (
      await Business.exists({ _id: appt.business, owner: req.user.id })
    );

    if (!(isCustomer || isOwner)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const exists = await Appointment.findOne({
      business: appt.business,
      date: newDate,
      slot: newSlot,
    });

    if (exists) {
      return res.status(409).json({ error: 'Slot already booked' });
    }

    appt.date = newDate;
    appt.slot = newSlot;
    await appt.save();

    console.log(`✅ Appointment ${appt._id} rescheduled to ${newDate} ${newSlot}`);
    res.json({ message: 'Rescheduled successfully' });
  } catch (err) {
    console.error('❌ Error rescheduling appointment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Confirm appointment (Owner only)
router.post('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const business = await Business.findById(appt.business);
    if (!business || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    appt.confirmed = true;
    await appt.save();
    console.log(`✅ Appointment ${appt._id} confirmed by owner`);
    res.json({ message: 'Appointment confirmed' });
  } catch (err) {
    console.error('❌ Error confirming appointment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ NEW: Get all appointments across all businesses for logged-in owner
router.get('/owner/all', authMiddleware, async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user.id });
    const businessIds = businesses.map(b => b._id);

    const appointments = await Appointment.find({ business: { $in: businessIds } })
      .populate('customer', 'name email')
      .populate('business', 'name') // Optional for frontend
      .sort({ date: 1, slot: 1 });

    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching owner all appointments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;