import express from 'express';
import Business from '../models/Business.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all businesses
router.get('/', async (req, res) => {
    try {
        const businesses = await Business.find().populate('owner', 'email');
        res.json(businesses);
    } catch (err) {
        res.status(500).send('Error fetching businesses');
    }
});

// POST create a new business (protected)
router.post('/', authMiddleware, async (req, res) => {
    const { name, description, category, address, phone } = req.body;
    try {
        const business = new Business({
            name,
            description,
            category,
            address,
            phone,
            owner: req.userId // coming from JWT token
        });
        await business.save();
        res.status(201).send('Business created successfully');
    } catch (err) {
        console.error('❌ Error creating business:', err.message);
        res.status(500).send('Error creating business');
    }
});

export default router;