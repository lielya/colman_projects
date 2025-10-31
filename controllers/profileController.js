const Profile = require('../models/Profile');

// list all profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.findAll(); 
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: 'can not find all profiles' });
  }
};


exports.getProfileById = async (req, res) => {
  try {
    const id = req.params.id;
    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ error: 'can not find profile' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'can not get desired profile'});
  }
};

// create a new profile
exports.createProfile = async (req, res) => {
  try {
    const newProfile = await Profile.create(req.body);
    res.status(201).json(newProfile);
  } catch (err) {
    res.status(400).json({ error: 'can not create new profile' });
  }
};

// update an exist profile
exports.updateProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Profile.update(id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'can not update profile' });
  }
};

// delete profile
exports.deleteProfile = async (req, res) => {
  try {
    const id = req.params.id;
    await Profile.delete(id);
    res.json({ message: 'profile deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'can not delete profile' });
  }
};
