// controllers/adminController.js
const path = require('path');
const ContentModel = require('../models/Content.js'); // או contentModel.js
const fetch = require('node-fetch'); 

// Serves the static HTML admin page
const getAddContentPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'addContent.html')); 
};

// Handles the form submission
const createContent = async (req, res) => {
  try {
    // 1. Get File Paths from Multer
    if (!req.files) {
      // ⬇️ שונה לשליחת JSON
      return res.status(400).json({ error: 'No files were uploaded.' });
    }
    
    const posterPath = req.files.posterImage ? req.files.posterImage[0].path : null;
    const backdropPath = req.files.backdropImage ? req.files.backdropImage[0].path : null;
    const videoPath = req.files.videoFile ? req.files.videoFile[0].path : null;

    if (!posterPath || !backdropPath || !videoPath) {
        // ⬇️ שונה לשליחת JSON
        return res.status(400).json({ error: 'Missing one or more required files.' });
    }

    // 2. External API Call (OMDb for Rating)
    const movieTitle = req.body.title;
    const apiKey = process.env.OMDB_API_KEY || 'd11be0e4'; // ⚠️ ודא שהמפתח שלך כאן
    const omdbResponse = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(movieTitle)}&apikey=${apiKey}`);
    const movieData = await omdbResponse.json();

    // לוגיקה להמרת דירוג
    let finalRating = 'N/A';
    if (movieData.imdbRating && movieData.imdbRating !== 'N/A') {
      finalRating = movieData.imdbRating; 
    } 
    else if (movieData.Ratings && Array.isArray(movieData.Ratings)) {
      const rtRating = movieData.Ratings.find(r => r.Source === 'Rotten Tomatoes');
      if (rtRating && rtRating.Value.includes('%')) {
        const percentString = rtRating.Value.replace('%', '');
        const percentNumber = parseFloat(percentString);
        if (!isNaN(percentNumber)) {
          finalRating = (percentNumber / 10.0).toFixed(1); 
        }
      }
    }

    // 3. Build Actors Array
    const actorNames = req.body.actors_names.split('\n').map(name => name.trim()).filter(Boolean);
    const actorUrls = req.body.actors_urls.split('\n').map(url => url.trim()).filter(Boolean);
    const actors = [];
    for (let i = 0; i < actorNames.length; i++) {
      if (actorNames[i] && actorUrls[i]) {
        actors.push({
          name: actorNames[i],
          wikipediaUrl: actorUrls[i]
        });
      }
    }

    // 4. Create and Save to DB
    const newContent = new ContentModel({
      id: req.body.id, // ודא ששם השדה בטופס תואם (name="id")
      type: req.body.type,
      title: req.body.title,
      year: req.body.year,
      category: req.body.category,
      info: req.body.info,
      director: req.body.director,
      poster: posterPath,
      backdrop: backdropPath,
      videoUrl: videoPath,
      actors: actors,
      rating: finalRating
    });

    await newContent.save();
    
    // --- 👇 התיקון העיקרי - שליחת JSON בהצלחה 👇 ---
    // במקום res.redirect...
    res.status(201).json({ message: 'Content added successfully!' });
    // --- 👆 סוף התיקון 👆 ---

  } catch (error) {
    console.error('Error creating content:', error);
    
    // --- 👇 התיקון העיקרי - שליחת JSON בכישלון 👇 ---
    if (error.code === 11000) { // שגיאת מפתח כפול (כנראה ID)
      return res.status(400).json({ error: 'Error: A content item with this Unique ID already exists.' });
    }
    
    // כל שגיאה אחרת (כמו שדה חובה חסר)
    return res.status(500).json({ error: error.message || 'Server error' });
    // --- 👆 סוף התיקון 👆 ---
  }
};

module.exports = {
  getAddContentPage,
  createContent
};