const mongoose = require('mongoose')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Staff = require('../models/Staff')
const Customer = require('../models/Customer')
const Business = require('../models/Business')
const Member = require('../models/Member')
const { isDevEmail, applyDevRole } = require('../utils/devRole')

const allowedRoles = new Set(User.schema.path('role').enumValues)

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

const buildSharedProfileFields = (user) => {
  const fields = {
    name: user.name,
    email: user.email,
    phone: user.phone || '',
  }

  if (user.businessId) {
    fields.businessId = user.businessId
  }

  return fields
}

const syncLinkedRecords = async (user) => {
  const sharedFields = buildSharedProfileFields(user)

  await Promise.all([
    Staff.updateMany({ userId: user._id }, { $set: sharedFields }, { runValidators: true }),
    Customer.updateMany({ userId: user._id }, { $set: sharedFields }, { runValidators: true }),
  ])

  if (!user.businessId || user.role === 'dev') {
    await Member.deleteMany({ userId: user._id })
    return
  }

  await Member.updateMany(
    { userId: user._id },
    {
      $set: {
        ...sharedFields,
        businessId: user.businessId,
        role: user.role,
      },
    },
    { runValidators: true }
  )

  await Member.findOneAndUpdate(
    { businessId: user.businessId, userId: user._id },
    {
      businessId: user.businessId,
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  )
}

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
  const user = await User.findById(req.user.id).select('-password -refreshToken')

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  res.status(200).json({
    ...user.toObject(),
    id: String(user._id),
  })
})

// @desc    Update a user by ID
// @route   PUT /api/users/:id
// @access  Private/Admin/Owner
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  const canEditAnyUser = ['dev', 'admin', 'owner'].includes(req.user.role)

  if (!canEditAnyUser && String(req.user.id) !== String(id)) {
    return res.status(403).json({ message: 'Not authorized to update this user' })
  }

  if (!canEditAnyUser) {
    const attemptedRestrictedUpdate = ['role', 'businessId', 'email'].some((field) => hasOwn(req.body, field))
    if (attemptedRestrictedUpdate) {
      return res.status(403).json({ message: 'Not authorized to update restricted profile fields' })
    }
  }

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

  if (hasOwn(req.body, 'phone')) {
    updates.phone = String(req.body.phone || '').trim()
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

  Object.assign(user, updates)
  applyDevRole(user)
  await user.save({ validateBeforeSave: true })

  await syncLinkedRecords(user)

  const updatedUser = await User.findById(user._id).select('-password -refreshToken')

  return res.json({ user: updatedUser })
})

// @desc Get a user by ID
// @route GET /api/users/:id
// @access Private/Admin/Owner

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  const user = await User.findById(id).select('-password -refreshToken')

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  res.json({ user })
})

// @desc    Change user password
// @route   PATCH /api/users/:id/password
// @access  Private/Self-only
const changePassword = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { currentPassword, newPassword, confirmPassword } = req.body

  // Validate that user can only change their own password
  if (String(req.user.id) !== String(id) && req.user.role !== 'dev') {
    return res.status(403).json({ message: 'Not authorized to change this password' })
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  // Validate required fields
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Current password, new password, and confirmation are required' })
  }

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New passwords do not match' })
  }

  // Validate new password is different from current
  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password must be different from current password' })
  }

  // Validate password strength (at least 8 characters)
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' })
  }

  // Get user with password field
  const user = await User.findById(id).select('+password')
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Verify current password
  const passwordMatches = await bcrypt.compare(currentPassword, user.password)
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Current password is incorrect' })
  }

  // Hash and update new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  user.password = hashedPassword
  await user.save({ validateBeforeSave: false })

  res.json({ message: 'Password changed successfully' })
})

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private/Self-only or Dev/Admin
const deleteAccount = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { password } = req.body

  // Validate that user can only delete their own account or dev/admin
  if (String(req.user.id) !== String(id) && req.user.role !== 'dev' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this account' })
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  // Validate password confirmation
  if (!password) {
    return res.status(400).json({ message: 'Password confirmation is required' })
  }

  // Get user with password field
  const user = await User.findById(id).select('+password')
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Verify password
  const passwordMatches = await bcrypt.compare(password, user.password)
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Password is incorrect' })
  }

  // Mark user as deleted instead of hard delete to preserve referential integrity
  user.status = 'deleted'
  await user.save({ validateBeforeSave: false })

  // Soft-delete related records
  await Staff.deleteMany({ userId: user._id })
  await Customer.deleteMany({ userId: user._id })
  await Member.deleteMany({ userId: user._id })

  res.json({ message: 'Account deleted successfully' })
})

// @desc    Get user permissions and role info
// @route   GET /api/users/:id/permissions
// @access  Private/Self-only or Dev/Admin
const getPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate that user can only view their own permissions or dev/admin
  if (String(req.user.id) !== String(id) && req.user.role !== 'dev' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view these permissions' })
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  const user = await User.findById(id).select('-password -refreshToken')
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Define role-based permissions
  const rolePermissions = {
    dev: ['view_all_users', 'manage_all_users', 'manage_businesses', 'manage_roles', 'system_settings'],
    admin: ['manage_users', 'manage_businesses', 'manage_staff', 'manage_customers', 'view_reports'],
    owner: ['manage_business', 'manage_staff', 'manage_customers', 'manage_services', 'manage_appointments', 'view_reports'],
    staff: ['manage_appointments', 'view_customers', 'manage_services'],
    customer: ['view_appointments', 'manage_profile', 'book_services'],
  }

  const permissions = rolePermissions[user.role] || []

  res.json({
    role: user.role,
    permissions,
    status: user.status,
    businessId: user.businessId || null,
    email: user.email,
    name: user.name,
  })
})

module.exports = {
  getUsers,
  getMe,
  updateUser,
  getUserById,
  changePassword,
  deleteAccount,
  getPermissions,
}
