const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Member = require('../models/Member');
const Business = require('../models/Business');

const resolveBusinessIdForUser = async (userId) => {
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId).select('businessId name email phone');
  if (!user) {
    return null;
  }

  if (user.businessId) {
    return String(user.businessId);
  }

  const member = await Member.findOne({ userId: user._id }).sort({ createdAt: 1 }).select('businessId');
  if (member?.businessId) {
    user.businessId = member.businessId;
    await user.save({ validateBeforeSave: false });
    return String(member.businessId);
  }

  const ownedBusiness = await Business.findOne({ ownerId: user._id }).sort({ createdAt: 1 }).select('_id');
  if (ownedBusiness?._id) {
    user.businessId = ownedBusiness._id;
    await user.save({ validateBeforeSave: false });
    await Member.findOneAndUpdate(
      { businessId: ownedBusiness._id, userId: user._id },
      { businessId: ownedBusiness._id, userId: user._id, name: user.name, email: user.email, phone: user.phone || '', role: 'owner' },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return String(ownedBusiness._id);
  }

  return null;
};

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_TOKEN);
    const resolvedBusinessId = decoded.businessId || (await resolveBusinessIdForUser(decoded.id));
    req.user = decoded;
    req.user.businessId = resolvedBusinessId || null;
    req.businessId = resolvedBusinessId || null;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };