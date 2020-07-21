const User = require('../models/User')

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()

    res.status(200).json({ success: true, data: users })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.user_id)

    res.status(200).json({ success: true, data: user })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body)

    res.status(200).json({ success: true, data: user })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.user_id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({ success: true, data: user })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, data: {} })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}
