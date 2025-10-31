const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // check if user is already exist
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ email, username, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ error: 'user or password are wrong' });
    }

    res.json({ message: 'success', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};