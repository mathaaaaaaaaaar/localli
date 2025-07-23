import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// ✅ Register
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'customer', avatar } = req.body;

  try {
    console.log('📥 Registration request:', { name, email, role });
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 Hashed password created');

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      avatar,
    });

    await newUser.save();
    console.log('✅ New user saved:', newUser.email);
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('❌ Registration error:', err.message);
    res.status(500).json({ message: 'Error during registration' });
  }
});

// ✅ Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('🔐 Login attempt for:', email);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 Password match:', isMatch);

    if (!isMatch) {
      console.log('❌ Incorrect password');
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
      },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1h' }
    );

    console.log('✅ Login successful');
    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Login error' });
  }
});

// ✅ Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('👤 Fetching profile for ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('❌ Profile fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// ✅ Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.avatar) updates.avatar = req.body.avatar;
    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, 10);
      console.log('🔐 Password updated for:', req.user.id);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select('-password');

    // Return fresh token
    const token = jwt.sign(
      {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar || '',
      },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1h' }
    );

    console.log('✅ Profile updated for:', req.user.id);
    res.json({ token });
  } catch (err) {
    console.error('❌ Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ✅ Delete account
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    console.log('🗑️ User deleted:', req.user.id);
    res.json({ message: 'User account deleted' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;