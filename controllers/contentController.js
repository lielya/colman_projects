const Content = require('../models/Content');

exports.getAllContent = async (req, res) => {
  try {
    const content = await Content.find();
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.searchContent = async (req, res) => {
  try {
    const q = req.query.q || '';
    const results = await Content.find({ title: new RegExp(q, 'i') });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};