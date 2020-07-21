const jwt = require('jsonwebtoken')
const User = require('../models/User')

exports.protect = async (req, res, next) => {
  let token

  // Extracting token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.token) {
    token = req.cookies.token
  }

  // Error checking
  if (!token) {
    return res.status(401).json({ success: false, msg: 'Not authorized' })
  }

  // Verify token and find user
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    next()
  } catch (err) {
    res.status(400).json({ success: false, err })
  }
}

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        res.status(403).json({
          success: false,
          msg: `User role ${req.user.role} is not authorized to perform this action`,
        }),
      )
    }
    next()
  }
}
