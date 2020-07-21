const express = require('express')
const router = express.Router({ mergeParams: true })

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/users')

const { protect, authorize } = require('../middleware/auth')

// Validate tokens and only allow admin access for all routes
router.use(protect)
router.use(authorize('admin'))

router.route('/').get(getUsers).post(createUser)
router.route('/:user_id').get(getUser).put(updateUser).delete(deleteUser)

module.exports = router
