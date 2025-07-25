import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Business from '../models/Business.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

// ✅ GET all businesses with filters, search, and sort
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'name_asc') sortOption = { name: 1 };
    if (sort === 'name_desc') sortOption = { name: -1 };
    if (sort === 'latest') sortOption = { createdAt: -1 };

    const businesses = await Business.find(filter)
      .populate('owner', 'email')
      .sort(sortOption)
      .lean();

    const enhancedBusinesses = await Promise.all(
      businesses.map(async (b) => {
        const totalAppointments = await Appointment.countDocuments({ business: b._id });
        return { ...b, totalAppointments };
      })
    );

    res.json(enhancedBusinesses);
  } catch (err) {
    console.error('❌ Error fetching businesses:', err.message);
    res.status(500).json({ error: 'Error fetching businesses' });
  }
});

// ✅ GET single business by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate('owner', 'email');
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json(business);
  } catch (err) {
    console.error('❌ Error fetching business:', err.message);
    res.status(500).json({ error: 'Error fetching business' });
  }
});

// ✅ Create business (owner only)
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only owners can create businesses' });
  }

  const { name, description, category, address, phone, price, businessHours } = req.body;

  try {
    const business = new Business({
      name,
      description,
      category,
      address,
      phone,
      price,
      businessHours,
      owner: req.user.id,
    });

    await business.save();
    res.status(201).json({ message: 'Business created successfully', business });
  } catch (err) {
    console.error('❌ Error creating business:', err.message);
    // 👇 Return validation error to frontend
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Error creating business' });
  }
});

// ✅ Update business
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });

    if (req.user.role !== 'owner' || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(business, req.body);
    await business.save();
    res.json({ message: 'Business updated', business });
  } catch (err) {
    console.error('❌ Error updating business:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Error updating business' });
  }
});

// ✅ Delete business
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });

    if (req.user.role !== 'owner' || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await business.deleteOne();
    res.json({ message: 'Business deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting business:', err.message);
    res.status(500).json({ error: 'Error deleting business' });
  }
});

// ✅ Legacy Book service (not used if using appointments)
router.post('/:id/book', authMiddleware, async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can book services' });
  }

  const { date } = req.body;

  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const booking = {
      customer: req.user.id,
      date,
    };

    business.bookings.push(booking);
    await business.save();

    res.status(201).json({ message: 'Service booked successfully', booking });
  } catch (err) {
    console.error('❌ Error booking service:', err.message);
    res.status(500).json({ error: 'Error booking service' });
  }
});

// ✅ Legacy Get bookings
router.get('/:id/bookings', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('bookings.customer', 'name email');

    if (!business) return res.status(404).json({ error: 'Business not found' });

    if (req.user.role !== 'owner' || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(business.bookings);
  } catch (err) {
    console.error('❌ Error fetching bookings:', err.message);
    res.status(500).json({ error: 'Error fetching bookings' });
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