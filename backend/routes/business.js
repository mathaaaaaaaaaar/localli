import express from 'express';
import Business from '../models/Business.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔐 GET all businesses (public)
router.get('/', async (req, res) => {
  try {
    const businesses = await Business.find().populate('owner', 'email');
    res.json(businesses);
  } catch (err) {
    res.status(500).send('Error fetching businesses');
  }
});

// 🔐 GET single business by ID (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate('owner', 'email');
    if (!business) return res.status(404).send('Business not found');
    res.json(business);
  } catch (err) {
    res.status(500).send('Error fetching business');
  }
});

// ✅ POST create business (only owners)
router.post('/', authMiddleware, async (req, res) => {
  if (req.userRole !== 'owner') return res.status(403).send('Only owners can create businesses');
  const { name, description, category, address, phone } = req.body;
  try {
    const business = new Business({
      name,
      description,
      category,
      address,
      phone,
      owner: req.userId,
    });
    await business.save();
    res.status(201).send('Business created successfully');
  } catch (err) {
    res.status(500).send('Error creating business');
  }
});

// ✅ PUT update business (only owners and owner of that business)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).send('Business not found');
    if (req.userRole !== 'owner' || business.owner.toString() !== req.userId)
      return res.status(403).send('Not authorized');

    Object.assign(business, req.body);
    await business.save();
    res.json(business);
  } catch (err) {
    res.status(500).send('Error updating business');
  }
});

// ✅ DELETE business (only owners and owner of that business)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).send('Business not found');
    if (req.userRole !== 'owner' || business.owner.toString() !== req.userId)
      return res.status(403).send('Not authorized');

    await business.deleteOne();
    res.send('Business deleted successfully');
  } catch (err) {
    res.status(500).send('Error deleting business');
  }
});

export default router;