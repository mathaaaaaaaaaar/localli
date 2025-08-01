import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// ✅ GET /user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('❌ Fetch profile error:', err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// ✅ PUT /user/profile (update name/avatar/password + return new token)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, password } = req.body;

    if (!name && !avatar && !password) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
    }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error('❌ Update profile error:', err.message);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// ✅ DELETE /user
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

export default router;