//loading mongoose and models
const mongoose = require('mongoose');

const Content = require('./models/Content');
const Profile = require('./models/Profile');
const User = require('./models/User');
const Episode = require('./models/Episode');
const Like = require('./models/Like');
const Progress = require('./models/Progress');
const WatchEvent = require('./models/WatchEvent');

// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/netflixDB')
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));


// Seed function
async function seedDatabase() {
try {
    // Check if database already has data
    const existingUsers = await User.countDocuments({});
    const existingContent = await Content.countDocuments({});
    
    // If database already has data, skip seeding to preserve user-created data
    if (existingUsers > 0 || existingContent > 0) {
      console.log('Database already contains data. Skipping seed to preserve existing data.');
      return;
    }
    
    // Only clear and seed if database is empty
    console.log('Database is empty. Starting seed process...');
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Content.deleteMany({});
    //***This will also create the collections with no Data, until we add it when adding the functionalities
    await Episode.deleteMany({});
    await Like.deleteMany({});
    await Progress.deleteMany({});
    await WatchEvent.deleteMany({});
    console.log('Cleared existing data');


    // //******Users Sample Data*****//
    const users = await User.create([
    {
        email: "user1@test.com",
        username: "user1",
        password: "123456"
    },
    {
        email: "user2@test.com",
        username: "user2",
        password: "123456"
    },
    {
        email: "user3@test.com",
        username: "user3",
        password: "123456"
    },
    {
        email: "admin@test.com",
        username: "admin",
        password: "123456"
    }
    ]);
    console.log('Created users');

    //******Profiles Sample Data*****//
    const profiles = await Profile.create([{
    userId: users[0]._id,
    name: "Liel",
    avatar: "https://i.pinimg.com/564x/b2/a0/29/b2a029a6c2757e9d3a09265e3d07d49d.jpg"
  },
  {
    userId: users[1]._id,
    name: "Lihi",
    avatar: "https://i.pinimg.com/564x/a4/c6/5f/a4c65f709d4c0cb1b4329c12beb9cd78.jpg"
  },
  {
    userId: users[2]._id,
    name: "Amit",
    avatar: "https://i.pinimg.com/236x/86/2a/53/862a537a244d4f18264398ebd1a8873a.jpg"
  },
  {
    userId: users[3]._id,
    name: "Admin",
    avatar: "https://i.pinimg.com/236x/86/2a/53/862a537a244d4f18264398ebd1a8873a.jpg"
  }

    ]);
    console.log('Created profiles');

    //******Content Sample Data*****//
    const baselineLikes = {
      "Breaking Bad": 420,
      "Lost": 180,
      "Game of Thrones": 390,
      "Ozark": 140,
      "Squid Game": 260,
      "The Last Dance": 120,
      "Stranger Things": 350,
      "Chernobyl": 210,
      "The Crown": 160,
      "Narcos": 190,
      "The Witcher": 175,
      "Peaky Blinders": 150,
      "Money Heist": 230,
      "Black Mirror": 200,
      "Better Call Saul": 185,
      "The Boys": 240,
      "The Mandalorian": 260,
      "True Detective": 170,
      "Fargo": 125,
      "House of the Dragon": 280,
      "The Shawshank Redemption": 410,
      "The Lion King": 300,
      "The Green Mile": 250,
      "Titanic": 360,
      "Inception": 380,
      "Interstellar": 420,
      "Gladiator": 220,
      "Forrest Gump": 340,
      "The Dark Knight": 430,
      "Pulp Fiction": 390,
      "Spirited Away": 280,
      "Whiplash": 210,
      "Parasite": 260,
      "Mad Max: Fury Road": 200,
      "La La Land": 170,
      "Coco": 290,
      "Dune": 310,
      "Arrival": 185,
      "Inside Out": 275,
      "The Social Network": 195,
    };

    const contentData = [
  //series
  {
    id:"s1", type:"series", title:"Breaking Bad", year:2008, category:"Crime",
    poster:"images/series/breaking-bad.jpg",                               
    backdrop:"images/series/breaking-bad.jpg",                      
    info:"A chemistry teacher turns to crime."
  },
  {
    id:"s2", type:"series", title:"Lost", year:2004, category:"Mystery",
    poster:"images/series/lost.jpg",                                      
    backdrop:"images/series/lost.jpg",                              
    info:"Plane crash survivors on a strange island."
  },
  {
    id:"s3", type:"series", title:"Game of Thrones", year:2011, category:"Fantasy",
    poster:"images/series/game-of-thrones.jpg",                          
    backdrop:"images/series/game-of-thrones.jpg",                 
    info:"Noble families vie for power."
  },
  {
    id:"s4", type:"series", title:"Ozark", year:2017, category:"Thriller",
    poster:"images/series/ozark.jpg",                                      
    backdrop:"images/series/ozark.jpg",                            
    info:"A financial advisor launders money."
  },
  {
    id:"s5", type:"series", title:"Squid Game", year:2021, category:"Thriller",
    poster:"images/series/squid-game.jpg",                                 
    backdrop:"images/series/squid-game.jpg",                        
    info:"Deadly games for a cash prize."
  },
  {
    id:"s6", type:"series", title:"The Last Dance", year:2020, category:"Documentary",
    poster:"images/series/the-last-dance.jpg",                            
    backdrop:"images/series/the-last-dance.jpg",                    
    info:"Michael Jordan and the Bulls."
  },
  {
    id:"s7", type:"series", title:"Stranger Things", year:2016, category:"Sci-Fi",
    poster:"images/series/stranger-things.jpg",                          
    backdrop:"images/series/stranger-things.jpg",                    
    info:"Kids face supernatural threats."
  },
  {
    id:"s8", type:"series", title:"Chernobyl", year:2019, category:"Drama",
    poster:"images/series/chernobyl.jpg",                                 
    backdrop:"images/series/chernobyl.jpg",                         
    info:"The story of a nuclear disaster."
  },
  {
    id:"s9", type:"series", title:"The Crown", year:2016, category:"Drama",
    poster:"images/series/the-crown.jpg",                                  
    backdrop:"images/series/the-crown.jpg",                         
    info:"Reign of Queen Elizabeth II."
  },
  {
    id:"s10", type:"series", title:"Narcos", year:2015, category:"Crime",
    poster:"images/series/narcos.jpg",                                     
    backdrop:"images/series/narcos.jpg",                            
    info:"Drug cartels and law enforcement."
  },
  {
    id:"s11", type:"series", title:"The Witcher", year:2019, category:"Fantasy",
    poster:"images/series/the-witcher.jpg",                                
    backdrop:"images/series/the-witcher.jpg",                      
    info:"A monster hunter for hire."
  },
  {
    id:"s12", type:"series", title:"Peaky Blinders", year:2013, category:"Crime",
    poster:"images/series/peaky-blinders.jpg",                             
    backdrop:"images/series/peaky-blinders.jpg",                   
    info:"A Birmingham crime family."
  },
  {
    id:"s13", type:"series", title:"Money Heist", year:2017, category:"Thriller",
    poster:"images/series/money-heist.jpg",                                
    backdrop:"images/series/money-heist.jpg",                        
    info:"A mastermind plans daring heists."
  },
  {
    id:"s14", type:"series", title:"Black Mirror", year:2011, category:"Sci-Fi",
    poster:"images/series/black-mirror.jpg",                              
    backdrop:"images/series/black-mirror.jpg",                      
    info:"Dark tales of tech and society."
  },
  {
    id:"s15", type:"series", title:"Better Call Saul", year:2015, category:"Drama",
    poster:"images/series/better-call-saul.jpg",                          
    backdrop:"images/series/better-call-saul.jpg",                   
    info:"The rise of Jimmy McGill."
  },
  {
    id:"s16", type:"series", title:"The Boys", year:2019, category:"Action",
    poster:"images/series/the-boys.jpg",                                  
    backdrop:"images/series/the-boys.jpg",                         
    info:"Vigilantes vs corrupt superheroes."
  },
  {
    id:"s17", type:"series", title:"The Mandalorian", year:2019, category:"Sci-Fi",
    poster:"images/series/the-mandalorian.jpg",                         
    backdrop:"images/series/the-mandalorian.jpg",                   
    info:"A bounty hunter in the galaxy."
  },
  {
    id:"s18", type:"series", title:"True Detective", year:2014, category:"Crime",
    poster:"images/series/true-detective.jpg",                           
    backdrop:"images/series/true-detective.jpg",                   
    info:"Anthology of grim investigations."
  },
  {
    id:"s19", type:"series", title:"Fargo", year:2014, category:"Crime",
    poster:"images/series/fargo.jpg",                                     
    backdrop:"images/series/fargo.jpg",                             
    info:"Crime stories in the Midwest."
  },
  {
    id:"s20", type:"series", title:"House of the Dragon", year:2022, category:"Fantasy",
    poster:"images/series/house-of-the-dragon.jpg",                      
    backdrop:"images/series/house-of-the-dragon.jpg",              
    info:"Targaryen civil war prequel."
  },
  // Movies
  {
    id:"m1", type:"movie", title:"The Shawshank Redemption", year:1994, category:"Drama",
    poster:"images/movies/the-shawshank-redemption.jpg",                 
    backdrop:"images/movies/the-shawshank-redemption.jpg",          
    info:"Two imprisoned men bond over years, finding solace and redemption."
  },
  {
    id:"m2", type:"movie", title:"The Lion King", year:1994, category:"Animation",
    poster:"images/movies/the-lion-king.jpg",                            
    backdrop:"images/movies/the-lion-king.jpg",                    
    info:"Simba learns responsibility and bravery."
  },
  {
    id:"m3", type:"movie", title:"The Green Mile", year:1999, category:"Fantasy",
    poster:"images/movies/the-green-mile.jpg",                            
    backdrop:"images/movies/the-green-mile.jpg",                   
    info:"A guard encounters a miracle on death row."
  },
  {
    id:"m4", type:"movie", title:"Titanic", year:1997, category:"Romance",
    poster:"images/movies/titanic.jpg",                                  
    backdrop:"images/movies/titanic.jpg",                          
    info:"A love story aboard the RMS Titanic."
  },
  {
    id:"m5", type:"movie", title:"Inception", year:2010, category:"Sci-Fi",
    poster:"images/movies/inception.jpg",                                
    backdrop:"images/movies/inception.jpg",                       
    info:"A thief steals information by infiltrating dreams."
  },
  {
    id:"m6", type:"movie", title:"Interstellar", year:2014, category:"Sci-Fi",
    poster:"images/movies/interstellar.jpg",                             
    backdrop:"images/movies/interstellar.jpg",                      
    info:"Explorers travel through a wormhole to save humanity."
  },
  {
    id:"m7", type:"movie", title:"Gladiator", year:2000, category:"Action",
    poster:"images/movies/gladiator.jpg",                                
    backdrop:"images/movies/gladiator.jpg",                        
    info:"A Roman general seeks justice in the arena."
  },
  {
    id:"m8", type:"movie", title:"Forrest Gump", year:1994, category:"Drama",
    poster:"images/movies/forrest-gump.jpg",                             
    backdrop:"images/movies/forrest-gump.jpg",                     
    info:"Forrest witnesses key moments in history."
  },
  {
    id:"m9", type:"movie", title:"The Dark Knight", year:2008, category:"Action",
    poster:"images/movies/the-dark-knight.jpg",                          
    backdrop:"images/movies/the-dark-knight.jpg",                   
    info:"Batman faces chaos unleashed by the Joker."
  },
  {
    id:"m10", type:"movie", title:"Pulp Fiction", year:1994, category:"Crime",
    poster:"images/movies/pulp-fiction.jpg",                             
    backdrop:"images/movies/pulp-fiction.jpg",                     
    info:"Interwoven stories of crime in Los Angeles."
  },
  {
    id:"m11", type:"movie", title:"Spirited Away", year:2001, category:"Animation",
    poster:"images/movies/spirited-away.jpg",                            
    backdrop:"images/movies/spirited-away.jpg",                    
    info:"A girl enters a world of spirits."
  },
  {
    id:"m12", type:"movie", title:"Whiplash", year:2014, category:"Drama",
    poster:"images/movies/whiplash.jpg",                                 
    backdrop:"images/movies/whiplash.jpg",                          
    info:"A drummer and his strict teacher push limits."
  },
  {
    id:"m13", type:"movie", title:"Parasite", year:2019, category:"Thriller",
    poster:"images/movies/parasite.jpg",                                 
    backdrop:"images/movies/parasite.jpg",                          
    info:"Two families’ fates intertwine in unexpected ways."
  },
  {
    id:"m14", type:"movie", title:"Mad Max: Fury Road", year:2015, category:"Action",
    poster:"images/movies/mad-max-fury-road.jpg",                        
    backdrop:"images/movies/mad-max-fury-road.jpg",               
    info:"A high-octane desert chase for freedom."
  },
  {
    id:"m15", type:"movie", title:"La La Land", year:2016, category:"Romance",
    poster:"images/movies/la-la-land.jpg",                               
    backdrop:"images/movies/la-la-land.jpg",                        
    info:"A jazz musician and actress chase dreams."
  },
  {
    id:"m16", type:"movie", title:"Coco", year:2017, category:"Animation",
    poster:"images/movies/coco.jpg",                                      
    backdrop:"images/movies/coco.jpg",                              
    info:"A boy explores the Land of the Dead."
  },
  {
    id:"m17", type:"movie", title:"Dune", year:2021, category:"Sci-Fi",
    poster:"images/movies/dune.jpg",                                      
    backdrop:"images/movies/dune.jpg",                              
    info:"A noble house battles for a desert planet."
  },
  {
    id:"m18", type:"movie", title:"Arrival", year:2016, category:"Sci-Fi",
    poster:"images/movies/arrival.jpg",                                   
    backdrop:"images/movies/arrival.jpg",                           
    info:"A linguist communicates with aliens."
  },
  {
    id:"m19", type:"movie", title:"Inside Out", year:2015, category:"Animation",
    poster:"images/movies/inside-out.jpg",                                
    backdrop:"images/movies/inside-out.jpg",                        
    info:"Emotions guide a young girl through change."
  },
  {
    id:"m20", type:"movie", title:"The Social Network", year:2010, category:"Drama",
    poster:"images/movies/the-social-network.jpg",                        
    backdrop:"images/movies/the-social-network.jpg",                
    info:"The rise of a social media giant."
  }
    ];

    const randomLikeDocs = [];
    contentData.forEach((item) => {
      const baseline =
        baselineLikes[item.title] ??
        Math.floor(Math.random() * 150) + 40;
      item.likes = baseline;
    });

    const content = await Content.create(contentData);
    console.log('Created content');

    // //******Episodes Sample Data*******//
// ****** Episodes Sample Data *******
const episodesToInsert = [];

const theBoys = content.find(c => c.title === 'The Boys');
const mandalorian = content.find(c => c.title === 'The Mandalorian');
const trueDetective = content.find(c => c.title === 'True Detective');
const fargo = content.find(c => c.title === 'Fargo');
const houseOfDragon = content.find(c => c.title === 'House of the Dragon');

if (theBoys) {
  episodesToInsert.push(
    {
      seriesId: theBoys._id,
      season: 1,
      episode: 1,
      title: 'The Name of the Game',
      description: 'A group of vigilantes sets out to take down corrupt superheroes known as The Seven.',
      durationSec: 3300,
      videoUrl: '../public/videos/series/the-boys-trailer.mp4',
      thumbnailUrl: '../public/images/series/the-boys.jpg',
      airDate: new Date('2019-07-26')
    },
    {
      seriesId: theBoys._id,
      season: 1,
      episode: 2,
      title: 'Cherry',
      description: 'Hughie and Starlight discover the dark side of Vought International.',
      durationSec: 3250,
      videoUrl: '../public/videos/series/the-boys-trailer.mp4',
      thumbnailUrl: '../public/images/series/the-boys.jpg',
      airDate: new Date('2019-07-26')
    },
    {
      seriesId: theBoys._id,
      season: 1,
      episode: 3,
      title: 'Get Some',
      description: 'The Boys devise a plan to expose A-Train’s corruption.',
      durationSec: 3280,
      videoUrl: '../public/videos/series/the-boys-trailer.mp4',
      thumbnailUrl: '../public/images/series/the-boys.jpg',
      airDate: new Date('2019-07-26')
    }
  );
}

if (mandalorian) {
  episodesToInsert.push(
    {
      seriesId: mandalorian._id,
      season: 1,
      episode: 1,
      title: 'Chapter 1: The Mandalorian',
      description: 'A lone bounty hunter tracks a valuable target in the outer reaches of the galaxy.',
      durationSec: 3100,
      videoUrl: '../public/videos/series/the-mandalorian-trailer.mp4',
      thumbnailUrl: '../public/images/series/the-mandalorian.jpg',
      airDate: new Date('2019-11-12')
    },
    {
      seriesId: mandalorian._id,
      season: 1,
      episode: 2,
      title: 'Chapter 2: The Child',
      description: 'The Mandalorian fights off scavengers while protecting his mysterious new asset.',
      durationSec: 3120,
      videoUrl: '../public/videos/series/the-mandalorian-trailer.mp4',
      thumbnailUrl: '../public/images/series/the-mandalorian.jpg',
      airDate: new Date('2019-11-15')
    },
    {
      seriesId: mandalorian._id,
      season: 1,
      episode: 3,
      title: 'Chapter 3: The Sin',
      description: 'The bounty hunter faces a tough choice after delivering the child to the Client.',
      durationSec: 3150,
      videoUrl: '../public/videos/series/the-mandalorian-trailer.mp4',
      thumbnailUrl: '../public/images/series/the-mandalorian.jpg',
      airDate: new Date('2019-11-22')
    }
  );
}

if (trueDetective) {
  episodesToInsert.push(
    {
      seriesId: trueDetective._id,
      season: 1,
      episode: 1,
      title: 'The Long Bright Dark',
      description: 'Detectives Rust Cohle and Marty Hart investigate a ritualistic murder in Louisiana.',
      durationSec: 3600,
      videoUrl: '../public/videos/series/true-detective-trailer.mp4',
      thumbnailUrl: '../public/images/series/true-detective.jpg',
      airDate: new Date('2014-01-12')
    },
    {
      seriesId: trueDetective._id,
      season: 1,
      episode: 2,
      title: 'Seeing Things',
      description: 'The detectives pursue leads and confront their personal demons.',
      durationSec: 3550,
      videoUrl: '../public/videos/series/true-detective-trailer.mp4',
      thumbnailUrl: '../public/images/series/true-detective.jpg',
      airDate: new Date('2014-01-19')
    },
    {
      seriesId: trueDetective._id,
      season: 1,
      episode: 3,
      title: 'The Locked Room',
      description: 'The case takes darker turns as new evidence surfaces.',
      durationSec: 3580,
      videoUrl: '../public/videos/series/true-detective-trailer.mp4',
      thumbnailUrl: '../public/images/series/true-detective.jpg',
      airDate: new Date('2014-01-26')
    }
  );
}

if (fargo) {
  episodesToInsert.push(
    {
      seriesId: fargo._id,
      season: 1,
      episode: 1,
      title: 'The Crocodile’s Dilemma',
      description: 'A drifter named Lorne Malvo brings chaos to the small town of Bemidji, Minnesota.',
      durationSec: 3400,
      videoUrl: '../public/videos/series/fargo-trailer.mp4',
      thumbnailUrl: '../public/images/series/fargo.jpg',
      airDate: new Date('2014-04-15')
    },
    {
      seriesId: fargo._id,
      season: 1,
      episode: 2,
      title: 'The Rooster Prince',
      description: 'Two enforcers investigate Malvo’s crimes while Lester Nygaard struggles with guilt.',
      durationSec: 3420,
      videoUrl: '../public/videos/series/fargo-trailer.mp4',
      thumbnailUrl: '../public/images/series/fargo.jpg',
      airDate: new Date('2014-04-22')
    },
    {
      seriesId: fargo._id,
      season: 1,
      episode: 3,
      title: 'A Muddy Road',
      description: 'Deputy Molly Solverson pursues the truth as bodies pile up.',
      durationSec: 3390,
      videoUrl: '../public/videos/series/fargo-trailer.mp4',
      thumbnailUrl: '../public/images/series/fargo.jpg',
      airDate: new Date('2014-04-29')
    }
  );
}

if (houseOfDragon) {
  episodesToInsert.push(
    {
      seriesId: houseOfDragon._id,
      season: 1,
      episode: 1,
      title: 'The Heirs of the Dragon',
      description: 'The Targaryen dynasty faces internal struggle over the Iron Throne.',
      durationSec: 3800,
      videoUrl: '../public/videos/series/house-of-the-dragon-trailer.mp4',
      thumbnailUrl: '../public/images/series/house-of-the-dragon.jpg',
      airDate: new Date('2022-08-21')
    },
    {
      seriesId: houseOfDragon._id,
      season: 1,
      episode: 2,
      title: 'The Rogue Prince',
      description: 'Daemon Targaryen causes tension within the royal family.',
      durationSec: 3700,
      videoUrl: '../public/videos/series/house-of-the-dragon-trailer.mp4',
      thumbnailUrl: '../public/images/series/house-of-the-dragon.jpg',
      airDate: new Date('2022-08-28')
    },
    {
      seriesId: houseOfDragon._id,
      season: 1,
      episode: 3,
      title: 'Second of His Name',
      description: 'Viserys faces pressure to secure his legacy while war brews in the Stepstones.',
      durationSec: 3750,
      videoUrl: '../public/videos/series/house-of-the-dragon-trailer.mp4',
      thumbnailUrl: '../public/images/series/house-of-the-dragon.jpg',
      airDate: new Date('2022-09-04')
    }
  );
}

    //******Progress Sample Data (watch history for profiles)*******//
    const progressToInsert = [];
// Profile 1 (Liel) has watched some episodes of The Boys
if (theBoys && profiles[0]) {
  progressToInsert.push(
    {
      profileId: profiles[0]._id,
      contentId: theBoys._id,
      episodeId: episodesToInsert.find(e => e.seriesId === theBoys._id && e.episode === 1)?._id,
      lastPositionSec: 3300, // Finished episode 1
      durationSec: 3300,
      status: 'done',
      watchPercentage: 100
    },
    {
      profileId: profiles[0]._id,
      contentId: theBoys._id,
      episodeId: episodesToInsert.find(e => e.seriesId === theBoys._id && e.episode === 2)?._id,
      lastPositionSec: 1600, // Halfway through episode 2
      durationSec: 3250,
      status: 'in_progress',
      watchPercentage: 49
    }
  );
}

// Profile 2 (Lihi) watched The Mandalorian episode 1
if (mandalorian && profiles[1]) {
  progressToInsert.push(
    {
      profileId: profiles[1]._id,
      contentId: mandalorian._id,
      episodeId: episodesToInsert.find(e => e.seriesId === mandalorian._id && e.episode === 1)?._id,
      lastPositionSec: 3100,
      durationSec: 3100,
      status: 'done',
      watchPercentage: 100
    }
  );
}

// Profile 3 (Amit) watched some True Detective and House of the Dragon
if (trueDetective && profiles[2]) {
  progressToInsert.push(
    {
      profileId: profiles[2]._id,
      contentId: trueDetective._id,
      episodeId: episodesToInsert.find(e => e.seriesId === trueDetective._id && e.episode === 1)?._id,
      lastPositionSec: 1800, // Halfway
      durationSec: 3600,
      status: 'in_progress',
      watchPercentage: 50
    }
  );
}

if (houseOfDragon && profiles[2]) {
  progressToInsert.push(
    {
      profileId: profiles[2]._id,
      contentId: houseOfDragon._id,
      episodeId: episodesToInsert.find(e => e.seriesId === houseOfDragon._id && e.episode === 1)?._id,
      lastPositionSec: 3800,
      durationSec: 3800,
      status: 'done',
      watchPercentage: 100
    }
  );
}

// Optional: add one more for Fargo to simulate different behavior
if (fargo && profiles[1]) {
  progressToInsert.push(
    {
      profileId: profiles[1]._id,
      contentId: fargo._id,
      episodeId: episodesToInsert.find(e => e.seriesId === fargo._id && e.episode === 1)?._id,
      lastPositionSec: 1700, // Still watching
      durationSec: 3400,
      status: 'in_progress',
      watchPercentage: 50
    }
  );
}

 //******Like Sample Data (for profiles)*******//
    const likesToInsert = [];

  // Profile 1 likes The Boys and The Mandalorian
  if (theBoys && profiles[0]) {
    likesToInsert.push({
      profileId: profiles[0]._id,
      contentId: theBoys._id,
      liked: true
    });
  }

  if (mandalorian && profiles[0]) {
    likesToInsert.push({
      profileId: profiles[0]._id,
      contentId: mandalorian._id,
      liked: true
    });
  }

  // Profile 2 likes True Detective
  if (trueDetective && profiles[1]) {
    likesToInsert.push({
      profileId: profiles[1]._id,
      contentId: trueDetective._id,
      liked: true
    });
  }

  // Profile 3 likes House of the Dragon
  if (houseOfDragon && profiles[2]) {
    likesToInsert.push({
      profileId: profiles[2]._id,
      contentId: houseOfDragon._id,
      liked: true
    });
  }
    // Insert all the data
    if (episodesToInsert.length) {
      const insertedEpisodes = await Episode.insertMany(episodesToInsert);
      console.log(`Created sample episodes (${insertedEpisodes.length})`);
      
      // Now insert progress with actual episode IDs
      // if (progressToInsert.length && insertedEpisodes.length > 0) {
      //   // Map episode IDs properly - filter out any that don't have valid episodeIds
      //   const validProgress = progressToInsert.filter(prog => {
      //     // If episodeId is already set (from find), verify it exists in inserted episodes
      //     if (prog.episodeId) {
      //       const exists = insertedEpisodes.some(e => 
      //         e._id.toString() === prog.episodeId.toString()
      //       );
      //       return exists;
      //     }
      //     return false;
      //   });
        
      //   if (validProgress.length > 0) {
      //     await Progress.insertMany(validProgress);
      //     console.log(`Created sample progress (${validProgress.length})`);
      //   } else {
      //     console.log('No valid progress records to insert');
      //   }
      // }
       progressToInsert.forEach(prog => {
        if (prog.episodeId) {
          const matchedEpisode = insertedEpisodes.find(e => e._id.toString() === prog.episodeId.toString());
          if (matchedEpisode) prog.episodeId = matchedEpisode._id;
        }
      });

      if (progressToInsert.length > 0) {
        await Progress.insertMany(progressToInsert);
        console.log(`Created sample progress (${progressToInsert.length})`);
      }
       else {
           console.log('No valid progress records to insert');
       }
      
      if (likesToInsert.length) {
        await Like.insertMany(likesToInsert);
        console.log(`Created sample likes (${likesToInsert.length})`);
      }

      if (randomLikeDocs.length) {
        await Like.insertMany(randomLikeDocs);
        console.log(`Created random baseline likes (${randomLikeDocs.length})`);
      }
    } else {
      console.log('No matching series found for episodes seeding');
    }

  
    // //******WatchEvent Sample Data for Statistics*****//
    const watchEvents = await WatchEvent.create([
      // Profile 1 (Liel) watch events
      { profileId: profiles[0]._id, contentId: content[0]._id, event: 'complete', positionSec: 3600, createdAt: new Date('2025-10-15') },
      { profileId: profiles[0]._id, contentId: content[1]._id, event: 'complete', positionSec: 2400, createdAt: new Date('2025-10-15') },
      { profileId: profiles[0]._id, contentId: content[2]._id, event: 'complete', positionSec: 3200, createdAt: new Date('2025-10-16') },
      { profileId: profiles[0]._id, contentId: content[3]._id, event: 'complete', positionSec: 2800, createdAt: new Date('2025-10-16') },
      { profileId: profiles[0]._id, contentId: content[4]._id, event: 'complete', positionSec: 3600, createdAt: new Date('2025-10-17') },
      
      // Profile 2 (Lihi) watch events  
      { profileId: profiles[1]._id, contentId: content[0]._id, event: 'complete', positionSec: 3600, createdAt: new Date('2025-10-15') },
      { profileId: profiles[1]._id, contentId: content[2]._id, event: 'complete', positionSec: 2200, createdAt: new Date('2025-10-16') },
      { profileId: profiles[1]._id, contentId: content[5]._id, event: 'complete', positionSec: 3000, createdAt: new Date('2025-10-16') },
      { profileId: profiles[1]._id, contentId: content[6]._id, event: 'complete', positionSec: 2600, createdAt: new Date('2025-10-17') },
      
      // Profile 3 (Amit) watch events
      { profileId: profiles[2]._id, contentId: content[1]._id, event: 'complete', positionSec: 2400, createdAt: new Date('2025-10-15') },
      { profileId: profiles[2]._id, contentId: content[3]._id, event: 'complete', positionSec: 2800, createdAt: new Date('2025-10-16') },
      { profileId: profiles[2]._id, contentId: content[7]._id, event: 'complete', positionSec: 3200, createdAt: new Date('2025-10-17') },
      
      { profileId: profiles[3]._id, contentId: content[0]._id, event: 'complete', positionSec: 3600, createdAt: new Date('2025-10-17') }

    ]);
    console.log('Created watch events');

    console.log('Database seeded successfully!');
    console.log(`Created: ${users.length} users, ${profiles.length} profiles, ${content.length} content items, ${watchEvents.length} watch events`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error; // Re-throw to let server handle it
  }
  // Note: We don't close the connection here because server.js needs it to stay open
  // mongoose.connection.close(); // ❌ Don't close - server needs the connection!
}

module.exports = seedDatabase; 
