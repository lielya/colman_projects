/* Header population and logout */
const nameLS = localStorage.getItem("selectedProfileName");
const avatarLS = localStorage.getItem("selectedProfileAvatar");
if (nameLS && avatarLS) {
  document.getElementById("welcome-text").textContent = "Hello, " + nameLS;
  document.getElementById("profile-avatar").src = avatarLS;
} else {
  window.location.href = "login.html";
}
document.getElementById("logout-link").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = "login.html";
});

/* Helpers */
const img = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/250`;

/* Catalog, 20 + 20 */
const movies = [
  { id:"m1", type:"movie", title:"The Shawshank Redemption", year:1994, category:"Drama", img:img("shawshank"), info:"Two imprisoned men bond over years, finding solace and redemption." },
  { id:"m2", type:"movie", title:"The Lion King", year:1994, category:"Animation", img:img("lion-king"), info:"Simba learns responsibility and bravery." },
  { id:"m3", type:"movie", title:"The Green Mile", year:1999, category:"Fantasy", img:img("green-mile"), info:"A guard encounters a miracle on death row." },
  { id:"m4", type:"movie", title:"Titanic", year:1997, category:"Romance", img:img("titanic"), info:"A love story aboard the RMS Titanic." },
  { id:"m5", type:"movie", title:"Inception", year:2010, category:"Sci-Fi", img:img("inception"), info:"A thief steals information by infiltrating dreams." },
  { id:"m6", type:"movie", title:"Interstellar", year:2014, category:"Sci-Fi", img:img("interstellar"), info:"Explorers travel through a wormhole to save humanity." },
  { id:"m7", type:"movie", title:"Gladiator", year:2000, category:"Action", img:img("gladiator"), info:"A Roman general seeks justice in the arena." },
  { id:"m8", type:"movie", title:"Forrest Gump", year:1994, category:"Drama", img:img("forrest"), info:"Forrest witnesses key moments in history." },
  { id:"m9", type:"movie", title:"The Dark Knight", year:2008, category:"Action", img:img("dark-knight"), info:"Batman faces chaos unleashed by the Joker." },
  { id:"m10", type:"movie", title:"Pulp Fiction", year:1994, category:"Crime", img:img("pulp"), info:"Interwoven stories of crime in Los Angeles." },
  { id:"m11", type:"movie", title:"Spirited Away", year:2001, category:"Animation", img:img("spirited"), info:"A girl enters a world of spirits." },
  { id:"m12", type:"movie", title:"Whiplash", year:2014, category:"Drama", img:img("whiplash"), info:"A drummer and his strict teacher push limits." },
  { id:"m13", type:"movie", title:"Parasite", year:2019, category:"Thriller", img:img("parasite"), info:"Two families’ fates intertwine in unexpected ways." },
  { id:"m14", type:"movie", title:"Mad Max: Fury Road", year:2015, category:"Action", img:img("madmax"), info:"A high-octane desert chase for freedom." },
  { id:"m15", type:"movie", title:"La La Land", year:2016, category:"Romance", img:img("lalaland"), info:"A jazz musician and actress chase dreams." },
  { id:"m16", type:"movie", title:"Coco", year:2017, category:"Animation", img:img("coco"), info:"A boy explores the Land of the Dead." },
  { id:"m17", type:"movie", title:"Dune", year:2021, category:"Sci-Fi", img:img("dune"), info:"A noble house battles for a desert planet." },
  { id:"m18", type:"movie", title:"Arrival", year:2016, category:"Sci-Fi", img:img("arrival"), info:"A linguist communicates with aliens." },
  { id:"m19", type:"movie", title:"Inside Out", year:2015, category:"Animation", img:img("insideout"), info:"Emotions guide a young girl through change." },
  { id:"m20", type:"movie", title:"The Social Network", year:2010, category:"Drama", img:img("social"), info:"The rise of a social media giant." }
];

const series = [
  { id:"s1", type:"series", title:"Breaking Bad", year:2008, category:"Crime", img:img("breakingbad"), info:"A chemistry teacher turns to crime." },
  { id:"s2", type:"series", title:"Lost", year:2004, category:"Mystery", img:img("lost"), info:"Plane crash survivors on a strange island." },
  { id:"s3", type:"series", title:"Game of Thrones", year:2011, category:"Fantasy", img:img("got"), info:"Noble families vie for power." },
  { id:"s4", type:"series", title:"Ozark", year:2017, category:"Thriller", img:img("ozark"), info:"A financial advisor launders money." },
  { id:"s5", type:"series", title:"Squid Game", year:2021, category:"Thriller", img:img("squid"), info:"Deadly games for a cash prize." },
  { id:"s6", type:"series", title:"The Last Dance", year:2020, category:"Documentary", img:img("lastdance"), info:"Michael Jordan and the Bulls." },
  { id:"s7", type:"series", title:"Stranger Things", year:2016, category:"Sci-Fi", img:img("stranger"), info:"Kids face supernatural threats." },
  { id:"s8", type:"series", title:"Chernobyl", year:2019, category:"Drama", img:img("chernobyl"), info:"The story of a nuclear disaster." },
  { id:"s9", type:"series", title:"The Crown", year:2016, category:"Drama", img:img("crown"), info:"Reign of Queen Elizabeth II." },
  { id:"s10", type:"series", title:"Narcos", year:2015, category:"Crime", img:img("narcos"), info:"Drug cartels and law enforcement." },
  { id:"s11", type:"series", title:"The Witcher", year:2019, category:"Fantasy", img:img("witcher"), info:"A monster hunter for hire." },
  { id:"s12", type:"series", title:"Peaky Blinders", year:2013, category:"Crime", img:img("peaky"), info:"A Birmingham crime family." },
  { id:"s13", type:"series", title:"Money Heist", year:2017, category:"Thriller", img:img("heist"), info:"A mastermind plans daring heists." },
  { id:"s14", type:"series", title:"Black Mirror", year:2011, category:"Sci-Fi", img:img("blackmirror"), info:"Dark tales of tech and society." },
  { id:"s15", type:"series", title:"Better Call Saul", year:2015, category:"Drama", img:img("saul"), info:"The rise of Jimmy McGill." },
  { id:"s16", type:"series", title:"The Boys", year:2019, category:"Action", img:img("boys"), info:"Vigilantes vs corrupt superheroes." },
  { id:"s17", type:"series", title:"The Mandalorian", year:2019, category:"Sci-Fi", img:img("mando"), info:"A bounty hunter in the galaxy." },
  { id:"s18", type:"series", title:"True Detective", year:2014, category:"Crime", img:img("truedet"), info:"Anthology of grim investigations." },
  { id:"s19", type:"series", title:"Fargo", year:2014, category:"Crime", img:img("fargo"), info:"Crime stories in the Midwest." },
  { id:"s20", type:"series", title:"House of the Dragon", year:2022, category:"Fantasy", img:img("hotd"), info:"Targaryen civil war prequel." }
];

/* Likes animation with random seeding */
const LIKE_KEY = "mediaLikesV1";
function loadLikes(){ try{return JSON.parse(localStorage.getItem(LIKE_KEY)||"{}");}catch{return{};} }
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

/* UI state */
const state = { sort:"az", filter:"all", search:"" };

/* Category filter */
const allItems = [...movies, ...series];
const categories = Array.from(new Set(allItems.map(x=>x.category))).sort();
const filterSelect = document.getElementById("filterSelect");
categories.forEach(cat=>{
  const opt = document.createElement("option");
  opt.value = cat; opt.textContent = cat;
  filterSelect.appendChild(opt);
});

/* Sorting, filtering, searching */
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
const pipeline = arr => applySort(applySearch(applyFilter(arr))); /* sort runs after filter */

/* HERO random pick each login */
const heroEl = document.getElementById("hero");
const heroTitle = document.getElementById("heroTitle");
const heroMeta = document.getElementById("heroMeta");
const heroDesc = document.getElementById("heroDesc");
const heroPlay = document.getElementById("heroPlay");
const heroInfo = document.getElementById("heroInfo");

/* choose random item and render */
function pickHeroItem(){
  const arr = [...movies, ...series];
  return arr[Math.floor(Math.random()*arr.length)];
}
function setHero(item){
  /* background with image behind a dark overlay handled by CSS ::after */
  heroEl.style.backgroundImage = `url(${item.img})`;
  heroTitle.textContent = item.title;
  heroMeta.textContent = `${item.year} · ${item.type === "movie" ? "Movie" : "Series"} · ${item.category}`;
  heroDesc.textContent = item.info;

  heroPlay.onclick = () => {
    alert(`Playing ${item.title}...`);
  };
  heroInfo.onclick = () => {
    alert(`${item.title}\n${item.year} · ${item.category}\n\n${item.info}`);
  };
}
setHero(pickHeroItem());

/* DOM targets for rows */
const moviesStrip = document.getElementById("moviesStrip");
const seriesStrip = document.getElementById("seriesStrip");

/* Card builders with flyout */
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
  return `
    <article class="media-card">
      ${flyoutHTML(item)}
      <img class="media-thumb" src="${item.img}" alt="${item.title}">
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

/* Render rows */
function renderRow(stripEl, items){
  const arr = pipeline(items);
  stripEl.innerHTML = arr.map(cardHTML).join("");
}
function renderAll(){
  renderRow(moviesStrip, movies);
  renderRow(seriesStrip, series);
  wireLikeButtons();
  initCarousels();
}

/* Like handlers */
function wireLikeButtons(){
  document.querySelectorAll(".like-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-id");
      const rec = likesMap[id] || { count:0, liked:false };
      if(!rec.liked){ rec.liked = true; rec.count = (rec.count||0) + 1; btn.classList.add("liked"); }
      else{ rec.liked = false; rec.count = Math.max(0,(rec.count||0)-1); btn.classList.remove("liked"); }
      likesMap[id] = rec; saveLikes(likesMap);
      const cnt = document.getElementById("count-"+id); if(cnt) cnt.textContent = rec.count;
      btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
      /* update flyout */
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

/* Controls: sort, filter, search */
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

/* Carousel arrows logic, bind once per viewport */
function bindArrows(viewportId){
  const viewport = document.getElementById(viewportId);
  if(viewport.dataset.bound === "1") return; /* avoid double binding */
  const section = viewport.parentElement;
  const prev = section.querySelector(".arrow-btn.prev");
  const next = section.querySelector(".arrow-btn.next");

  function updateDisabled(){
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    prev.disabled = viewport.scrollLeft <= 1;
    next.disabled = viewport.scrollLeft >= maxScroll - 1;
  }
  const page = ()=> viewport.clientWidth;

  prev.addEventListener("click", ()=>{
    viewport.scrollBy({ left: -page(), behavior: "smooth" });
    setTimeout(updateDisabled, 320);
  });
  next.addEventListener("click", ()=>{
    viewport.scrollBy({ left: page(), behavior: "smooth" });
    setTimeout(updateDisabled, 320);
  });
  viewport.addEventListener("scroll", updateDisabled);
  new ResizeObserver(updateDisabled).observe(viewport);
  viewport.dataset.bound = "1";
  updateDisabled();
}
function initCarousels(){
  bindArrows("moviesViewport");
  bindArrows("seriesViewport");
}

/* Initial render */
renderAll();
