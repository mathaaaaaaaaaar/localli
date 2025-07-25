// models/Appointment.js
import mongoose from 'mongoose';
import schedule from 'node-schedule';

import Notification from './Notification.js';
import User from './User.js';

const appointmentSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // Format: 'YYYY-MM-DD'
    required: true,
  },
  slot: {
    type: String, // Format: 'HH:mm-HH:mm'
    required: true,
  },
}, { timestamps: true });

// Prevent double-booking
appointmentSchema.index({ business: 1, date: 1, slot: 1 }, { unique: true });

// Method to schedule notifications
appointmentSchema.methods.scheduleNotifications = async function () {
  // console.log(`Scheduling notifications for appointment on ${this.date} at ${this.slot}`);
  const appointmentDateTime = new Date(`${this.date}T${this.slot.split('-')[0]}`); // Start time of the slot
  const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000); // 1 hour before
  const tenMinutesBefore = new Date(appointmentDateTime.getTime() - 10 * 60 * 1000); // 10 minutes before

  // Schedule 1-hour notification
  schedule.scheduleJob(oneHourBefore, async () => {
    console.log(`Sending 1-hour reminder for appointment on ${this.date} at ${this.slot}`);
    await sendNotification(this.customer, `Reminder: Your appointment is in 1 hour.`);
    const business = await mongoose.model('Business').findById(this.business);
    if (business) {
      await sendNotification(business.owner, `Reminder: You have an appointment in 1 hour.`);
    }
  });

  // Schedule 10-minute notification
  schedule.scheduleJob(tenMinutesBefore, async () => {
    await sendNotification(this.customer, `Reminder: Your appointment is in 10 minutes.`);
    const business = await mongoose.model('Business').findById(this.business);
    if (business) {
      await sendNotification(business.owner, `Reminder: You have an appointment in 10 minutes.`);
    }
  });
};

// Helper function to send notifications
async function sendNotification(userId, message) {
  console.log(`Sending notification to user ${userId}: ${message}`);
  const user = await User.findById(userId);
  if (user) {
    const notification = new Notification({ user: userId, message });
    await notification.save();
    console.log(`Notification sent to ${user.name}: ${message}`);
  }
}


const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;