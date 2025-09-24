<!--Amit-Mosseri-206446791-Liel-Yaakobov-322366311-Lihi-Skif-322235888-->

// Header population and logout
const nameLS = localStorage.getItem("selectedProfileName");
const avatarLS = localStorage.getItem("selectedProfileAvatar");
if (nameLS && avatarLS) {
  document.getElementById("welcome-text").textContent = "Hello, " + nameLS;
  document.getElementById("profile-avatar").src = avatarLS; // comes from your profiles flow
} else {
  window.location.href = "login.html";
}
document.getElementById("logout-link").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = "login.html";
});

// helpers
const getPoster = (item) => item.poster || item.img;
const getBackdrop = (item) => item.backdrop || item.poster || item.img;

//                          Movies 
const movies = [
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

//                 Series 
const series = [
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
  }
];

// Likes persistence with random seeding
const LIKE_KEY = "mediaLikesV1";
function loadLikes(){ try { return JSON.parse(localStorage.getItem(LIKE_KEY) || "{}"); } catch { return {}; } }
function saveLikes(map){ localStorage.setItem(LIKE_KEY, JSON.stringify(map)); }
let likesMap = loadLikes();
function seedRandomLikes(items){
  let mutated = false;
  items.forEach(it=>{
    if(!likesMap[it.id]){ likesMap[it.id] = { count: Math.floor(Math.random()*501), liked:false }; mutated = true; }
  });
  if(mutated) saveLikes(likesMap);
}
seedRandomLikes([...movies, ...series]);

// UI state and filter setup
const state = { sort:"az", filter:"all", search:"" };

const allItems = [...movies, ...series];
const categories = Array.from(new Set(allItems.map(x=>x.category))).sort();
const filterSelect = document.getElementById("filterSelect");
categories.forEach(cat=>{
  const opt = document.createElement("option");
  opt.value = cat; opt.textContent = cat;
  filterSelect.appendChild(opt);
});

// Sorting, filtering, searching
const cmpAZ = (a,b)=>a.title.localeCompare(b.title);
const cmpZA = (a,b)=>b.title.localeCompare(a.title);
const applyFilter = arr => state.filter==="all" ? arr : arr.filter(it=>it.category===state.filter);
const applySearch = arr => {
  const s = state.search.trim().toLowerCase(); if(!s) return arr;
  return arr.filter(it => (it.title+" "+it.info+" "+it.category).toLowerCase().includes(s));
};
const applySort = arr => {
  const copy = arr.slice(); if(state.sort==="az") copy.sort(cmpAZ); else copy.sort(cmpZA);
  return copy;
};
const pipeline = arr => applySort(applySearch(applyFilter(arr))); // sort runs after filter

// HERO, random pick each login
const heroEl = document.getElementById("hero");
const heroTitle = document.getElementById("heroTitle");
const heroMeta = document.getElementById("heroMeta");
const heroDesc = document.getElementById("heroDesc");
const heroPlay = document.getElementById("heroPlay");
const heroInfo = document.getElementById("heroInfo");

function pickHeroItem(){
  const arr = [...movies, ...series];
  return arr[Math.floor(Math.random()*arr.length)];
}
function setHero(item){
  const bg = getBackdrop(item); // uses your backdrop, falls back to poster if needed
  const safe = bg ? encodeURI(bg) : "";
  heroEl.style.backgroundImage = safe ? `url('${safe}')` : ""; // set background image
  heroTitle.textContent = item.title;
  heroMeta.textContent = `${item.year} · ${item.type === "movie" ? "Movie" : "Series"} · ${item.category}`;
  heroDesc.textContent = item.info;

  heroPlay.onclick = () => { alert(`Playing ${item.title}...`); };
  heroInfo.onclick = () => { alert(`${item.title}\n${item.year} · ${item.category}\n\n${item.info}`); };
}
setHero(pickHeroItem());

// DOM targets for rows
const moviesStrip = document.getElementById("moviesStrip");
const seriesStrip = document.getElementById("seriesStrip");

// Card builders and flyout
function likeButtonHTML(item){
  const rec = likesMap[item.id] || { count:0, liked:false };
  const likedClass = rec.liked ? "liked" : "";
  return `
    <div class="like-row">
      <button class="like-btn ${likedClass}" data-id="${item.id}" aria-label="Like ${item.title}">
        <i class="bi bi-heart-fill like-icon"></i>
      </button>
      <span class="like-count" id="count-${item.id}">${rec.count}</span>
    </div>
  `;
}
function flyoutHTML(item){
  const rec = likesMap[item.id] || { count:0, liked:false };
  const heart = rec.liked ? "text-danger" : "text-secondary";
  return `
    <div class="flyout">
      <h4 class="flyout-title">${item.title}</h4>
      <div class="flyout-meta d-flex align-items-center gap-2">
        <span>${item.year}</span>
        <span class="badge badge-cat rounded-pill px-2 py-1">${item.category}</span>
        <span><i class="bi bi-heart-fill ${heart}"></i> ${rec.count}</span>
      </div>
      <p class="flyout-text">${item.info}</p>
    </div>
  `;
}
function cardHTML(item){
  const poster = getPoster(item);
  return `
    <article class="media-card">
      ${flyoutHTML(item)}
      <img class="media-thumb" src="${poster}" alt="${item.title}"
           onerror="this.src='images/fallback.jpg'">
      <div class="media-body">
        <h3 class="media-title" title="${item.title}">${item.title}</h3>
        <div class="d-flex justify-content-between align-items-center mt-1">
          <span class="media-meta">${item.year}</span>
          <span class="badge badge-cat rounded-pill px-2 py-1">${item.category}</span>
        </div>
        <p class="media-meta mt-2" title="${item.info}">${item.info}</p>
        ${likeButtonHTML(item)}
      </div>
    </article>
  `;
}

// Rendering
function renderRow(stripEl, items){
  const arr = pipeline(items);
  stripEl.innerHTML = arr.map(cardHTML).join("");
}
function renderAll(){
  renderRow(moviesStrip, movies);
  renderRow(seriesStrip, series);
  wireLikeButtons();
  initCarousels(); // update arrows after render
}

// Likes wiring
function wireLikeButtons(){
  document.querySelectorAll(".like-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-id");
      const rec = likesMap[id] || { count:0, liked:false };
      if(!rec.liked){
        rec.liked = true; rec.count = (rec.count||0) + 1; btn.classList.add("liked");
      }else{
        rec.liked = false; rec.count = Math.max(0,(rec.count||0)-1); btn.classList.remove("liked");
      }
      likesMap[id] = rec; saveLikes(likesMap);
      const cnt = document.getElementById("count-"+id); if(cnt) cnt.textContent = rec.count;
      btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");

      // update flyout heart and count
      const card = btn.closest(".media-card");
      const flyHeart = card?.querySelector(".flyout .bi-heart-fill");
      if(flyHeart){
        flyHeart.classList.toggle("text-danger", rec.liked);
        flyHeart.classList.toggle("text-secondary", !rec.liked);
        if(flyHeart.nextSibling) flyHeart.nextSibling.textContent = " " + rec.count;
      }
    });
  });
}

// Controls: sort, filter, search
document.getElementById("sortSelect").addEventListener("change", e=>{
  state.sort = e.target.value; renderAll();
});
filterSelect.addEventListener("change", e=>{
  state.filter = e.target.value; renderAll();
});
const searchToggle = document.getElementById("searchToggle");
const searchInput = document.getElementById("searchInput");
searchToggle.addEventListener("click", e=>{
  e.preventDefault();
  searchInput.classList.toggle("show");
  if(searchInput.classList.contains("show")) searchInput.focus();
  else{ state.search = ""; searchInput.value = ""; renderAll(); }
});
let searchTimer = null;
searchInput.addEventListener("input", ()=>{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{ state.search = searchInput.value; renderAll(); }, 200);
});

// Carousel arrows logic
function bindArrows(viewportId){
  const viewport = document.getElementById(viewportId);
  if(!viewport || viewport.dataset.bound === "1") return; // prevent double binding
  const section = viewport.parentElement;
  const prev = section.querySelector(".arrow-btn.prev");
  const next = section.querySelector(".arrow-btn.next");

  function updateDisabled(){
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (prev) prev.disabled = viewport.scrollLeft <= 1;
    if (next) next.disabled = viewport.scrollLeft >= maxScroll - 1;
  }
  const page = ()=> viewport.clientWidth;

  if (prev) prev.addEventListener("click", ()=>{
    viewport.scrollBy({ left: -page(), behavior: "smooth" });
    setTimeout(updateDisabled, 320);
  });
  if (next) next.addEventListener("click", ()=>{
    viewport.scrollBy({ left: page(), behavior: "smooth" });
    setTimeout(updateDisabled, 320);
  });
  viewport.addEventListener("scroll", updateDisabled);
  if (window.ResizeObserver) new ResizeObserver(updateDisabled).observe(viewport);
  viewport.dataset.bound = "1";
  updateDisabled();
}
function initCarousels(){
  bindArrows("moviesViewport");
  bindArrows("seriesViewport");
}

// Initial render
renderAll();
