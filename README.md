# Netflix Web — A Netflix-Like Project

A comprehensive full-stack web application simulating the core functionality of a video streaming platform, built as part of an Internet Applications Development course.

# 1. System Installation and Running Instructions
Prerequisites

Node.js (version 14 or higher)

MongoDB (installed locally or connected via MongoDB Atlas)

npm (comes bundled with Node.js)

## Installation Steps
#### 1. Clone the Project
```
git clone <repository-url>
cd colman_projects
```

#### 2. Install Dependencies
```
npm install
```

#### 3. Create a .env File

Create a file named .env in the project root directory and add:
```
MONGO_URI=mongodb://localhost:27017/netflixDB
PORT=3000
CONTENT_ITEMS_PER_PAGE=10
SESSION_SECRET=your_secret_key_goes_here
```

## Run the Server
#### Production Mode:
```
npm start
```

#### Development Mode (auto-restart):
```
npm run dev
```

## Open the Application

Once the server is running, open your browser and go to:
http://localhost:3000

## Important Notes

The server automatically connects to MongoDB using MONGO_URI.

On first launch, seedDatabase.js populates initial data (users, profiles, content, etc.).

Ensure MongoDB service is running before starting the server.

# 2. Project Structure

The project follows the MVC (Model-View-Controller) architecture for clean separation of concerns.
```
colman_projects/
│
├── controllers/              # Business logic
│   ├── adminController.js
│   ├── contentController.js
│   ├── profileController.js
│   └── userController.js
│
├── middleware/               # Request handling layer
│   ├── authMiddleware.js
│   └── uploadMiddleware.js
│
├── models/                   # Mongoose Schemas
│   ├── Content.js
│   ├── Episode.js
│   ├── Like.js
│   ├── Profile.js
│   ├── Progress.js
│   ├── User.js
│   └── WatchEvent.js
│
├── routes/                   # Express routing
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── contentRoutes.js
│   └── profileRoutes.js
│
├── public/                   # Static files
│   ├── images/
│   ├── js/
│   ├── uploads/
│   └── videos/
│
├── views/                    # HTML templates
│   ├── addContent.html
│   ├── login.html
│   ├── main.html
│   ├── profiles.html
│   └── register.html
│
├── server.js                 # Express server setup
├── seedDatabase.js           # Initial database seeding script
├── package.json              # Dependencies and scripts
└── README.md                 # This documentation
```


# 3. Core Functionality and Features
#### User Authentication and Profiles

Register and log in with encrypted passwords using bcrypt.
Multiple profiles per user, each with a unique name and avatar.
Secure session management using express-session.

#### Content Management

Supports both movies and series.
Each content item includes title, year, category, cast, director, rating, and more.
Series include structured episodes by season and episode number.
Search, filter, and sort by title, category, or popularity.

#### Content Viewing

Built-in video player with playback controls.
Progress tracking that allows users to resume where they left off.
“Continue Watching” section for partially viewed content.
Watch events tracked (start, pause, complete) for user behavior analysis.

#### Social Features

Users can like any movie or series.
“My List” displays all liked items.
“Popular Content” ranks content by total likes.

#### User Interface

Netflix-style dark theme and professional layout.
Horizontal scrolling for content categories.
Infinite scrolling for smooth content loading.
Responsive design for mobile, tablet, and desktop.
Modals for content details, episode lists, and the video player.

#### Admin Content Management

Admin users can add or edit movies and series.
File uploads for images and videos handled by Multer.

#### Technical Architecture

Clear separation using the MVC pattern.
RESTful API for communication between front-end and back-end.
MongoDB Aggregation for complex data queries.
Express.js as the main server framework.

#### Initial Data (seedDatabase.js)

Populates the database with:
Sample users and profiles.
Example movies and series with metadata.
Likes and viewing progress records.

# 4. Additional Notes

Developed strictly for educational and demonstration purposes.
Not affiliated with Netflix, Inc.
All persistent data managed by MongoDB.
Supports multiple concurrent users and profiles.

## **Created by:** 
Amit Mosseri, Liel Yaakobov and Lihi Skif.
