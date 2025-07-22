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

  const { name, description, category, address, phone, price } = req.body;

  try {
    const business = new Business({
      name,
      description,
      category,
      address,
      phone,
      price,
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

// ✅ POST book a service (only customers)
router.post('/:id/book', authMiddleware, async (req, res) => {
  if (req.user.role !== 'customer') {
    console.warn('🚫 Rejected: Not a customer');
    return res.status(403).json({ message: 'Only customers can book services' });
  }

  const { date } = req.body;

  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const booking = {
      customer: req.user.id,
      date,
    };

    business.bookings.push(booking);
    await business.save();

    res.status(201).json({ message: 'Service booked successfully', booking });
  } catch (err) {
    console.error('❌ Error booking service:', err.message);
    res.status(500).json({ message: 'Error booking service' });
  }
});

// ✅ GET bookings for a business (role-based visibility)
router.get('/:id/bookings', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate('bookings.customer', 'name email');
    if (!business) return res.status(404).json({ message: 'Business not found' });

    if (req.user.role === 'owner') {
      // Owners see all bookings
      return res.json(business.bookings);
    } else if (req.user.role === 'customer') {
      // Customers see only available times
      const bookedDates = business.bookings.map((booking) => booking.date);
      const availableTimes = generateAvailableTimes(bookedDates); // Implement logic to generate available times
      return res.json({ availableTimes });
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }
  } catch (err) {
    console.error('❌ Error fetching bookings:', err.message);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating } = req.body;

    if (!comment || !rating) {
      return res.status(400).json({ error: 'Comment and rating are required.' });
    }

    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found.' });
    }

    const review = new Review({
      business: id,
      user: req.user.id,
      comment,
      rating,
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /businesses/:id/reviews - Get all reviews for a business
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({ business: id }).populate('user', 'name');
    res.status(200).json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Helper function to generate available times
function generateAvailableTimes(bookedDates) {
  const allTimes = []; // Define all possible times (e.g., 9 AM to 5 PM)
  const availableTimes = allTimes.filter((time) => !bookedDates.includes(time));
  return availableTimes;
}

export default router;