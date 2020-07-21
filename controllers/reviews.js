const Review = require('../models/Review')
const Trail = require('../models/Trail')

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()

    res.status(200).json({ success: true, data: reviews })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.review_id)

    res.status(200).json({ success: true, data: review })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.addReview = async (req, res, next) => {
  try {
    req.body.trail = req.params.trail_id
    req.body.user = req.user.id

    const trail = await Trail.findById(req.params.trail_id)

    if (!trail) {
      return next(
        res.status(404).json({ success: false, msg: 'Trail not found' }),
      )
    }

    const review = await Review.create(req.body)

    res.status(201).json({ success: true, data: review })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.review_id)

    if (!review) {
      return next(
        res.status(404).json({ success: false, msg: 'Review not found' }),
      )
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        res.status(401).json({
          success: false,
          msg: 'Current user is not authorized to update the review',
        }),
      )
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.review_id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    )

    res.status(200).json({ success: true, data: updatedReview })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.review_id)

    if (!review) {
      return next(
        res.status(404).json({ success: false, msg: 'Review not found' }),
      )
    }

    await Review.findByIdAndDelete(req.params.review_id)

    res.status(200).json({ success: true, data: {} })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}
