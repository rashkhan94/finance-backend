const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Get paginated list of all users (admin use).
 */
const getAllUsers = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments({ isDeleted: false }),
  ]);

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      limit,
    },
  };
};

/**
 * Get a single user by ID.
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  return user;
};

/**
 * Update user details (role, status, name).
 * Admins cannot demote themselves to prevent lockout situations.
 */
const updateUser = async (userId, updates, requestingUserId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  // prevent admin from changing their own role (safety measure)
  if (userId === requestingUserId.toString() && updates.role && updates.role !== user.role) {
    throw ApiError.badRequest('You cannot change your own role.');
  }

  // apply updates
  Object.keys(updates).forEach((key) => {
    user[key] = updates[key];
  });

  await user.save();
  return user;
};

/**
 * Soft-delete a user. Does not remove data from the database.
 */
const deleteUser = async (userId, requestingUserId) => {
  if (userId === requestingUserId.toString()) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  user.isDeleted = true;
  user.isActive = false;
  await user.save();

  return { message: 'User has been deleted successfully.' };
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
