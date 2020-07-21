const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  trail: {
    type: mongoose.Schema.ObjectId,
    ref: 'Trail',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Please enter a review'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'Please enter a rating 1-10'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Only allow one review per user per trail
ReviewSchema.index({ trail: 1, user: 1 }, { unique: true })

// Calculate average rating
ReviewSchema.statics.getAverageRating = async function (trail_id) {
  const obj = await this.aggregate([
    {
      $match: { trail: trail_id },
    },
    {
      $group: {
        _id: '$trail',
        averageRating: { $avg: '$rating' },
      },
    },
  ])

  try {
    await this.model('Trail').findByIdAndUpdate(trail_id, {
      averageRating: obj[0].averageRating,
    })
  } catch (err) {
    console.log(err)
  }
}

// Call getAverageRating after save
ReviewSchema.post('save', function () {
  console.log('saving')
  this.constructor.getAverageRating(this.trail)
})

// Call getAverageRating before remove
// STILL NOT WORKING
ReviewSchema.pre('remove', function () {
  console.log('finding')
  this.constructor.getAverageRating(this.bootcamp)
})

module.exports = mongoose.model('Review', ReviewSchema)
