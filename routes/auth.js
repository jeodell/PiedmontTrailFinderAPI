const express = require('express')
const router = express.Router()

const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth')

const { protect } = require('../middleware/auth')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/logout', logoutUser)
router.get('/me', protect, getCurrentUser)
router.put('/updateuser', protect, updateUser)
router.post('/forgotpassword', forgotPassword)
router.put('/resetpassword/:resettoken', resetPassword)

module.exports = router
