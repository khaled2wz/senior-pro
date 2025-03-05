const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { validateRating, validateRatingUpdate } = require('../middleware/ratingValidation');
const Rating = require('../Models/Rating');
const Destination = require('../Models/Destination');
const { Restaurant } = require('../Models/Restaurant');
const {
  addRating,
  updateRating,
  deleteRating,
  getItemRatings,
  getUserRatings,
  toggleLike
} = require('../Controllers/ratingController');

// Protected routes
router.post('/', protect, validateRating, addRating);
router.put('/:id', protect, validateRatingUpdate, updateRating);
router.delete('/:id', protect, deleteRating);
router.get('/user/ratings', protect, getUserRatings);
router.post('/:id/like', protect, toggleLike);

// Admin routes
router.get('/moderation/queue', protect, admin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    
    const ratings = await Rating.find({ status })
      .populate('userId', 'name')
      .populate({
        path: 'itemId',
        select: 'name title',
        model: function(doc) {
          return doc.itemType === 'destination' ? 'Destination' : 'Restaurant';
        }
      })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Rating.countDocuments({ status });

    res.status(200).json({
      ratings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalRatings: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/moderation/:id', protect, admin, async (req, res) => {
  try {
    const { status, moderationNotes } = req.body;
    
    if (!['pending', 'approved', 'flagged', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const rating = await Rating.findByIdAndUpdate(
      req.params.id,
      { status, moderationNotes },
      { new: true }
    );

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Recalculate average rating if status changes affect visibility
    if (['approved', 'rejected'].includes(status)) {
      const { itemId, itemType } = rating;
      const Model = itemType === 'destination' ? Destination : Restaurant;
      
      const ratings = await Rating.find({ 
        itemId, 
        itemType,
        status: { $in: ['approved', 'pending'] }
      });
      const averageRating = ratings.length > 0 
        ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
        : 0;

      await Model.findByIdAndUpdate(itemId, { 
        rating: averageRating,
        ...(itemType === 'restaurant' && { reviews: ratings.length })
      });
    }

    res.status(200).json(rating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public routes - must be last due to :itemType/:itemId pattern
router.get('/:itemType/:itemId', getItemRatings);

module.exports = router;
