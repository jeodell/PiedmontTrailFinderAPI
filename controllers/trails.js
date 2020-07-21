const path = require('path')
const Trail = require('../models/Trail')
const geocoder = require('../config/geocoder')

// GET ALL
exports.getTrails = async (req, res, next) => {
  try {
    // Filter using req.query
    let params = {}
    if (req.query.name) {
      params = { name: req.query.name.split('_').join(' ') }
    }
    let query = Trail.find(params)
    // Pagination
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 5
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const total = await Trail.countDocuments()
    let pagination = {}
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      }
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      }
    }
    query = query.skip(startIndex).limit(limit)
    const results = await query

    if (!results) {
      return res.status(400).json({ success: false })
    }
    res.status(200).json({
      success: true,
      count: results.length,
      pagination,
      data: results,
      isLoggedIn: req.loggedIn,
    })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// GET ONE
exports.getTrail = async (req, res, next) => {
  try {
    const foundTrail = await Trail.findById(req.params.trail_id)
    if (!foundTrail) {
      return res.status(400).json({ success: false })
    }
    res
      .status(200)
      .json({ success: true, data: foundTrail, isLoggedIn: req.loggedIn })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// CREATE
exports.createTrail = async (req, res, next) => {
  // Add user data from middleware
  req.body.user = req.user.id

  // Create trail
  try {
    const newTrail = await Trail.create(req.body)
    res.status(201).json({
      success: true,
      data: newTrail,
      msg: `Created ${newTrail.name}`,
      isLoggedIn: req.loggedIn,
    })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// UPDATE
exports.updateTrail = async (req, res, next) => {
  console.log(req.params)
  try {
    // Find trail
    let trailToUpdate = await Trail.findById(req.params.trail_id)

    // Error checking
    if (!trailToUpdate) {
      return res.status(400).json({ success: false })
    }

    // User validation
    if (
      trailToUpdate.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        res.status(403).json({
          success: false,
          msg: `User ${req.user.id} is not authorized to update this trail`,
        }),
      )
    }

    // Update trail
    trailToUpdate = await Trail.findByIdAndUpdate(
      req.params.trail_id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    )

    res.status(200).json({
      success: true,
      data: trailToUpdate,
      msg: `Updated ${this.updateTrail.name}`,
      isLoggedIn: req.loggedIn,
    })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// DELETE
exports.deleteTrail = async (req, res, next) => {
  try {
    // Find
    let trailToDelete = await Trail.findById(req.params.trail_id)

    // Error checking
    if (!trailToDelete) {
      res.status(400).json({ success: false })
    }

    // User validation
    if (
      trailToDelete.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        res.status(403).json({
          success: false,
          msg: `User ${req.user.id} is not authorized to delete this trail`,
        }),
      )
    }

    // Delete
    trailToDelete = await Trail.findByIdAndDelete(req.params.trail_id)

    res.status(200).json({
      success: true,
      data: {},
      msg: `Deleted trail ${trailToDelete.name}`,
      isLoggedIn: req.loggedIn,
    })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// NEARBY
exports.getTrailsInRadius = async (req, res, next) => {
  const { zipcode, distance } = req.params

  try {
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const long = loc[0].longitude
    // Radius of Earth = 3963 miles
    const radius = distance / 3963

    const nearbyTrails = await Trail.find({
      location: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
    })

    res.status(200).json({
      success: true,
      count: nearbyTrails.length,
      data: nearbyTrails,
    })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// PHOTO
exports.photoUpload = async (req, res, next) => {
  try {
    const foundTrail = await Trail.findById(req.params.trail_id)

    // Error checking
    if (!foundTrail) {
      return res.status(400).json({ success: false, msg: 'Trail not found' })
    }

    // User validation
    if (
      foundTrail.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        res.status(403).json({
          success: false,
          msg: `User ${req.user.id} is not authorized to delete this trail`,
        }),
      )
    }

    // Check for image
    if (!req.files) {
      return res.status(400).json({ success: false, msg: 'No file' })
    }

    let file = req.files.file

    // Check if valid image
    if (!file.mimetype.startsWith('image')) {
      return res
        .status(400)
        .json({ success: false, msg: 'Not an image file type' })
    }

    // Check image size
    if (file.size > process.env.FILE_UPLOAD_MAX_SIZE) {
      return res.status(400).json({
        success: false,
        msg: `File must be smaller than ${process.env.FILE_UPLOAD_MAX_SIZE} bytes`,
      })
    }

    // Rename the image
    file.name - `photo_${foundTrail._id}${path.parse(file.name).ext}`

    // Move the image to images directory
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, msg: 'Problem uploading file to directory' })
      } else {
        await Trail.findByIdAndUpdate(req.params.trail_id, {
          photo: file.name,
        })

        res.status(200).json({
          success: true,
          data: file.name,
        })
      }
    })
  } catch (err) {
    return res.status(400).json({ success: false, err })
  }
}
