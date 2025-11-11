// controllers/adminController.js
const path = require('path');
const Content = require('../models/Content.js'); 
const fetch = require('node-fetch'); 

// --- HELPER FUNCTION TO FIX PATHS ---
// Input: 'public/images/foo.jpg'
// Output: '/images/foo.jpg'
const getUrlPath = (fullPath) => {
    if (!fullPath) return null;
    // Use path.relative to get the path *after* 'public'
    return '/' + path.relative('public', fullPath).replace(/\\/g, '/');
}
// --- END OF HELPER FUNCTION ---


// Serves the static HTML "Add Content" page
const getAddContentPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'addContent.html'));
};

// Handles the "Add New Content" form submission
const createContent = async (req, res) => {
  try {
    // 1. Get File Paths from Multer
    if (!req.files) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }
    
    const posterDiskPath = req.files.posterImage ? req.files.posterImage[0].path : null;
    const backdropDiskPath = req.files.backdropImage ? req.files.backdropImage[0].path : null;
    const videoDiskPath = req.files.videoFile ? req.files.videoFile[0].path : null;

    if (!posterDiskPath || !backdropDiskPath || !videoDiskPath) {
        return res.status(400).json({ error: 'Missing one or more required files.' });
    }

    // Convert filesystem paths to URL paths
    const posterUrl = getUrlPath(posterDiskPath);
    const backdropUrl = getUrlPath(backdropDiskPath);
    const videoUrl = getUrlPath(videoDiskPath);

    // 2. External API Call (OMDb for Rating)
    const movieTitle = req.body.title;
    const apiKey = process.env.OMDB_API_KEY || 'd11be0e4'; // Make sure this is your key
    const omdbResponse = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(movieTitle)}&apikey=${apiKey}`);
    const movieData = await omdbResponse.json();
    
    // Rating conversion logic
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
    const newContent = new Content({ 
      id: req.body.id,
      type: req.body.type,
      title: req.body.title,
      year: req.body.year,
      category: req.body.category,
      info: req.body.info,
      director: req.body.director,
      
      // Save the correct URL paths
      poster: posterUrl,
      backdrop: backdropUrl,
      videoUrl: videoUrl,

      actors: actors,
      rating: finalRating
    });

    await newContent.save();
    
    res.status(201).json({ message: 'Content added successfully!' });

  } catch (error) {
    console.error('Error creating content:', error);
    if (error.code === 11000) { 
      return res.status(400).json({ error: 'Error: A content item with this Unique ID already exists.' });
    }
    
    return res.status(500).json({ error: error.message || 'Server error' });
  }
};

// --- 👇 FUNCTIONS FOR "EDIT CONTENT" 👇 ---

/**
 * Serves the "Edit Content" page
 * (It's the same page, the client-side JS will handle it)
 */
const getEditContentPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'addContent.html'));
};

/**
 * Updates existing content in the database
 */
const updateContent = async (req, res) => {
  try {
    const contentId = req.params.id; // Takes the _id from the URL
    
    // 1. Find the existing content by its _id
    // IMPORTANT: We use findById here, not findOne({ id: ... })
    const contentToUpdate = await Content.findById(contentId);
    if (!contentToUpdate) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // 2. Update text fields
    contentToUpdate.title = req.body.title || contentToUpdate.title;
    contentToUpdate.year = req.body.year || contentToUpdate.year;
    contentToUpdate.category = req.body.category || contentToUpdate.category;
    contentToUpdate.info = req.body.info || contentToUpdate.info;
    contentToUpdate.director = req.body.director || contentToUpdate.director;
    contentToUpdate.type = req.body.type || contentToUpdate.type;

    // 3. Update actors
    if (req.body.actors_names && req.body.actors_urls) {
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
        contentToUpdate.actors = actors;
    }

    // 4. Check for *new* file uploads and update paths
    if (req.files) {
      if (req.files.posterImage) {
        contentToUpdate.poster = getUrlPath(req.files.posterImage[0].path);
      }
      if (req.files.backdropImage) {
        contentToUpdate.backdrop = getUrlPath(req.files.backdropImage[0].path);
      }
      if (req.files.videoFile) {
        contentToUpdate.videoUrl = getUrlPath(req.files.videoFile[0].path);
      }
    }
    
    // 5. Update rating if title changed
    if (req.body.title && req.body.title !== contentToUpdate.title) {
        const apiKey = process.env.OMDB_API_KEY || 'd11be0e4'; // Make sure this is your key
        const omdbResponse = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(req.body.title)}&apikey=${apiKey}`);
        const movieData = await omdbResponse.json();
        
        let finalRating = 'N/A';
        if (movieData.imdbRating && movieData.imdbRating !== 'N/A') {
          finalRating = movieData.imdbRating;
        } else if (movieData.Ratings && movieData.Ratings.find(r => r.Source === 'Rotten Tomatoes')) {
          const rtRating = movieData.Ratings.find(r => r.Source === 'Rotten Tomatoes').Value;
          if (rtRating.includes('%')) {
            finalRating = (parseFloat(rtRating.replace('%', '')) / 10.0).toFixed(1);
          }
        }
        contentToUpdate.rating = finalRating;
    }
    
    // 6. Save changes
    await contentToUpdate.save();
    
    res.status(200).json({ message: 'Content updated successfully!' });

  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};
// --- 👆 END OF "EDIT CONTENT" FUNCTIONS 👆 ---


module.exports = {
  getAddContentPage,
  createContent,
  getEditContentPage, // <-- Make sure to export
  updateContent       // <-- Make sure to export
};