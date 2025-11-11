const fs = require("fs");
const path = require("path");
const multer = require("multer");

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subFolder = "";
    if (file.fieldname === "posterImage" || file.fieldname === "backdropImage") {
      subFolder = "images"; 
    } else if (file.fieldname === "videoFile") {
      subFolder = "videos"; 
    } else {
      subFolder = "other"; 
    }

    const absolutePath = path.join(__dirname, "..", "public", subFolder);
    ensureDir(absolutePath);
    cb(null, absolutePath);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${cleanName}`);
  },
});

module.exports = multer({ storage });
// middleware/uploadMiddleware.js