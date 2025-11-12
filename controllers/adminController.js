// controllers/adminController.js
const path = require('path');
const fs = require('fs');
const Content = require('../models/Content.js');
const Episode = require('../models/Episode.js');
const fetch = require('node-fetch');

// Helper utility to create a URL-safe "slug" from a string.
const slugify = (text) => {
  if (!text) return 'general';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .trim();
};

// Helper utility to save a file buffer to the 'public' directory.
const saveFile = (file, relativePath) => {
  // Construct the absolute path to save the file.
  const fullPath = path.resolve(__dirname, '..', 'public', relativePath.startsWith('/') ? relativePath.substring(1) : relativePath);
  const directory = path.dirname(fullPath);

  // Create the directory if it doesn't exist.
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  
  // Write the file to the disk.
  fs.writeFileSync(fullPath, file.buffer);

  // Return the web-accessible relative path, ensuring forward slashes.
  return relativePath.replace(/\\/g, '/');
};

// Helper utility to fetch a movie/series rating from the OMDb API.
async function getOmdbRating(title) {
  try {
    // Use environment variable for API key, with a fallback.
    const apiKey = process.env.OMDB_API_KEY || 'd11be0e4';
    if (apiKey === 'YOUR_OMDB_API_KEY_HERE') return 'N/A';

    const omdbResponse = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`);
    const movieData = await omdbResponse.json();

    if (movieData.Response === 'False') return 'N/A';

    // Prioritize IMDb rating, then try to convert Rotten Tomatoes.
    let finalRating = 'N/A';
    if (movieData.imdbRating && movieData.imdbRating !== 'N/A') {
      finalRating = movieData.imdbRating;
    } else if (movieData.Ratings && movieData.Ratings.find(r => r.Source === 'Rotten Tomatoes')) {
      const rtRating = movieData.Ratings.find(r => r.Source === 'Rotten Tomatoes').Value;
      if (rtRating.includes('%')) {
        // Convert '90%' to '9.0'
        finalRating = (parseFloat(rtRating.replace('%', '')) / 10.0).toFixed(1);
      }
    }
    return finalRating;
  } catch (err) {
    console.error("Error fetching rating:", err.message);
    return 'N/A';
  }
}

// Serves the static HTML page for adding new content.
const getAddContentPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'addContent.html'));
};

// Handles the creation of new content (movie or series).
const createContent = async (req, res) => {
  try {
    const { type, title, year, category, info, director, id, actors_names, actors_urls } = req.body;

    // Organize uploaded files (from multer) for easier access.
    const filesMap = {
      posterImage: req.files.find(f => f.fieldname === 'posterImage'),
      backdropImage: req.files.find(f => f.fieldname === 'backdropImage'),
      videoFile: req.files.find(f => f.fieldname === 'videoFile'),
      episode_video: req.files.filter(f => f.fieldname === 'episode_video[]') // Field name from form
    };

    // Basic validation.
    if (!type || !title || !id) {
      return res.status(400).json({ error: 'Unique ID, Title, and Type are required.' });
    }
    if (!filesMap.posterImage || !filesMap.backdropImage) {
      return res.status(400).json({ error: 'Poster and Backdrop images are required.' });
    }

    let posterUrl, backdropUrl, videoUrl = null;
    const seriesTitleSlug = slugify(title); // For organizing series videos.

    // Handle file saving based on content type (movie vs. series).
    if (type === 'movie') {
      if (!filesMap.videoFile) {
        return res.status(400).json({ error: 'Video file is required for a movie.' });
      }
      posterUrl = saveFile(filesMap.posterImage, `/images/movies/${Date.now()}-${filesMap.posterImage.originalname}`);
      backdropUrl = saveFile(filesMap.backdropImage, `/images/movies/${Date.now()}-${filesMap.backdropImage.originalname}`);
      videoUrl = saveFile(filesMap.videoFile, `/videos/movies/${Date.now()}-${filesMap.videoFile.originalname}`);

    } else if (type === 'series') {
      posterUrl = saveFile(filesMap.posterImage, `/images/series/${Date.now()}-${filesMap.posterImage.originalname}`);
      backdropUrl = saveFile(filesMap.backdropImage, `/images/series/${Date.now()}-${filesMap.backdropImage.originalname}`);

      // Video file is optional for series (e.g., a trailer).
      if (filesMap.videoFile) {
        videoUrl = saveFile(filesMap.videoFile, `/videos/series/${seriesTitleSlug}/${Date.now()}-trailer.mp4`);
      }
    }

    // Fetch external rating from OMDb.
    const finalRating = await getOmdbRating(title);

    // Process actor data from textareas (split by newline).
    const actorNames = (actors_names || '').split('\n').map(name => name.trim()).filter(Boolean);
    const actorUrls = (actors_urls || '').split('\n').map(url => url.trim()).filter(Boolean);
    const actors = [];
    for (let i = 0; i < actorNames.length; i++) {
      if (actorNames[i] && actorUrls[i]) {
        actors.push({ name: actorNames[i], wikipediaUrl: actorUrls[i] });
      }
    }

    // Create a new Content document for the database.
    const newContent = new Content({
      id: id,
      type: type,
      title: title,
      year: year,
      category: category,
      info: info,
      director: director,
      poster: posterUrl,
      backdrop: backdropUrl,
      videoUrl: videoUrl,
      actors: actors,
      rating: finalRating
    });

    await newContent.save();

    // If it's a series, also process and save episodes.
    if (type === 'series') {
      
        // Destructure episode data from req.body.
        // Note: Form field names like 'episode_title[]' are parsed by body-parser
        // and are available on req.body as 'episode_title' (as an array or single value).
        let {
            episode_season: seasons,
            episode_number: numbers,
            episode_title: titles,
            episode_description: descriptions,
            episode_duration: durations,
            episode_thumbnail: thumbnails,
            episode_airDate: airDates
        } = req.body;
        
        // Check if any episode data was actually submitted.
        if (titles && filesMap.episode_video && filesMap.episode_video.length > 0) {

            // Utility to ensure we are working with arrays, even for single episode submissions.
            const forceArray = (item) => (item ? (Array.isArray(item) ? item : [item]) : []);
            
            seasons = forceArray(seasons);
            numbers = forceArray(numbers);
            const episodeTitles = forceArray(titles);
            descriptions = forceArray(descriptions);
            durations = forceArray(durations);
            thumbnails = forceArray(thumbnails);
            airDates = forceArray(airDates);

            // Validate that the number of text fields matches the number of video files.
            if (episodeTitles.length !== filesMap.episode_video.length) {
                throw new Error(`Episode data mismatch. Received ${episodeTitles.length} titles but ${filesMap.episode_video.length} files.`);
            }

            // Loop through each submitted episode.
            for (let i = 0; i < episodeTitles.length; i++) {
                const videoFile = filesMap.episode_video[i];
                
                // Validate that all fields for this episode are present.
                if (!seasons[i] || !numbers[i] || !titles[i] || !descriptions[i] || !durations[i] || !thumbnails[i] || !airDates[i]) {
                    throw new Error(`Missing required fields for Episode ${i + 1}.`);
                }

                // Save the episode video file.
                const episodeVideoUrl = saveFile(videoFile, `/videos/series/${seriesTitleSlug}/s${seasons[i]}-e${numbers[i]}-${videoFile.originalname}`);
                
                // Create and save the new Episode document.
                const newEpisode = new Episode({
                    seriesId: newContent._id, // Link to the parent Content.
                    season: seasons[i],
                    episode: numbers[i],
                    title: titles[i],
                    description: descriptions[i],
                    durationSec: durations[i],
                    videoUrl: episodeVideoUrl,
                    thumbnailUrl: thumbnails[i],
                    airDate: airDates[i]
                });
                await newEpisode.save();
            }
        }
    }

    res.status(201).json({ message: 'Content and episodes added successfully!' });

  } catch (error) {
    console.error('Error creating content:', error);
    // Handle potential errors, including duplicate 'id'.
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Error: A content item with this Unique ID already exists.' });
    }
    return res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Serves the static HTML page for editing content (re-uses the addContent page).
const getEditContentPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'addContent.html'));
};

// Handles updates for existing content.
const updateContent = async (req, res) => {
  try {
    const contentId = req.params.id; // This is the MongoDB _id.
    
    // Find the content in the DB by its ID.
    const contentToUpdate = await Content.findById(contentId);
    if (!contentToUpdate) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const { type, title, year, category, info, director, actors_names, actors_urls } = req.body;

    // Organize any newly uploaded files.
    const filesMap = {
      posterImage: req.files.find(f => f.fieldname === 'posterImage'),
      backdropImage: req.files.find(f => f.fieldname === 'backdropImage'),
      videoFile: req.files.find(f => f.fieldname === 'videoFile'),
      episode_video: req.files.filter(f => f.fieldname === 'episode_video[]')
    };

    // Check if the title changed, as this will trigger a new OMDb rating fetch.
    let titleChanged = false;
    if (title && title !== contentToUpdate.title) {
        contentToUpdate.title = title;
        titleChanged = true;
    }
    
    // Update fields with new data or keep old data if not provided.
    contentToUpdate.year = year || contentToUpdate.year;
    contentToUpdate.category = category || contentToUpdate.category;
    contentToUpdate.info = info || contentToUpdate.info;
    contentToUpdate.director = director || contentToUpdate.director;
    contentToUpdate.type = type || contentToUpdate.type;

    // Process and update actor data if provided.
    if (actors_names && actors_urls) {
        const actorNames = (actors_names || '').split('\n').map(name => name.trim()).filter(Boolean);
        const actorUrls = (actors_urls || '').split('\n').map(url => url.trim()).filter(Boolean);
        const actors = [];
        for (let i = 0; i < actorNames.length; i++) {
          if (actorNames[i] && actorUrls[i]) {
            actors.push({ name: actorNames[i], wikipediaUrl: actorUrls[i] });
          }
        }
        contentToUpdate.actors = actors;
    }

    const seriesTitleSlug = slugify(contentToUpdate.title);
    const currentType = contentToUpdate.type;
    
    // Save new files if they were uploaded, overwriting old paths.
    if (filesMap.posterImage) {
      const path = currentType === 'movie' ? `/images/movies/${Date.now()}-poster.jpg` : `/images/series/${Date.now()}-poster.jpg`;
      contentToUpdate.poster = saveFile(filesMap.posterImage, path);
    }
    if (filesMap.backdropImage) {
      const path = currentType === 'movie' ? `/images/movies/${Date.now()}-backdrop.jpg` : `/images/series/${Date.now()}-backdrop.jpg`;
      contentToUpdate.backdrop = saveFile(filesMap.backdropImage, path);
    }
    if (filesMap.videoFile) {
      const path = currentType === 'movie' ? `/videos/movies/${Date.now()}-video.mp4` : `/videos/series/${seriesTitleSlug}/${Date.now()}-trailer.mp4`;
      contentToUpdate.videoUrl = saveFile(filesMap.videoFile, path);
    }
    
    // If the title was changed, get an updated rating.
    if (titleChanged) {
        contentToUpdate.rating = await getOmdbRating(contentToUpdate.title);
    }
    
    await contentToUpdate.save();

    // Logic to add *new* episodes during an edit (mirrors createContent).
    // Note: This logic adds new episodes; it does not update existing ones.
    if (contentToUpdate.type === 'series') {
        let {
            episode_season: seasons,
            episode_number: numbers,
            episode_title: titles,
            episode_description: descriptions,
            episode_duration: durations,
            episode_thumbnail: thumbnails,
            episode_airDate: airDates
        } = req.body;
        
        if (titles && filesMap.episode_video && filesMap.episode_video.length > 0) {
            
            const forceArray = (item) => (item ? (Array.isArray(item) ? item : [item]) : []);
            
            seasons = forceArray(seasons);
            numbers = forceArray(numbers);
            const episodeTitles = forceArray(titles);
            descriptions = forceArray(descriptions);
            durations = forceArray(durations);
            thumbnails = forceArray(thumbnails);
            airDates = forceArray(airDates);

            if (episodeTitles.length !== filesMap.episode_video.length) {
                throw new Error(`Episode data mismatch. Received ${episodeTitles.length} titles but ${filesMap.episode_video.length} files.`);
            }

            for (let i = 0; i < episodeTitles.length; i++) {
                const videoFile = filesMap.episode_video[i];
                
                if (!seasons[i] || !numbers[i] || !titles[i] || !descriptions[i] || !durations[i] || !thumbnails[i] || !airDates[i]) {
                    throw new Error(`Missing required fields for Episode ${i + 1}.`);
                }

                const episodeVideoUrl = saveFile(videoFile, `/videos/series/${seriesTitleSlug}/s${seasons[i]}-e${numbers[i]}-${videoFile.originalname}`);
                
                const newEpisode = new Episode({
                    seriesId: contentToUpdate._id,
                    season: seasons[i],
                    episode: numbers[i],
                    title: titles[i],
                    description: descriptions[i],
                    durationSec: durations[i],
                    videoUrl: episodeVideoUrl,
                    thumbnailUrl: thumbnails[i],
                    airDate: airDates[i]
                });
                await newEpisode.save();
            }
        }
    }
    
    res.status(200).json({ message: 'Content updated successfully!' });

  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Export the route handlers.
module.exports = {
  getAddContentPage,
  createContent,
  getEditContentPage,
  updateContent
};