const User = require('../models/User');
const Profile = require('../models/Profile');
const bcrypt = require('bcrypt');

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      passwordHash: password // Will be hashed by pre-save middleware
    });

    await newUser.save();

    console.log(`✅ Registered new user: ${email}`);
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Sign in user
const signInUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`✅ User signed in: ${email}`);
    res.status(200).json({ 
      message: 'Sign in successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Sign in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user profiles
const getUserProfiles = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's profiles
    const profiles = await Profile.find({ userId: user._id }).sort({ createdAt: 1 });

    res.status(200).json({
      profiles: profiles.map(profile => ({
        id: profile._id,
        name: profile.name,
        cover_image: profile.avatar,
        ageRating: profile.ageRating,
        preferences: profile.prefs
      }))
    });

  } catch (error) {
    console.error('❌ Get profiles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also delete user's profiles
    await Profile.deleteMany({ userId });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  registerUser,
  signInUser,
  getUserProfiles,
  getAllUsers,
  deleteUser
};