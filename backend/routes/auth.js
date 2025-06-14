import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    
    const { name, email, password, role = 'customer' } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send('User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role, // "owner" or "customer"
        });
        await newUser.save();

        res.status(201).send('User registered successfully');
    } catch (err) {
        console.error('❌ Registration error:', err);
        res.status(500).send('Error during registration');
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('User not found');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send('Incorrect password');

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).send('Login error');
    }
});

export default router;