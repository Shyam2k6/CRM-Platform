const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Management)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private (Admin, Management)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private (Admin, Management or Owner)
exports.updateUser = async (req, res, next) => {
  try {
    // If not Admin/Management, ensure users can only update their own profile
    if (
      req.user.role !== 'Admin' &&
      req.user.role !== 'Management' &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this user' });
    }

    let user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { name, email, password, role, isActive } = req.body;

    // Regular users cannot modify their role or active status
    if (req.user.role !== 'Admin' && req.user.role !== 'Management') {
      if (role && role !== user.role) {
        return res.status(403).json({ success: false, error: 'Non-admin users cannot change roles' });
      }
      if (isActive !== undefined && isActive !== user.isActive) {
        return res.status(403).json({ success: false, error: 'Non-admin users cannot change active status' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // pre-save hook will hash it automatically
    if (role && (req.user.role === 'Admin' || req.user.role === 'Management')) user.role = role;
    if (isActive !== undefined && (req.user.role === 'Admin' || req.user.role === 'Management')) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (or toggle active status)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Set user as inactive instead of deleting (standard in enterprise CRMs)
    user.isActive = false;
    await user.save();

    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
