import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Business from '../models/Business.js';

const router = express.Router();

// ✅ GET all businesses with filters, search, and sort
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' }; // case-insensitive search
    }

    if (category) {
      filter.category = category;
    }

    let sortOption = { createdAt: -1 }; // default to latest
    if (sort === 'name_asc') sortOption = { name: 1 };
    if (sort === 'name_desc') sortOption = { name: -1 };
    if (sort === 'latest') sortOption = { createdAt: -1 };

    const businesses = await Business.find(filter)
      .populate('owner', 'email')
      .sort(sortOption);

    res.json(businesses);
  } catch (err) {
    console.error('❌ Error fetching businesses:', err.message);
    res.status(500).json({ message: 'Error fetching businesses' });
  }
});

// ✅ GET single business by ID (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate('owner', 'email');
    if (!business) return res.status(404).json({ message: 'Business not found' });
    res.json(business);
  } catch (err) {
    console.error('❌ Error fetching business:', err.message);
    res.status(500).json({ message: 'Error fetching business' });
  }
});

// ✅ POST create business (only owners)
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'owner') {
    console.warn('🚫 Rejected: Not an owner');
    return res.status(403).json({ message: 'Only owners can create businesses' });
  }

  const { name, description, category, address, phone } = req.body;

  try {
    const business = new Business({
      name,
      description,
      category,
      address,
      phone,
      owner: req.user.id,
    });

    await business.save();
    res.status(201).json({ message: 'Business created successfully', business });
  } catch (err) {
    console.error('❌ Error creating business:', err.message);
    res.status(500).json({ message: 'Error creating business' });
  }
});

// ✅ PUT update business (only owner who owns the business)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    if (req.user.role !== 'owner' || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(business, req.body);
    await business.save();
    res.json({ message: 'Business updated', business });
  } catch (err) {
    console.error('❌ Error updating business:', err.message);
    res.status(500).json({ message: 'Error updating business' });
  }
});

// ✅ DELETE business (only owner who owns the business)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    if (req.user.role !== 'owner' || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await business.deleteOne();
    res.json({ message: 'Business deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting business:', err.message);
    res.status(500).json({ message: 'Error deleting business' });
  }
});

export default router;