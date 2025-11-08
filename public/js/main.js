// Amit-Mosseri-206446791-Liel-Yaakobov-322366311-Lihi-Skif-322235888

document.addEventListener("DOMContentLoaded", () => {
  const profileName = localStorage.getItem("selectedProfileName");
  const profileAvatar = localStorage.getItem("selectedProfileAvatar");
  if (profileName && profileAvatar) {
    document.getElementById("welcome-text").textContent = "Hello, " + profileName;
    document.getElementById("profile-avatar").src = profileAvatar;
  } else {
    window.location.href = "/login";
    return;
  }

  document.getElementById("logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "/login";
  });

  const state = { sort: "az", filter: "all", search: "" };
  const LIKE_KEY = "mediaLikesV1";

  let allItems = [];
  let movies = [];
  let series = [];
  let categories = [];
  let likesMap = loadLikes();
  let searchTimer = null;

  const filterSelect = document.getElementById("filterSelect");
  const sortSelect = document.getElementById("sortSelect");
  const searchToggle = document.getElementById("searchToggle");
  const searchInput = document.getElementById("searchInput");
  const heroEl = document.getElementById("hero");
  const heroTitle = document.getElementById("heroTitle");
  const heroMeta = document.getElementById("heroMeta");
  const heroDesc = document.getElementById("heroDesc");
  const heroPlay = document.getElementById("heroPlay");
  const heroInfo = document.getElementById("heroInfo");
  const moviesStrip = document.getElementById("moviesStrip");
  const seriesStrip = document.getElementById("seriesStrip");

  sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderAll();
  });

  filterSelect.addEventListener("change", (e) => {
    state.filter = e.target.value;
    renderAll();
  });

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

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value;
      renderAll();
    }, 200);
  });

  init().catch((err) => {
    console.error("Failed to initialize main view:", err);
    showErrorState("Sorry, we couldn't load titles right now. Please try again later.");
  });

  async function init() {
    await loadContent();
    if (allItems.length === 0) {
      showErrorState("No titles available yet. Please check back soon.");
      return;
    }

    initializeLikesMap(allItems);
    populateCategories();
    pickAndRenderHero();
    renderAll();
  }

  async function loadContent() {
    try {
      const response = await fetch("/api/content?limit=200");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : payload.data || [];
      allItems = list.map(normalizeContent);
      movies = allItems.filter((item) => item.type === "movie");
      series = allItems.filter((item) => item.type === "series");
    } catch (error) {
      throw new Error(`Content fetch failed: ${error.message}`);
    }
  }

  function normalizeContent(raw) {
    const id = raw?.id || raw?._id || `content-${Math.random().toString(36).slice(2, 11)}`;
    return {
      dbId: raw?._id || null,
      id: String(id),
      type: raw?.type || "movie",
      title: raw?.title || "Untitled",
      year: raw?.year || "",
      category: raw?.category || "Uncategorized",
      poster: normalizeAsset(raw?.poster),
      backdrop: normalizeAsset(raw?.backdrop),
      info: raw?.info || "",
      likes: typeof raw?.likes === "number" ? raw.likes : 0,
    };
  }

  function normalizeAsset(src) {
    if (!src || typeof src !== "string") return "";
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("/")) return src;
    return "/" + src.replace(/^\.?\//, "");
  }

  function populateCategories() {
    categories = Array.from(new Set(allItems.map((item) => item.category))).sort();
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      filterSelect.appendChild(opt);
    });
  }

  function getPoster(item) {
    return item.poster || item.img || "";
  }

  function getBackdrop(item) {
    return item.backdrop || item.poster || item.img || "";
  }

  function loadLikes() {
    try {
      return JSON.parse(localStorage.getItem(LIKE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveLikes(map) {
    localStorage.setItem(LIKE_KEY, JSON.stringify(map));
  }

  function initializeLikesMap(items) {
    const store = loadLikes();
    let mutated = false;
    const seen = new Set();

    items.forEach((item) => {
      seen.add(item.id);
      const current = store[item.id] || {};
      const liked = Boolean(current.liked);
      const count = typeof item.likes === "number" ? item.likes : Number(current.count) || 0;
      store[item.id] = { count, liked };
      if (!likesMap[item.id]) mutated = true;
    });

    Object.keys(store).forEach((key) => {
      if (!seen.has(key)) {
        delete store[key];
        mutated = true;
      }
    });

    likesMap = store;
    if (mutated) saveLikes(likesMap);
  }

  function pickAndRenderHero() {
    const pool = allItems.filter((item) => getBackdrop(item));
    const source = pool.length ? pool : allItems;
    if (!source.length) {
      showErrorState("No hero title available.");
      return;
    }
    const item = source[Math.floor(Math.random() * source.length)];
    setHero(item);
  }

  function setHero(item) {
    const bg = getBackdrop(item);
    heroEl.style.backgroundImage = bg ? `url('${encodeURI(bg)}')` : "";
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

  function cmpAZ(a, b) {
    return a.title.localeCompare(b.title);
  }

  function cmpZA(a, b) {
    return b.title.localeCompare(a.title);
  }

  function applyFilter(arr) {
    if (state.filter === "all") return arr;
    return arr.filter((item) => item.category === state.filter);
  }

  function applySearch(arr) {
    const query = state.search.trim().toLowerCase();
    if (!query) return arr;
    return arr.filter((item) =>
      `${item.title} ${item.info} ${item.category}`.toLowerCase().includes(query)
    );
  }

  function applySort(arr) {
    const copy = arr.slice();
    copy.sort(state.sort === "az" ? cmpAZ : cmpZA);
    return copy;
  }

  function decorate(items) {
    return applySort(applySearch(applyFilter(items)));
  }

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

  function flyoutHTML(item) {
    const rec = likesMap[item.id] || { count: 0, liked: false };
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

  function cardHTML(item) {
    const poster = getPoster(item) || "images/fallback.jpg";
    return `
      <article class="media-card">
        ${flyoutHTML(item)}
        <img class="media-thumb" src="${poster}" alt="${item.title}" onerror="this.src='images/fallback.jpg'">
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

  function renderRow(strip, items, emptyMessage) {
    if (!strip) return;
    const decorated = decorate(items);
    if (decorated.length === 0) {
      strip.innerHTML = `<p style="color:#808080; text-align:center; padding:20px 0;">${emptyMessage}</p>`;
      return;
    }
    strip.innerHTML = decorated.map(cardHTML).join("");
  }

  function renderAll() {
    renderRow(moviesStrip, movies, "No movies match your filters yet.");
    renderRow(seriesStrip, series, "No series match your filters yet.");
    wireLikeButtons();
    initCarousels();
  }

  function wireLikeButtons() {
    document.querySelectorAll(".like-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const record = likesMap[id] || { count: 0, liked: false };
        const willLike = !record.liked;
        record.liked = willLike;
        record.count = Math.max(0, (Number(record.count) || 0) + (willLike ? 1 : -1));
        likesMap[id] = record;
        saveLikes(likesMap);

        btn.classList.toggle("liked", record.liked);
        btn.classList.remove("pop");
        void btn.offsetWidth;
        btn.classList.add("pop");

        const counter = document.getElementById(`count-${id}`);
        if (counter) counter.textContent = record.count;

        const card = btn.closest(".media-card");
        const flyHeart = card?.querySelector(".flyout .bi-heart-fill");
        if (flyHeart) {
          flyHeart.classList.toggle("text-danger", record.liked);
          flyHeart.classList.toggle("text-secondary", !record.liked);
          if (flyHeart.nextSibling) {
            flyHeart.nextSibling.textContent = " " + record.count;
          }
        }
      });
    });
  }

  function bindArrows(viewportId) {
    const viewport = document.getElementById(viewportId);
    if (!viewport || viewport.dataset.bound === "1") return;

    const section = viewport.parentElement;
    const prev = section.querySelector(".arrow-btn.prev");
    const next = section.querySelector(".arrow-btn.next");

    function updateDisabled() {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      if (prev) prev.disabled = viewport.scrollLeft <= 1;
      if (next) next.disabled = viewport.scrollLeft >= maxScroll - 1;
    }

    const page = () => viewport.clientWidth;

    if (prev) {
      prev.addEventListener("click", () => {
        viewport.scrollBy({ left: -page(), behavior: "smooth" });
        setTimeout(updateDisabled, 320);
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        viewport.scrollBy({ left: page(), behavior: "smooth" });
        setTimeout(updateDisabled, 320);
      });
    }

    viewport.addEventListener("scroll", updateDisabled);
    if (window.ResizeObserver) {
      new ResizeObserver(updateDisabled).observe(viewport);
    }
    viewport.dataset.bound = "1";
    updateDisabled();
  }

  function initCarousels() {
    bindArrows("moviesViewport");
    bindArrows("seriesViewport");
  }

  function showErrorState(message) {
    heroEl.style.backgroundImage = "none";
    heroTitle.textContent = "We're on it";
    heroMeta.textContent = "";
    heroDesc.textContent = message;
    moviesStrip.innerHTML = `<p style="color:#808080; text-align:center; padding:20px 0;">${message}</p>`;
    seriesStrip.innerHTML = `<p style="color:#808080; text-align:center; padding:20px 0;">${message}</p>`;
  }
});
