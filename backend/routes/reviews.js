import express from 'express';
import mongoose from 'mongoose';

import authMiddleware from '../middleware/authMiddleware.js';
import Business from '../models/Business.js';
import Review from '../models/Reviews.js';

const router = express.Router();

// ✅ Add a review
router.post('/:businessId', authMiddleware, async (req, res) => {
  const { businessId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    return res.status(400).json({ error: 'Invalid business ID.' });
  }

  try {
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found.' });
    }

    // Check if the user has already reviewed this business
    const existingReview = await Review.findOne({ business: businessId, customer: userId });
    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this business.' });
    }

    // Create a new review
    const review = new Review({
      business: businessId,
      customer: userId,
      rating,
      comment,
    });

    await review.save();

    // Add the review to the business
    business.reviews.push(review._id);
    await business.save();

    res.status(201).json({ message: 'Review added successfully.', review });
  } catch (err) {
    console.error('❌ Error adding review:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /businesses/:id/reviews - Get all reviews for a business
router.get('/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
  
      const reviews = await Reviews.find({ business: id }).populate('user', 'name');
      res.status(200).json(reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

export default router;