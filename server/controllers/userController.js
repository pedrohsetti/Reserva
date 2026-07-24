const mongoose = require('mongoose')
const asyncHandler = require('express-async-handler')
const User = require('../models/User')
const Business = require('../models/Business')
const Member = require('../models/Member')
const { isDevEmail, applyDevRole } = require('../utils/devRole')

const allowedRoles = new Set(User.schema.path('role').enumValues)

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Dev
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -refreshToken')
  res.status(200).json({ users })
})

// @desc    Get current user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user)
})

// @desc    Update a user by ID
// @route   PUT /api/users/:id
// @access  Private/Admin/Owner
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  const user = await User.findById(id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  const updates = {}
  let membershipShouldSync = false

  if (hasOwn(req.body, 'name')) {
    const name = String(req.body.name || '').trim()
    if (!name) {
      return res.status(400).json({ message: 'Name cannot be empty' })
    }
    updates.name = name
  }

  if (hasOwn(req.body, 'email')) {
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ message: 'Email cannot be empty' })
    }

    const existingUser = await User.findOne({ email, _id: { $ne: user._id } })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    updates.email = email
  }

  if (hasOwn(req.body, 'role')) {
    const role = String(req.body.role || '').trim()
    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }
    if (role === 'dev' && !isDevEmail(hasOwn(req.body, 'email') ? String(req.body.email || '').trim().toLowerCase() : user.email)) {
      return res.status(400).json({ message: 'Dev role is reserved for the configured developer email' })
    }
    updates.role = role
  }

  if (hasOwn(req.body, 'businessId')) {
    const rawBusinessId = req.body.businessId

    if (rawBusinessId === null || rawBusinessId === '') {
      updates.businessId = null
      membershipShouldSync = true
    } else {
      if (!mongoose.Types.ObjectId.isValid(rawBusinessId)) {
        return res.status(400).json({ message: 'Invalid business ID' })
      }

      const business = await Business.findById(rawBusinessId)
      if (!business) {
        return res.status(404).json({ message: 'Business not found' })
      }

      updates.businessId = business._id
      membershipShouldSync = true
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'At least one editable field is required' })
  }

  const previousBusinessId = user.businessId ? String(user.businessId) : null

  Object.assign(user, updates)
  applyDevRole(user)
  await user.save({ validateBeforeSave: true })

  const nextBusinessId = user.businessId ? String(user.businessId) : null
  const roleChanged = hasOwn(updates, 'role')
  const businessChanged = previousBusinessId !== nextBusinessId

  if (membershipShouldSync || roleChanged || businessChanged) {
    if (!nextBusinessId || user.role === 'dev') {
      await Member.deleteMany({ userId: user._id })
    } else {
      await Member.deleteMany({ userId: user._id, businessId: { $ne: user.businessId } })
      await Member.findOneAndUpdate(
        { businessId: user.businessId, userId: user._id },
        { businessId: user.businessId, userId: user._id, role: user.role },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      )
    }
  }

  const updatedUser = await User.findById(user._id).select('-password -refreshToken')

  return res.json({ user: updatedUser })
})

module.exports = {
  getUsers,
  getMe,
  updateUser,
}