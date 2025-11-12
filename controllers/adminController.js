// controllers/contentController.js
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // v2

const Content = require('../models/Content.js');
const Episode = require('../models/Episode.js');

// ---------- Utilities ----------

// URL-safe slug from a string
const slugify = (text) => {
  if (!text) return 'general';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')        // spaces -> dashes
    .replace(/[^\w\-]+/g, '')    // remove non-word chars
    .replace(/\-\-+/g, '-')      // collapse multiple dashes
    .trim();
};

// Save a file buffer under /public, return web path using forward slashes
const saveFile = (file, relativePath) => {
  const normalizedRel = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const fullPath = path.resolve(__dirname, '..', 'public', normalizedRel);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, file.buffer);
  return `/${normalizedRel}`.replace(/\\/g, '/');
};

// ---------- Ratings via OMDb ----------

const OMDB_API_KEY = '192707eb';

// Prefer IMDb, else convert RottenTomatoes %, else convert Metacritic /100
async function getOmdbRating({ title, year, type }) {
  try {
    const params = new URLSearchParams({ t: title, apikey: OMDB_API_KEY });
    if (year) params.set('y', String(year));
    if (type === 'movie' || type === 'series') params.set('type', type);

    const url = `http://www.omdbapi.com/?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.Response === 'False') return 'N/A';

    if (data.imdbRating && data.imdbRating !== 'N/A') return data.imdbRating;

    if (Array.isArray(data.Ratings)) {
      const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
      if (rt && typeof rt.Value === 'string' && rt.Value.endsWith('%')) {
        const pct = parseFloat(rt.Value.replace('%', ''));
        if (!Number.isNaN(pct)) return (pct / 10).toFixed(1);
      }
      const mc = data.Ratings.find(r => r.Source === 'Metacritic');
      if (mc && typeof mc.Value === 'string' && mc.Value.includes('/100')) {
        const num = parseFloat(mc.Value.split('/')[0]);
        if (!Number.isNaN(num)) return (num / 10).toFixed(1);
      }
    }

    return 'N/A';
  } catch (err) {
    console.error('Error fetching OMDb rating:', err.message);
    return 'N/A';
  }
}

const needsRatingRefresh = (rating) =>
  !rating || rating === 'N/A' || (typeof rating === 'string' && rating.includes('%'));

// ---------- Routes ----------

// Add Content page
const getAddContentPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'addContent.html'));
};

// Create content, with optional episodes for series
const createContent = async (req, res) => {
  try {
    const {
      type, title, year, category, info, director, id,
      actors_names, actors_urls
    } = req.body;

    const incomingFiles = Array.isArray(req.files) ? req.files : [];
    const filesMap = {
      posterImage: incomingFiles.find(f => f.fieldname === 'posterImage'),
      backdropImage: incomingFiles.find(f => f.fieldname === 'backdropImage'),
      videoFile: incomingFiles.find(f => f.fieldname === 'videoFile'),
      episode_video: incomingFiles.filter(f => f.fieldname === 'episode_video[]')
    };

    if (!type || !title || !id) {
      return res.status(400).json({ error: 'Unique ID, Title, and Type are required.' });
    }
    if (!filesMap.posterImage || !filesMap.backdropImage) {
      return res.status(400).json({ error: 'Poster and Backdrop images are required.' });
    }

    let posterUrl, backdropUrl, videoUrl = null;
    const seriesTitleSlug = slugify(title);

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
      if (filesMap.videoFile) {
        videoUrl = saveFile(filesMap.videoFile, `/videos/series/${seriesTitleSlug}/${Date.now()}-trailer.mp4`);
      }
    } else {
      return res.status(400).json({ error: 'Type must be "movie" or "series".' });
    }

    // Actors textarea parsing
    const actorNames = (actors_names || '').split('\n').map(s => s.trim()).filter(Boolean);
    const actorUrls = (actors_urls || '').split('\n').map(s => s.trim()).filter(Boolean);
    const actors = [];
    for (let i = 0; i < actorNames.length; i++) {
      if (actorNames[i] && actorUrls[i]) {
        actors.push({ name: actorNames[i], wikipediaUrl: actorUrls[i] });
      }
    }

    // Rating from OMDb
    const finalRating = await getOmdbRating({ title, year, type });

    const newContent = new Content({
      id,
      type,
      title,
      year,
      category,
      info,
      director,
      poster: posterUrl,
      backdrop: backdropUrl,
      videoUrl,
      actors,
      rating: finalRating
    });

    await newContent.save();

    // Episodes for series, optional
    if (type === 'series') {
      let {
        episode_season: seasons,
        episode_number: numbers,
        episode_title: titles,
        episode_description: descriptions,
        episode_duration: durations,
        episode_thumbnail: thumbnails,
        episode_airDate: airDates
      } = req.body;

      const videos = filesMap.episode_video || [];

      const forceArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
      seasons = forceArray(seasons);
      numbers = forceArray(numbers);
      const epTitles = forceArray(titles);
      descriptions = forceArray(descriptions);
      durations = forceArray(durations);
      thumbnails = forceArray(thumbnails);
      airDates = forceArray(airDates);

      if (epTitles.length && epTitles.length !== videos.length) {
        throw new Error(`Episode data mismatch. ${epTitles.length} titles but ${videos.length} files.`);
      }

      for (let i = 0; i < epTitles.length; i++) {
        if (!seasons[i] || !numbers[i] || !epTitles[i] || !descriptions[i] || !durations[i] || !thumbnails[i] || !airDates[i]) {
          throw new Error(`Missing required fields for Episode ${i + 1}.`);
        }
        const episodeVideoUrl = saveFile(
          videos[i],
          `/videos/series/${seriesTitleSlug}/s${seasons[i]}-e${numbers[i]}-${videos[i].originalname}`
        );

        await new Episode({
          seriesId: newContent._id,
          season: seasons[i],
          episode: numbers[i],
          title: epTitles[i],
          description: descriptions[i],
          durationSec: durations[i],
          videoUrl: episodeVideoUrl,
          thumbnailUrl: thumbnails[i],
          airDate: airDates[i]
        }).save();
      }
    }

    res.status(201).json({ message: 'Content and episodes added successfully!' });
  } catch (error) {
    console.error('Error creating content:', error);
    if (error && error.code === 11000) {
      return res.status(400).json({ error: 'Error: A content item with this Unique ID already exists.' });
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Edit Content page
const getEditContentPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'addContent.html'));
};

// Update content, allow rating refresh on title change or missing/invalid rating
const updateContent = async (req, res) => {
  try {
    const contentId = req.params.id; // Mongo _id
    const contentToUpdate = await Content.findById(contentId);
    if (!contentToUpdate) return res.status(404).json({ error: 'Content not found' });

    const {
      type, title, year, category, info, director,
      actors_names, actors_urls,
      refreshRating // optional boolean in body to force-refresh rating
    } = req.body;

    const incomingFiles = Array.isArray(req.files) ? req.files : [];
    const filesMap = {
      posterImage: incomingFiles.find(f => f.fieldname === 'posterImage'),
      backdropImage: incomingFiles.find(f => f.fieldname === 'backdropImage'),
      videoFile: incomingFiles.find(f => f.fieldname === 'videoFile'),
      episode_video: incomingFiles.filter(f => f.fieldname === 'episode_video[]')
    };

    let titleChanged = false;
    if (title && title !== contentToUpdate.title) {
      contentToUpdate.title = title;
      titleChanged = true;
    }

    contentToUpdate.year = year || contentToUpdate.year;
    contentToUpdate.category = category || contentToUpdate.category;
    contentToUpdate.info = info || contentToUpdate.info;
    contentToUpdate.director = director || contentToUpdate.director;
    contentToUpdate.type = type || contentToUpdate.type;

    if (actors_names && actors_urls) {
      const names = (actors_names || '').split('\n').map(s => s.trim()).filter(Boolean);
      const urls = (actors_urls || '').split('\n').map(s => s.trim()).filter(Boolean);
      const actors = [];
      for (let i = 0; i < names.length; i++) {
        if (names[i] && urls[i]) actors.push({ name: names[i], wikipediaUrl: urls[i] });
      }
      contentToUpdate.actors = actors;
    }

    const seriesTitleSlug = slugify(contentToUpdate.title);
    const currentType = contentToUpdate.type;

    if (filesMap.posterImage) {
      const rel = currentType === 'movie'
        ? `/images/movies/${Date.now()}-poster-${filesMap.posterImage.originalname}`
        : `/images/series/${Date.now()}-poster-${filesMap.posterImage.originalname}`;
      contentToUpdate.poster = saveFile(filesMap.posterImage, rel);
    }
    if (filesMap.backdropImage) {
      const rel = currentType === 'movie'
        ? `/images/movies/${Date.now()}-backdrop-${filesMap.backdropImage.originalname}`
        : `/images/series/${Date.now()}-backdrop-${filesMap.backdropImage.originalname}`;
      contentToUpdate.backdrop = saveFile(filesMap.backdropImage, rel);
    }
    if (filesMap.videoFile) {
      const rel = currentType === 'movie'
        ? `/videos/movies/${Date.now()}-video-${filesMap.videoFile.originalname}`
        : `/videos/series/${seriesTitleSlug}/${Date.now()}-trailer.mp4`;
      contentToUpdate.videoUrl = saveFile(filesMap.videoFile, rel);
    }

    // Rating refresh conditions
    if (titleChanged || refreshRating === '1' || refreshRating === true || needsRatingRefresh(contentToUpdate.rating)) {
      contentToUpdate.rating = await getOmdbRating({
        title: contentToUpdate.title,
        year: contentToUpdate.year,
        type: contentToUpdate.type
      });
    }

    await contentToUpdate.save();

    // Add new episodes on edit, if provided
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

      const videos = filesMap.episode_video || [];
      const forceArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
      seasons = forceArray(seasons);
      numbers = forceArray(numbers);
      const epTitles = forceArray(titles);
      descriptions = forceArray(descriptions);
      durations = forceArray(durations);
      thumbnails = forceArray(thumbnails);
      airDates = forceArray(airDates);

      if (epTitles.length && epTitles.length !== videos.length) {
        throw new Error(`Episode data mismatch. ${epTitles.length} titles but ${videos.length} files.`);
      }

      for (let i = 0; i < epTitles.length; i++) {
        if (!seasons[i] || !numbers[i] || !epTitles[i] || !descriptions[i] || !durations[i] || !thumbnails[i] || !airDates[i]) {
          throw new Error(`Missing required fields for Episode ${i + 1}.`);
        }
        const episodeVideoUrl = saveFile(
          videos[i],
          `/videos/series/${seriesTitleSlug}/s${seasons[i]}-e${numbers[i]}-${videos[i].originalname}`
        );

        await new Episode({
          seriesId: contentToUpdate._id,
          season: seasons[i],
          episode: numbers[i],
          title: epTitles[i],
          description: descriptions[i],
          durationSec: durations[i],
          videoUrl: episodeVideoUrl,
          thumbnailUrl: thumbnails[i],
          airDate: airDates[i]
        }).save();
      }
    }

    res.status(200).json({ message: 'Content updated successfully!' });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// ---------- Exports ----------
module.exports = {
  getAddContentPage,
  createContent,
  getEditContentPage,
  updateContent
};
