const User = require('../models/User')
const sendEmail = require('../config/emailer')
const crypto = require('crypto')

// REGISTER
exports.registerUser = async (req, res, next) => {
  const { name, email, password, role } = req.body

  try {
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    })

    // Create JWT
    sendTokenResponse(user, 200, res)
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// LOGIN
exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body

  // Error checking
  if (!email || !password) {
    return next(
      res
        .status(400)
        .json({ success: false, msg: 'Please provide an email and password' }),
    )
  }

  try {
    // Find user and include password in results
    const user = await User.findOne({ email }).select('+password')

    // Error checking
    if (!user) {
      return next(
        res.status(401).json({ success: false, msg: 'Invalid credentials' }),
      )
    }
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return next(
        res.status(401).json({ success: false, msg: 'Invalid credentials' }),
      )
    }

    // Create JWT
    sendTokenResponse(user, 200, res)
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// LOGOUT
exports.logoutUser = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })
  res.status(200).json({ success: true, data: {} })
}

// GET USER
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      next(res.status(400).json({ success: false, msg: 'No current user' }))
    }

    res.status(200).json({ success: true, data: user })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.updateUser = async (req, res, next) => {
  const details = {
    name: req.body.name,
    email: req.body.email,
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, details, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({ success: true, data: updatedUser })
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// FORGOT PASSWORD
exports.forgotPassword = async (req, res, next) => {
  // Find user
  const user = await User.findOne({ email: req.body.email })

  // Error checking
  if (!user) {
    return next(
      res.status(404).json({ success: false, msg: 'No user with that email' }),
    )
  }

  // Generate reset token
  const resetToken = user.getResetToken()

  // Save user
  await user.save({ validateBeforeSave: false })

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/auth/resetpassword/${resetToken}`

  const message = `Password reset requested - make a PUT request to \n\n ${resetUrl}`

  try {
    // Send email using NodeMailer
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message,
    })

    res.status(200).json({ success: true, data: user })
  } catch (err) {
    // Reset user token values and save
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })

    return next(
      res
        .status(500)
        .json({ success: false, msg: 'Email could not be sent', data: user }),
    )
  }
}

// RESET PASSWORD
exports.resetPassword = async (req, res, next) => {
  // Hash token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')

  try {
    // Find user with given token if before 10 min after email was sent
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    // Error checking
    if (!user) {
      return next(
        res.status(400).json({ success: false, msg: 'Invalid token' }),
      )
    }

    // Set password, reset token data, and save
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })

    sendTokenResponse(user, 200, res)
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwt()

  // Set to expire in 30 days
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIR * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') {
    options.secure = true
  }

  return res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  })
}
