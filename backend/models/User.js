// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['owner', 'customer'],
    default: 'customer',
    required: true,
  },
  avatar: {
    type: String,
    default: 'https://i.pravatar.cc/100',
  },
}, { timestamps: true });

// ✅ Ensure model is only registered once
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;