const Profile = require('../models/Profile');

// get all profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: 'Cannot find all profiles' });
  }
};

// get profile by id
exports.getProfileById = async (req, res) => {
  try {
    const id = req.params.id;
    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Cannot get desired profile' });
  }
};

// create a new profile
exports.createProfile = async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (err) {
    res.status(400).json({ error: 'Cannot create new profile' });
  }
};

// update an existing profile
exports.updateProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Profile.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Cannot update profile' });
  }
};

// delete a profile
exports.deleteProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Profile.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Cannot delete profile' });
  }
};
