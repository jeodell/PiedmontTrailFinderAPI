const express = require('express')
const router = express.Router()
const {
  getTrail,
  getTrails,
  createTrail,
  updateTrail,
  deleteTrail,
  getTrailsInRadius,
  photoUpload,
} = require('../controllers/trails')

const { protect, authorize } = require('../middleware/auth')

// Re-route to use reviews router
const reviewsRouter = require('./reviews')
router.use('/:trail_id/reviews', reviewsRouter)

router
  .route('/')
  .get(getTrails)
  .post(protect, authorize('publisher', 'admin'), createTrail)
router
  .route('/:trail_id')
  .get(getTrail)
  .put(protect, authorize('publisher', 'admin'), updateTrail)
  .delete(protect, authorize('publisher', 'admin'), deleteTrail)
router
  .route('/:trail_id/photo')
  .put(protect, authorize('publisher', 'admin'), photoUpload)
router.route('/radius/:zipcode/:distance').get(getTrailsInRadius)

module.exports = router
