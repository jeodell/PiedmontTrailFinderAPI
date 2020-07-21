const express = require('express')
const router = express.Router({ mergeParams: true })

const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviews')
const { protect, authorize } = require('../middleware/auth')

router
  .route('/')
  .get(getReviews)
  .post(protect, authorize('user', 'admin'), addReview)
router
  .route('/:review_id')
  .get(getReview)
  .put(protect, authorize('user', 'admin'), updateReview)
  .delete(protect, authorize('user', 'admin'), deleteReview)

module.exports = router
