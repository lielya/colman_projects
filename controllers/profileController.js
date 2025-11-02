const Profile = require('../models/Profile');
const User = require('../models/User');
// get all profiles
exports.getProfiles = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const profiles = await Profile.find({ userId }).select('-userId -__v');

    // Transform profiles to include 'id' field instead of '_id'
    const transformedProfiles = profiles.map(profile => ({
      id: profile._id,
      name: profile.name,
      avatar: profile.avatar,
      likes: profile.likes
    }));

    sendSuccess(res, transformedProfiles, 'Profiles retrieved successfully');
  } catch (error) {
    console.error('Get profiles error:', error);
    sendError(res, 'Server error retrieving profiles', 500);
  }
};

exports.createProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, avatar } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Create new profile
    const profile = new Profile({
      userId,
      name,
      avatar,
      likes: []
    });

    await profile.save();

    // Return profile data (without userId)
    const profileData = {
      id: profile._id,
      name: profile.name,
      avatar: profile.avatar,
      likes: profile.likes
    };

    sendSuccess(res, profileData, 'Profile created successfully', 201);
  } catch (error) {
    console.error('Create profile error:', error);
    
    if (error.code === 11000) {
      return sendError(res, 'Profile name already exists for this user', 409);
    }
    
    sendError(res, 'Server error creating profile', 500);
  }
};

exportsgetLikes = async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    sendSuccess(res, { likes: profile.likes }, 'Likes retrieved successfully');
  } catch (error) {
    console.error('Get likes error:', error);
    sendError(res, 'Server error retrieving likes', 500);
  }
};

exports.likeContent = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { contentId } = req.body;

    if (!contentId || typeof contentId !== 'number') {
      return sendError(res, 'Valid content ID is required', 400);
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // Add like if not already liked (idempotent)
    if (!profile.likes.includes(contentId)) {
      profile.likes.push(contentId);
      await profile.save();
    }

    sendSuccess(res, { likes: profile.likes }, 'Content liked successfully');
  } catch (error) {
    console.error('Like content error:', error);
    sendError(res, 'Server error liking content', 500);
  }
};

exports.unlikeContent = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { contentId } = req.body;

    if (!contentId || typeof contentId !== 'number') {
      return sendError(res, 'Valid content ID is required', 400);
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // Remove like if exists
    profile.likes = profile.likes.filter(id => id !== contentId);
    await profile.save();

    sendSuccess(res, { likes: profile.likes }, 'Content unliked successfully');
  } catch (error) {
    console.error('Unlike content error:', error);
    sendError(res, 'Server error unliking content', 500);
  }
};

exports.getGlobalLikeCounts = async (req, res) => {
  try {
    const likeCounts = await Profile.aggregate([
      { $unwind: '$likes' },
      { $group: { _id: '$likes', count: { $sum: 1 } } }
    ]);

    // Convert to object format { contentId: count }
    const counts = {};
    likeCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    sendSuccess(res, counts, 'Global like counts retrieved successfully');
  } catch (error) {
    console.error('Get global like counts error:', error);
    sendError(res, 'Server error retrieving like counts', 500);
  }
};
