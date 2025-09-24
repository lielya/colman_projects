// Profile header population and logout
const nameLS = localStorage.getItem("selectedProfileName");
const avatarLS = localStorage.getItem("selectedProfileAvatar");
if (nameLS && avatarLS) {
  document.getElementById("welcome-text").textContent = "Hello, " + nameLS;
  document.getElementById("profile-avatar").src = avatarLS;
} else {
  window.location.href = "login.html";
}
const logoutLink = document.getElementById("logout-link");
if (logoutLink) {
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "login.html";
  });
}

// Datasets
const movies = [
  { id: "m1", type: "movie", title: "The Shawshank Redemption", year: 1994, category: "Drama",
    img: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    info: "Two imprisoned men bond over years, finding solace and eventual redemption." },
  { id: "m2", type: "movie", title: "The Lion King", year: 1994, category: "Animation",
    img: "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg",
    info: "Lion cub Simba learns about responsibility and bravery." },
  { id: "m3", type: "movie", title: "The Green Mile", year: 1999, category: "Fantasy",
    img: "https://image.tmdb.org/t/p/w500/o0lO84GI7qrG6XFvtsPOSV7CTNa.jpg",
    info: "A death row guard encounters a miracle through a gentle giant." },
  { id: "m4", type: "movie", title: "Titanic", year: 1997, category: "Romance",
    img: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    info: "A love story unfolds aboard the ill-fated RMS Titanic." },
  { id: "m5", type: "movie", title: "Inception", year: 2010, category: "Sci-Fi",
    img: "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    info: "A thief steals information by infiltrating dreams." }
];

const series = [
  { id: "s1", type: "series", title: "Breaking Bad", year: 2008, category: "Crime",
    img: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    info: "A chemistry teacher turns to crime after a cancer diagnosis." },
  { id: "s2", type: "series", title: "Lost", year: 2004, category: "Mystery",
    img: "https://image.tmdb.org/t/p/w500/dM2w364MScsjFf8pfMbaWUcWrR.jpg",
    info: "Survivors of a plane crash face secrets on a strange island." },
  { id: "s3", type: "series", title: "Game of Thrones", year: 2011, category: "Fantasy",
    img: "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
    info: "Noble families vie for control of the Iron Throne." },
  { id: "s4", type: "series", title: "Ozark", year: 2017, category: "Thriller",
    img: "https://image.tmdb.org/t/p/w500/6hQ9wG9YbS4Wk8gJc8Y9VOGBevC.jpg",
    info: "A financial advisor launders money to keep his family safe." },
  { id: "s5", type: "series", title: "Squid Game", year: 2021, category: "Thriller",
    img: "https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
    info: "Hundreds compete in deadly games for a cash prize." },
  { id: "s6", type: "series", title: "The Last Dance", year: 2020, category: "Documentary",
    img: "https://image.tmdb.org/t/p/w500/6N4jZ2xYvTs7xuxMxDPZWS9Vyhi.jpg",
    info: "Michael Jordan and the 1997–98 Chicago Bulls season." }
];

// Likes persistence
const LIKE_KEY = "mediaLikesV1";
function loadLikes() {
  try { return JSON.parse(localStorage.getItem(LIKE_KEY) || "{}"); }
  catch { return {}; }
}
function saveLikes(map) { localStorage.setItem(LIKE_KEY, JSON.stringify(map)); }
let likesMap = loadLikes();

// State
const state = { sort: "az", filter: "all", search: "" };

// Categories into filter
const allItems = [...movies, ...series];
const categories = Array.from(new Set(allItems.map(x => x.category))).sort();
const filterSelect = document.getElementById("filterSelect");
categories.forEach(cat => {
  const opt = document.createElement("option");
  opt.value = cat; opt.textContent = cat;
  filterSelect.appendChild(opt);
});

// Helpers
function byTitleAZ(a, b) { return a.title.localeCompare(b.title); }
function byTitleZA(a, b) { return b.title.localeCompare(a.title); }
function applySort(arr) {
  const copy = arr.slice();
  if (state.sort === "az") copy.sort(byTitleAZ); else copy.sort(byTitleZA);
  return copy;
}
function applyFilterAndSearch(arr) {
  return arr.filter(item => {
    const catOK = state.filter === "all" ? true : item.category === state.filter;
    const s = state.search.trim().toLowerCase();
    const txt = (item.title + " " + item.info + " " + item.category).toLowerCase();
    const searchOK = s.length === 0 ? true : txt.includes(s);
    return catOK && searchOK;
  });
}

// Rendering
const moviesRow = document.getElementById("moviesRow");
const seriesRow = document.getElementById("seriesRow");

function likeButtonHTML(item) {
  const rec = likesMap[item.id] || { count: 0, liked: false };
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

function cardHTML(item) {
  return `
    <article class="media-card">
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

function renderAll() {
  const m = applySort(applyFilterAndSearch(movies));
  const s = applySort(applyFilterAndSearch(series));
  moviesRow.innerHTML = m.map(cardHTML).join("");
  seriesRow.innerHTML = s.map(cardHTML).join("");
  wireLikeButtons();
}

// Likes wiring
function wireLikeButtons() {
  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const rec = likesMap[id] || { count: 0, liked: false };
      if (!rec.liked) {
        rec.liked = true;
        rec.count = (rec.count || 0) + 1;
        btn.classList.add("liked");
      } else {
        rec.liked = false;
        rec.count = Math.max(0, (rec.count || 0) - 1);
        btn.classList.remove("liked");
      }
      likesMap[id] = rec;
      saveLikes(likesMap);
      const cnt = document.getElementById("count-" + id);
      if (cnt) cnt.textContent = rec.count;
      btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
    });
  });
}

// Controls
document.getElementById("sortSelect").addEventListener("change", e => {
  state.sort = e.target.value;
  renderAll();
});
filterSelect.addEventListener("change", e => {
  state.filter = e.target.value;
  renderAll();
});

// Search
const searchToggle = document.getElementById("searchToggle");
const searchInput = document.getElementById("searchInput");
searchToggle.addEventListener("click", (e) => {
  e.preventDefault();
  searchInput.classList.toggle("show");
  if (searchInput.classList.contains("show")) {
    searchInput.focus();
  } else {
    state.search = "";
    searchInput.value = "";
    renderAll();
  }
});
let searchTimer = null;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = searchInput.value;
    renderAll();
  }, 200);
});

// Initial render
renderAll();