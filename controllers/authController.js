const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return sendError(res, 'Passwords do not match', 400);
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database not available. Please try again later.', 503);
    }
    // check if user is already exist
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      if (existingUser.email === email) {
        return sendError(res, 'Email already exists', 409);
      } else {
      return res.status(400).json({ error: 'User already exists' });
      }
    }
    //Create new user
    const user = new User({ email:email, username:username, password:password });
    await user.save();

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      username: user.username
    };
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
