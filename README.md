# Netflix Web

A simple Netflix-inspired website made with HTML, CSS, Bootstrap and JavaScript.

## How to use
1. Download or clone this repository.  
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGO_URI=mongodb://localhost:27017/netflixDB
   PORT=3000
   CONTENT_ITEMS_PER_PAGE=10
   ```
   The `CONTENT_ITEMS_PER_PAGE` variable controls how many content items are loaded per page for infinite scrolling in genre sections.
4. Start the server: `npm start` or `npm run dev` (for development with nodemon)
5. Open the application in your browser at `http://localhost:3000`

## Features
- Infinite circular scrolling for genre sections
- Content pagination controlled by environment variable
- User authentication and profiles
- Content browsing by genre

## Note
This project is for learning only and is **not** related to Netflix.


#### **Created by:** 
Amit Mosseri, Liel Yaakobov and Lihi Skif.
