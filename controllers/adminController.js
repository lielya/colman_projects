// controllers/adminController.js
const path = require('path');
const ContentModel = require('../models/Content.js'); // Using new model name
const fetch = require('node-fetch'); 

// Serves the static HTML admin page
const getAddContentPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'addContent.html')); // Using new view name
};

// Handles the form submission
const createContent = async (req, res) => {
    try {
      // 1. Get File Paths from Multer
      if (!req.files) {
        return res.status(400).send('No files were uploaded.');
      }
      const toPublicPath = (file) => {
        if (!file || !file.path) return null;
        return file.path
          .replace(/\\/g, '/')
          .replace(/^.*public\//, '/');
      };

      const posterPath = toPublicPath(req.files.posterImage && req.files.posterImage[0]);
      const backdropPath = toPublicPath(req.files.backdropImage && req.files.backdropImage[0]);
      const videoPath = toPublicPath(req.files.videoFile && req.files.videoFile[0]);
  
      if (!posterPath || !backdropPath || !videoPath) {
          return res.status(400).send('Missing one or more required files.');
      }
  
      // 2. External API Call (OMDb for Rating)
      const movieTitle = req.body.title;
      const apiKey = process.env.OMDB_API_KEY || 'd11be0e4'; 
      const omdbResponse = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(movieTitle)}&apikey=${apiKey}`);
      const movieData = await omdbResponse.json();
  

      let finalRating = 'N/A';
      
  // 1. Try to find an IMDb rating
      if (movieData.imdbRating && movieData.imdbRating !== 'N/A') {
        finalRating = movieData.imdbRating; // ⬅️ Prefer IMDb
      } 
  // 2. If not, try to find Rotten Tomatoes and convert it
      else if (movieData.Ratings && Array.isArray(movieData.Ratings)) {
        const rtRating = movieData.Ratings.find(r => r.Source === 'Rotten Tomatoes');
        
        if (rtRating && rtRating.Value.includes('%')) {
          // Conversion: "94%" -> 94 -> 9.4
          const percentString = rtRating.Value.replace('%', ''); // "94"
          const percentNumber = parseFloat(percentString); // 94
          if (!isNaN(percentNumber)) {
            finalRating = (percentNumber / 10.0).toFixed(1); // "9.4"
          }
        }
  // 3. Fallback: Metacritic "84/100"
        else if (finalRating === 'N/A') {
          const mcRating = movieData.Ratings.find(r => r.Source === 'Metacritic');
          if (mcRating && mcRating.Value.includes('/100')) {
             const mcString = mcRating.Value.replace('/100', ''); // "84"
             const mcNumber = parseFloat(mcString); // 84
             if (!isNaN(mcNumber)) {
                finalRating = (mcNumber / 10.0).toFixed(1); // "8.4"
             }
          }
        }
      }
  // --- 👆 End of the new logic 👆 ---
  
      // 3. Build Actors Array
      const actorNames = (req.body.actors_names || '')
        .split('\n')
        .map(name => name.trim())
        .filter(Boolean);
      const actorUrls = (req.body.actors_urls || '')
        .split('\n')
        .map(url => url.trim())
        .filter(Boolean);
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
        id: req.body.id,
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
  rating: finalRating // saving the converted rating
      });
  
      await newContent.save();

      // If request was sent via fetch (Accept: application/json), respond with JSON
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          message: 'Content added successfully',
          contentId: newContent._id,
          redirect: '/'
        });
      }

      res.redirect('/'); // Redirect for standard form submission
  
    } catch (error) {
      console.error('Error creating content:', error);
      if (error.code === 11000) { // Handle duplicate 'id' error
        return res.status(400).send('Error: A content item with this ID already exists.');
      }
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(500).json({ error: 'Server error' });
      } else {
        res.status(500).send('Server error');
      }
    }
  };


module.exports = {
  getAddContentPage,
  createContent
};