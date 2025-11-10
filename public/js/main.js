// Amit-Mosseri-206446791-Liel-Yaakobov-322366311-Lihi-Skif-322235888

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  const profileId = localStorage.getItem("selectedProfileId");
  const profileName = localStorage.getItem("selectedProfileName");
  const profileAvatar = localStorage.getItem("selectedProfileAvatar");

  if (!userId) {
    window.location.href = "/login";
    return;
  }

  if (!profileId) {
    window.location.href = "/profiles";
    return;
  }

  const elements = {
    welcome: document.getElementById("welcome-text"),
    avatar: document.getElementById("profile-avatar"),
    logout: document.getElementById("logout-link"),
    filter: document.getElementById("filterSelect"),
    sort: document.getElementById("sortSelect"),
    watchedFilter: document.getElementById("watchedFilterSelect"),
    searchToggle: document.getElementById("searchToggle"),
    searchInput: document.getElementById("searchInput"),
    hero: document.getElementById("hero"),
    heroTitle: document.getElementById("heroTitle"),
    heroMeta: document.getElementById("heroMeta"),
    heroDesc: document.getElementById("heroDesc"),
    heroPlay: document.getElementById("heroPlay"),
    heroWatchFromBeginning: document.getElementById("heroWatchFromBeginning"),
    heroInfo: document.getElementById("heroInfo"),
    sections: document.getElementById("feedSections"),
    episodesModal: document.getElementById("episodesModal"),
    episodesModalOverlay: document.getElementById("episodesModalOverlay"),
    episodesModalClose: document.getElementById("episodesModalClose"),
    episodesModalTitle: document.getElementById("episodesModalTitle"),
    episodesModalInfo: document.getElementById("episodesModalInfo"),
    episodesModalBody: document.getElementById("episodesModalBody"),
  };

  const state = {
    userId,
    profileId,
    profile: {
      name: profileName || "",
      avatar: profileAvatar || "",
    },
    sections: {
      continueWatching: [],
      recommendations: [],
      popular: [],
      newestByGenre: {},
    },
    liked: new Set(),
    contentById: new Map(),
    progressMap: new Map(),
    genres: [],
    filter: "all",
    sort: "az",
    watchedFilter: "all",
    searchQuery: "",
    searchResults: [],
    isLoading: false,
    genrePagination: {}, // Track pagination state for each genre: { genre: { page: 1, hasMore: true, loading: false } }
  };

  const CARD_GAP = 12;
  const MIN_LOOP_ITEMS = 8;

  let searchTimer = null;

  init().catch((err) => {
    console.error("Failed to initialise main view:", err);
    showErrorState(
      "Sorry, we couldn't load your feed right now. Please try again later."
    );
  });

  async function init() {
    await loadFeed();
    initHeader();
    buildIndices();
    populateGenres();
    const heroCandidate = pickHeroCandidate();
    if (heroCandidate) {
      renderHero(heroCandidate);
} else {
      showErrorState("No titles available yet. Please check back soon.");
    }
    renderSections();
    bindEvents();
  }

  async function loadFeed() {
    state.isLoading = true;
    const response = await fetch(`/api/profiles/${state.profileId}/feed`);
    if (!response.ok) {
      throw new Error(`Feed fetch failed with status ${response.status}`);
    }
    const payload = await response.json();

    if (payload.profile) {
      state.profile.name = payload.profile.name || state.profile.name;
      state.profile.avatar = payload.profile.avatar || state.profile.avatar;
    }

    state.sections = payload.sections || state.sections;
    state.liked = new Set((payload.likes || []).map(String));
    state.isLoading = false;
  }

  function initHeader() {
    if (elements.welcome) {
      const name = state.profile.name || "Viewer";
      elements.welcome.textContent = `Hello, ${name}`;
      localStorage.setItem("selectedProfileName", name);

      console.log("Checking admin status...");
      console.log("Profile name is:", name); 

      if (name.toLowerCase() === "admin") {
        console.log("Admin detected! Trying to show elements.");
        
        const adminElements = document.querySelectorAll('.admin-only');
        console.log("Found elements:", adminElements); 
        
        adminElements.forEach(el => {
          el.style.display = 'list-item';
        });
      }
    }

    if (elements.avatar) {
      const avatar =
        state.profile.avatar ||
        localStorage.getItem("selectedProfileAvatar") ||
        "https://www.freepnglogos.com/uploads/netflix-logo-0.png";
      elements.avatar.src = avatar;
      localStorage.setItem("selectedProfileAvatar", avatar);
    }

    if (elements.logout) {
      elements.logout.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.clear();
        window.location.href = "/login";
      });
    }
  }

  function buildIndices() {
    state.contentById.clear();
    state.progressMap.clear();
    const genreSet = new Set();

    const registerContent = (content) => {
      if (!content || !content.id) return;
      const existing = state.contentById.get(content.id) || {};
      const merged = {
        ...existing,
        ...content,
      };

      merged.poster = normalizeAsset(merged.poster || existing.poster || "");
      merged.backdrop = normalizeAsset(merged.backdrop || existing.backdrop || "");
      merged.category = merged.category || existing.category || "General";
      merged.type = merged.type || existing.type || "movie";
      merged.info = merged.info || existing.info || "";
      merged.likes =
        typeof merged.likes === "number"
          ? merged.likes
          : typeof existing.likes === "number"
          ? existing.likes
          : 0;
      merged.totalLikes = merged.likes;
      merged.score = merged.score || existing.score || 0;
      merged.completions = merged.completions || existing.completions || 0;
      merged.actors = merged.actors || existing.actors || [];

      state.contentById.set(content.id, merged);

      if (merged.category && merged.category !== "General") {
        genreSet.add(merged.category);
      }
    };

    (state.sections.continueWatching || []).forEach((entry) => {
      if (!entry?.content?.id) return;
      registerContent(entry.content);
      state.progressMap.set(entry.content.id, entry);
    });

    (state.sections.recommendations || []).forEach(registerContent);
    (state.sections.popular || []).forEach(registerContent);

    const newestByGenre = state.sections.newestByGenre || {};
    Object.keys(newestByGenre).forEach((genre) => {
      newestByGenre[genre].forEach(registerContent);
      if (genre && genre !== "General") {
        genreSet.add(genre);
      }
    });

    state.genres = Array.from(genreSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  function populateGenres() {
    if (!elements.filter) return;
    elements.filter.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "all";
    defaultOption.textContent = "All genres";
    elements.filter.appendChild(defaultOption);

    state.genres.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      elements.filter.appendChild(option);
    });
  }

  function pickHeroCandidate() {
    const continueItems = state.sections.continueWatching || [];
    if (continueItems.length && continueItems[0].content) {
      return continueItems[0].content;
    }

    const recommendations = state.sections.recommendations || [];
    const recommended =
      recommendations.find((item) => item.backdrop) || recommendations[0];
    if (recommended) return recommended;

    const popular = state.sections.popular || [];
    const trending =
      popular.find((item) => item.backdrop) || popular.find(Boolean);
    if (trending) return trending;

    const first = state.contentById.values().next();
    if (!first.done) return first.value;

    return null;
  }

  function renderHero(content) {
    if (!content || !elements.hero) return;

    const stored = state.contentById.get(content.id) || content;
    const progress = state.progressMap.get(content.id);

    const background = stored.backdrop || stored.poster || "";
    elements.hero.style.backgroundImage = background
      ? `url('${encodeURI(background)}')`
      : "";

    const metaParts = [];
    if (stored.year) metaParts.push(stored.year);
    metaParts.push(stored.type === "series" ? "Series" : "Movie");
    if (stored.category) metaParts.push(stored.category);

    elements.heroTitle.textContent = stored.title;
    elements.heroMeta.textContent = metaParts.join(" · ");
    elements.heroDesc.textContent = stored.info || "";

    elements.heroPlay.dataset.contentId = stored.id;
    elements.heroPlay.dataset.resume = progress?.resumePositionSec || 0;
    elements.heroPlay.dataset.duration = progress?.durationSec || 0;
    elements.heroPlay.dataset.episodeId = progress?.episode?.id || "";
    // Open content modal for both series and movies
    elements.heroPlay.textContent = stored.type === "series" ? "View Episodes" : (progress ? "Resume" : "Play");
    elements.heroPlay.onclick = () => openContentModal(stored);

    // Show "Watch from Beginning" button only if progress exists
    if (elements.heroWatchFromBeginning) {
      if (progress && progress.watchPercentage > 0) {
        elements.heroWatchFromBeginning.style.display = "inline-block";
        elements.heroWatchFromBeginning.dataset.contentId = stored.id;
        elements.heroWatchFromBeginning.onclick = () => handlePlayFromBeginning(stored.id);
      } else {
        elements.heroWatchFromBeginning.style.display = "none";
      }
    }

    elements.heroInfo.onclick = () => {
      const info = [
        stored.title,
        elements.heroMeta.textContent,
        "",
        stored.info || "No description available.",
      ].join("\n");
      alert(info);
    };
  }

  function getCardWidthForStrip(strip, viewport) {
    if (!strip) return viewport?.clientWidth || 0;
    const firstCard = strip.querySelector(".media-card");
    if (!firstCard) return viewport?.clientWidth || 0;
    const style = window.getComputedStyle(firstCard);
    const marginRight = parseFloat(style.marginRight || CARD_GAP);
    const marginLeft = parseFloat(style.marginLeft || 0);
    return firstCard.offsetWidth + marginLeft + marginRight;
  }

  function buildCircularMarkup(cards, options = {}) {
    const markup = cards.map((card) => cardHTML(card, options));
    if (markup.length === 0) {
      return { markup: "", cloneCount: 0 };
    }
    const clones = Math.min(markup.length, 7);
    const leadingClones = markup.slice(-clones);
    const trailingClones = markup.slice(0, clones);
    return {
      markup: [...leadingClones, ...markup, ...trailingClones].join(""),
      cloneCount: clones,
    };
  }

  function shouldLoopSection(cards, options = {}) {
    if (typeof options.forceLoop === "boolean") {
      return options.forceLoop;
    }
    return Array.isArray(cards) && cards.length >= MIN_LOOP_ITEMS;
  }

  function renderSections() {
    if (!elements.sections) return;
    elements.sections.innerHTML = "";

    if (state.searchQuery.length >= 2) {
      renderSearchResults();
      return;
    }

    renderSection(
      "continue",
      "Continue Watching",
      state.sections.continueWatching || [],
      { showProgress: true }
    );

    renderSection(
      "recommendations",
      "Recommended For You",
      state.sections.recommendations || [],
      { showReason: true, allowSort: true }
    );

    renderSection("popular", "Popular Now", state.sections.popular || [], {
      allowSort: true,
    });

    const newest = state.sections.newestByGenre || {};
    Object.entries(newest)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([genre, items]) => {
        if (state.filter !== "all" && state.filter !== genre) return;
        renderSection(
          `latest-${slugify(genre)}`,
          `Latest in ${genre}`,
          items,
          { allowSort: true, genre: genre, infiniteScroll: true }
        );
      });

    if (!elements.sections.hasChildNodes()) {
      renderEmptyState("No titles match your current filters.");
    }
  }

  function renderSearchResults() {
    if (state.isLoading) {
      renderEmptyState("Searching titles...");
      return;
    }

    const results = applyGenreFilter(state.searchResults);
    if (results.length === 0) {
      renderEmptyState("No titles found for your search.");
      return;
    }

    renderSection(
      "search",
      `Results for "${state.searchQuery}"`,
      results
    );
  }

  function renderSection(sectionId, title, items, options = {}) {
    const cards = (items || [])
      .map((item) => {
        const content = item.content || item;
        const merged = mergeContent(content);

        // Filter by category
        if (state.filter !== "all" && merged.category !== state.filter) {
          return null;
        }

        // Filter by watched status
        if (state.watchedFilter !== "all") {
          const hasProgress = state.progressMap.has(merged.id);
          const isWatched = hasProgress && state.progressMap.get(merged.id)?.watchPercentage > 0;
          
          if (state.watchedFilter === "watched" && !isWatched) {
            return null;
          }
          if (state.watchedFilter === "not-watched" && isWatched) {
            return null;
          }
        }

        return {
          content: merged,
          reason: item.reason,
          progress: options.showProgress ? item : null,
        };
      })
      .filter(Boolean);

    if (options.allowSort) {
      cards.sort((a, b) => {
        const contentA = a?.content || {};
        const contentB = b?.content || {};
        
        switch (state.sort) {
          case "za":
            const titleA = (contentA.title || "").toLowerCase();
            const titleB = (contentB.title || "").toLowerCase();
            return titleB.localeCompare(titleA);
          
          case "rating":
            // Sort by score (likes + completions)
            const scoreA = contentA.score || (contentA.likes || 0) + (contentA.completions || 0);
            const scoreB = contentB.score || (contentB.likes || 0) + (contentB.completions || 0);
            return scoreB - scoreA; // Descending order (highest first)
          
          case "popularity":
            // Sort by popularity (likes)
            const likesA = contentA.likes || 0;
            const likesB = contentB.likes || 0;
            return likesB - likesA; // Descending order (highest first)
          
          case "az":
          default:
            const titleAZ = (contentA.title || "").toLowerCase();
            const titleBZ = (contentB.title || "").toLowerCase();
            return titleAZ.localeCompare(titleBZ);
        }
      });
    }

    if (cards.length === 0) return;

    const titleEl = document.createElement("h2");
    titleEl.className = "row-title";
    titleEl.textContent = title;
    titleEl.id = `section-${sectionId}`;
    elements.sections.appendChild(titleEl);

    const sectionEl = document.createElement("section");
    sectionEl.className = "carousel-section";
    sectionEl.dataset.section = sectionId;
    if (options.genre) {
      sectionEl.dataset.genre = options.genre;
    }

    const viewportId = `${sectionId}-viewport`;

    const prevBtn = document.createElement("button");
    prevBtn.className = "arrow-btn prev";
    prevBtn.dataset.target = viewportId;
    prevBtn.setAttribute("aria-label", `Previous ${title}`);
    prevBtn.innerHTML = `<i class="bi bi-chevron-left"></i>`;

    const nextBtn = document.createElement("button");
    nextBtn.className = "arrow-btn next";
    nextBtn.dataset.target = viewportId;
    nextBtn.setAttribute("aria-label", `Next ${title}`);
    nextBtn.innerHTML = `<i class="bi bi-chevron-right"></i>`;

    const viewport = document.createElement("div");
    viewport.className = "carousel-viewport";
    viewport.id = viewportId;

    const strip = document.createElement("div");
    strip.className = "carousel-strip";
    
    const enableLoop = shouldLoopSection(cards, options);
    if (cards.length > 0 && enableLoop) {
      const { markup, cloneCount } = buildCircularMarkup(cards, options);
      strip.innerHTML = markup;
      strip.dataset.originalLength = cards.length;
      strip.dataset.cloneCount = cloneCount;
      strip.dataset.isCircular = "true";
    } else {
      strip.innerHTML = cards.map((card) => cardHTML(card, options)).join("");
      strip.dataset.originalLength = cards.length;
      strip.dataset.cloneCount = "0";
      strip.dataset.isCircular = "false";
    }

    viewport.appendChild(strip);
    sectionEl.appendChild(prevBtn);
    sectionEl.appendChild(viewport);
    sectionEl.appendChild(nextBtn);

    elements.sections.appendChild(sectionEl);

    if (cards.length > 0 && strip.dataset.isCircular === "true") {
      setTimeout(() => {
        const firstCard = strip.querySelector(".media-card");
        if (firstCard) {
          const cardWidth = getCardWidthForStrip(strip, viewport);
          const clones = parseInt(strip.dataset.cloneCount || "0", 10);
          viewport.scrollLeft = cardWidth * clones;
        } else {
          viewport.scrollLeft = 0;
        }
      }, 60);
    }

    bindArrows(viewportId);
    
    // Setup infinite scroll for genre sections
    if (options.infiniteScroll && options.genre) {
      setupInfiniteScroll(viewportId, options.genre);
      // Initialize pagination state if not exists
      if (!state.genrePagination[options.genre]) {
        // Check if there might be more content (if we have exactly 10 items, likely more available)
        const initialItemCount = cards.length;
        state.genrePagination[options.genre] = {
          page: 1,
          hasMore: true, // Will be updated when we try to load more
          loading: false,
          initialCount: initialItemCount,
        };
        // Pre-check if more content is available
        checkIfMoreContentAvailable(options.genre, initialItemCount);
      }
    }
  }

  function mergeContent(content) {
    if (!content || !content.id) return content;
    const stored = state.contentById.get(content.id);
    if (stored) return stored;
    state.contentById.set(content.id, content);
    return content;
  }

  function cardHTML(card, options = {}) {
    const content = card.content;
    const liked = state.liked.has(content.id);
    const likeCount =
      typeof content.likes === "number"
        ? content.likes
        : typeof content.totalLikes === "number"
        ? content.totalLikes
        : 0;
    const completions = content.completions || 0;
    const score = content.score || likeCount + completions;
    const poster = content.poster || "images/fallback.jpg";

    const progressMarkup = card.progress
      ? progressHTML(card.progress)
      : "";

    const reasonMarkup =
      options.showReason && card.reason
        ? `<p class="media-meta mt-2 reason" title="${escapeHtml(card.reason)}">${escapeHtml(card.reason)}</p>`
        : "";

    const flyout = `
    <div class="flyout">
        <h4 class="flyout-title">${escapeHtml(content.title)}</h4>
      <div class="flyout-meta d-flex align-items-center gap-2">
          <span>${content.year || ""}</span>
          <span class="badge badge-cat rounded-pill px-2 py-1">${escapeHtml(
            content.category || "General"
          )}</span>
          <span><i class="bi bi-heart-fill ${
            liked ? "text-danger" : "text-secondary"
          }"></i> ${formatNumber(likeCount)}</span>
        </div>
        <p class="flyout-text">${escapeHtml(content.info || "")}</p>
    </div>
  `;

  return `
      <article class="media-card" data-id="${content.id}">
        ${flyout}
      <img class="media-thumb" src="${poster}" alt="${escapeHtml(
      content.title
    )}" onerror="this.onerror=null;this.src='/images/fallback.jpg';">
      <div class="media-body">
          <h3 class="media-title" title="${escapeHtml(
            content.title
          )}">${escapeHtml(content.title)}</h3>
        <div class="d-flex justify-content-between align-items-center mt-1">
            <span class="media-meta">${content.year || ""}</span>
            <span class="badge badge-cat rounded-pill px-2 py-1">${escapeHtml(
              content.category || "General"
            )}</span>
          </div>
          <div class="media-rating mt-1">
              <i class="bi bi-star-fill"></i>
              <span>${escapeHtml(content.rating || 'N/A')}</span>
          </div>
          <p class="media-meta mt-2" title="${escapeHtml(
            content.info || ""
          )}">${escapeHtml(content.info || "")}</p>
          ${reasonMarkup}
          ${progressMarkup}
          <div class="like-row">
            <button class="like-btn ${liked ? "liked" : ""}" data-id="${
      content.id
    }" aria-label="Like ${escapeHtml(content.title)}">
              <i class="bi bi-heart-fill like-icon"></i>
            </button>
            <span class="like-count" data-count-for="${content.id}">${formatNumber(
      likeCount
    )}</span>
          </div>
          <div class="card-meta">
            <span class="meta-item" data-score-for="${content.id}">Score: ${formatNumber(score)}</span>
            ${
              completions
                ? `<span class="meta-item">Completed: ${formatNumber(completions)}</span>`
                : ""
            }
          </div>
      </div>
    </article>
  `;
}

  function progressHTML(progress) {
    const percentage = Math.max(
      0,
      Math.min(
        100,
        Math.round(progress.watchPercentage || 0) ||
          Math.round(
            progress.durationSec
              ? (progress.lastPositionSec / progress.durationSec) * 100
              : 0
          )
      )
    );

    const resumeLabel = formatTime(progress.resumePositionSec || 0);

    return `
      <div class="progress-track" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-value" style="width:${percentage}%"></div>
      </div>
      <div class="progress-label">Resume from ${resumeLabel} (${percentage}% watched)</div>
      <div class="d-flex gap-2 mt-2" style="flex-wrap: wrap;">
        <button class="resume-btn btn btn-sm btn-light" data-content-id="${
          progress.content.id
        }" data-progress-id="${progress.id}">
          Resume
        </button>
        <button class="watch-from-beginning-btn btn btn-sm" data-content-id="${
          progress.content.id
        }">
          <i class="bi bi-arrow-clockwise me-1"></i>Watch from Beginning
        </button>
      </div>
    `;
  }

  function renderEmptyState(message) {
    const container = document.createElement("div");
    container.className = "section-empty";
    container.innerHTML = `<p class="empty-text">${escapeHtml(message)}</p>`;
    elements.sections.appendChild(container);
  }

  function showErrorState(message) {
    if (elements.hero) {
      elements.hero.style.backgroundImage = "none";
    }
    if (elements.heroTitle) elements.heroTitle.textContent = "We're on it";
    if (elements.heroMeta) elements.heroMeta.textContent = "";
    if (elements.heroDesc) elements.heroDesc.textContent = message;
    if (elements.sections) {
      elements.sections.innerHTML = `<p class="empty-text">${escapeHtml(
        message
      )}</p>`;
    }
  }

  function bindEvents() {
    if (elements.filter) {
      elements.filter.addEventListener("change", (e) => {
        state.filter = e.target.value || "all";
        renderSections();
      });
    }

    if (elements.sort) {
      elements.sort.addEventListener("change", (e) => {
        state.sort = e.target.value || "az";
        renderSections();
      });
    }

    if (elements.watchedFilter) {
      elements.watchedFilter.addEventListener("change", (e) => {
        state.watchedFilter = e.target.value || "all";
        renderSections();
      });
    }

    if (elements.searchToggle && elements.searchInput) {
      elements.searchToggle.addEventListener("click", (e) => {
        e.preventDefault();
        elements.searchInput.classList.toggle("show");
        if (elements.searchInput.classList.contains("show")) {
          elements.searchInput.focus();
        } else {
          state.searchQuery = "";
          state.searchResults = [];
          elements.searchInput.value = "";
          renderSections();
        }
      });

      elements.searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);
        const value = elements.searchInput.value.trim();
        state.searchQuery = value;

        if (value.length < 2) {
          state.searchResults = [];
          renderSections();
          return;
        }

        searchTimer = setTimeout(async () => {
          await performSearch(value);
          renderSections();
        }, 250);
      });
    }

    if (elements.sections) {
      elements.sections.addEventListener("click", handleSectionClick);
    }

    // Episodes modal close handlers
    if (elements.episodesModalClose) {
      elements.episodesModalClose.addEventListener("click", closeEpisodesModal);
    }
    if (elements.episodesModalOverlay) {
      elements.episodesModalOverlay.addEventListener("click", closeEpisodesModal);
    }
    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && elements.episodesModal.style.display !== "none") {
        closeEpisodesModal();
      }
    });
  }

  async function performSearch(query) {
    state.isLoading = true;
    try {
      const response = await fetch(
        `/api/content/search?q=${encodeURIComponent(query)}`
      );
      if (response.status === 404) {
        state.searchResults = [];
        return;
      }
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || data.data || [];
      state.searchResults = list
        .map((item) => mergeContent(item))
        .filter(Boolean);
    } catch (error) {
      console.error("Search error:", error);
      state.searchResults = [];
    } finally {
      state.isLoading = false;
    }
  }

  function handleSectionClick(event) {
    const likeBtn = event.target.closest(".like-btn");
    if (likeBtn) {
      event.preventDefault();
      const contentId = likeBtn.dataset.id;
      if (contentId) handleLikeToggle(contentId, likeBtn);
      return;
    }

    const watchFromBeginningBtn = event.target.closest(".watch-from-beginning-btn");
    if (watchFromBeginningBtn) {
      event.preventDefault();
      event.stopPropagation();
      const contentId = watchFromBeginningBtn.dataset.contentId;
      if (contentId) handlePlayFromBeginning(contentId);
      return;
    }

    const resumeBtn = event.target.closest(".resume-btn");
    if (resumeBtn) {
      event.preventDefault();
      event.stopPropagation();
      const contentId = resumeBtn.dataset.contentId;
      if (contentId) handlePlay(contentId);
      return;
    }

    const card = event.target.closest(".media-card");
    if (card) {
      event.preventDefault();
      const contentId = card.dataset.id;
      const content = state.contentById.get(contentId);
      if (content) {
        // Open content modal for both series and movies
    openContentModal(content);
      }
    }
  }

  async function handleLikeToggle(contentId, button) {
    const isLiked = state.liked.has(contentId);
    const endpoint = isLiked ? "unlike" : "like";

    button.disabled = true;
    button.classList.add("loading");
    try {
      const response = await fetch(
        `/api/profiles/${state.profileId}/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId }),
        }
      );
      if (!response.ok) {
        throw new Error(`Like toggle failed with status ${response.status}`);
      }

      const content = state.contentById.get(contentId);
      if (content) {
        const delta = isLiked ? -1 : 1;
        content.likes = Math.max(0, (content.likes || 0) + delta);
        content.totalLikes = content.likes;
        content.score =
          (content.completions || 0) + (content.likes || 0);
      }

      if (isLiked) {
        state.liked.delete(contentId);
      } else {
        state.liked.add(contentId);
      }

      updateLikeUI(contentId);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      alert("Unable to update like right now. Please try again later.");
    } finally {
      button.disabled = false;
      button.classList.remove("loading");
    }
  }

  function updateLikeUI(contentId) {
    const liked = state.liked.has(contentId);
    const content = state.contentById.get(contentId);
    const likeCount = content?.likes || 0;
    const scoreValue =
      (content?.completions || 0) + (content?.likes || 0);

    const cards = elements.sections.querySelectorAll(
      `.media-card[data-id="${contentId}"]`
    );
    cards.forEach((card) => {
      const likeBtn = card.querySelector(".like-btn");
      const countEl = card.querySelector('[data-count-for]');
      const flyHeart = card.querySelector(".flyout .bi-heart-fill");

      if (likeBtn) {
        likeBtn.classList.toggle("liked", liked);
        likeBtn.classList.remove("pop");
        void likeBtn.offsetWidth;
        likeBtn.classList.add("pop");
      }

      if (countEl) {
        countEl.textContent = formatNumber(likeCount);
      }

      const scoreEl = card.querySelector(
        `[data-score-for="${contentId}"]`
      );
      if (scoreEl) {
        scoreEl.textContent = `Score: ${formatNumber(scoreValue)}`;
      }

      if (flyHeart) {
        flyHeart.classList.toggle("text-danger", liked);
        flyHeart.classList.toggle("text-secondary", !liked);
        if (flyHeart.nextSibling) {
          flyHeart.nextSibling.textContent = ` ${formatNumber(likeCount)}`;
        }
      }
    });
  }

  async function handlePlay(contentId) {
    const content = state.contentById.get(contentId);
    if (!content) return;

    const progress = state.progressMap.get(contentId);
    const payload = {
      contentId,
      episodeId: progress?.episode?.id,
      lastPositionSec: progress?.resumePositionSec || 0,
      durationSec: progress?.durationSec || 0,
      status: "in_progress",
      event: "start",
    };

    try {
      const response = await fetch(
        `/api/profiles/${state.profileId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(`Progress update failed with status ${response.status}`);
      }
      const result = await response.json();
      const updated = result.progress;
      if (updated?.content) {
        state.progressMap.set(updated.content.id, updated);
        const list = state.sections.continueWatching || [];
        const idx = list.findIndex((entry) => entry.content?.id === updated.content.id);
        if (idx >= 0) {
          list[idx] = updated;
        } else {
          list.unshift(updated);
        }
        state.sections.continueWatching = list;
        buildIndices();
        renderSections();
      }

      const resume = progress?.resumePositionSec || 0;
      alert(
        resume > 0
          ? `Resuming ${content.title} from ${formatTime(resume)}.`
          : `Playing ${content.title}...`
      );
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }

  async function handlePlayFromBeginning(contentId) {
    const content = state.contentById.get(contentId);
    if (!content) return;

    try {
      let episodeId = null;
      let durationSec = 0;

      // For series, get the first episode (season 1, episode 1)
      if (content.type === "series") {
        const response = await fetch(
          `/api/content/${contentId}/first-episode`
        );
        if (response.ok) {
          const firstEpisode = await response.json();
          episodeId = firstEpisode.id;
          durationSec = firstEpisode.durationSec || 0;
        } else {
          console.warn("Could not find first episode for series:", contentId);
          // Continue without episodeId - the backend will handle it
        }
      }

      // Reset progress to beginning (position 0)
      const payload = {
        contentId,
        episodeId: episodeId || null,
        lastPositionSec: 0,
        durationSec: durationSec || 0,
        watchPercentage: 0,
        status: "in_progress",
        event: "start",
      };

      const progressResponse = await fetch(
        `/api/profiles/${state.profileId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!progressResponse.ok) {
        throw new Error(
          `Progress update failed with status ${progressResponse.status}`
        );
      }

      const result = await progressResponse.json();
      const updated = result.progress;
      if (updated?.content) {
        state.progressMap.set(updated.content.id, updated);
        const list = state.sections.continueWatching || [];
        const idx = list.findIndex(
          (entry) => entry.content?.id === updated.content.id
        );
        if (idx >= 0) {
          list[idx] = updated;
        } else {
          list.unshift(updated);
        }
        state.sections.continueWatching = list;
        buildIndices();
        renderSections();
        
        // Update hero if this content is currently displayed
        const heroContentId = elements.heroPlay?.dataset.contentId;
        if (heroContentId === contentId) {
          renderHero(content);
        }
      }

      const episodeInfo = content.type === "series" && episodeId
        ? " from the first episode"
        : "";
      alert(`Starting ${content.title}${episodeInfo} from the beginning...`);
    } catch (error) {
      console.error("Failed to start from beginning:", error);
      alert("Unable to start playback from the beginning. Please try again.");
    }
  }

  function bindArrows(viewportId) {
    const viewport = document.getElementById(viewportId);
    if (!viewport || viewport.dataset.bound === "1") return;

    const section = viewport.parentElement;
    const prev = section.querySelector(".arrow-btn.prev");
    const next = section.querySelector(".arrow-btn.next");
    const strip = viewport.querySelector(".carousel-strip");
    const isCircular = strip?.dataset.isCircular === "true";

    const getOriginalLength = () =>
      strip ? parseInt(strip.dataset.originalLength || "0", 10) : 0;
    const getCloneCount = () =>
      strip ? parseInt(strip.dataset.cloneCount || "0", 10) : 0;

    const getCardWidth = () => getCardWidthForStrip(strip, viewport);

    const jumpWithoutAnimation = (position) => {
      const previousBehavior = viewport.style.scrollBehavior;
      viewport.style.scrollBehavior = "auto";
      viewport.scrollLeft = position;
      viewport.style.scrollBehavior = previousBehavior || "";
    };

    const ensureCircularBounds = () => {
      const originalLength = getOriginalLength();
      const cloneCount = getCloneCount();
      if (!isCircular || !originalLength || cloneCount === 0) return;
      const cardWidth = getCardWidth();
      const cloneWidth = cardWidth * cloneCount;
      const contentWidth = cardWidth * originalLength;
      const leftBoundary = cloneWidth;
      const rightBoundary = cloneWidth + contentWidth;
      const threshold = cardWidth / 2;

      if (viewport.scrollLeft >= rightBoundary - threshold) {
        jumpWithoutAnimation(viewport.scrollLeft - contentWidth);
      } else if (viewport.scrollLeft <= leftBoundary - threshold) {
        jumpWithoutAnimation(viewport.scrollLeft + contentWidth);
      }
    };

    const updateDisabled = () => {
      if (prev) prev.disabled = false;
      if (next) next.disabled = false;
      const hasScrollRoom = viewport.scrollWidth - viewport.clientWidth > 2;
      const showArrows = isCircular ? hasScrollRoom : viewport.scrollWidth - viewport.clientWidth > 2;

      if (prev) {
        prev.style.visibility = showArrows ? "visible" : "hidden";
      }
      if (next) {
        next.style.visibility = showArrows ? "visible" : "hidden";
      }

      if (!isCircular) {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        if (prev) prev.disabled = viewport.scrollLeft <= 1;
        if (next) next.disabled = viewport.scrollLeft >= maxScroll - 1;
      }
    };

    const page = () => {
      const cardWidth = getCardWidth();
      return cardWidth > 0 ? cardWidth * 7 : viewport.clientWidth;
    };

    if (prev) {
      prev.addEventListener("click", () => {
        viewport.scrollBy({
          left: -page(),
          behavior: "smooth",
        });
        setTimeout(() => {
          ensureCircularBounds();
          updateDisabled();
        }, 350);
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        viewport.scrollBy({
          left: page(),
          behavior: "smooth",
        });
        setTimeout(() => {
          ensureCircularBounds();
          updateDisabled();
        }, 350);
      });
    }

    let rafId = null;
    viewport.addEventListener(
      "scroll",
      () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          ensureCircularBounds();
          updateDisabled();
        });
      },
      { passive: true }
    );

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => {
        ensureCircularBounds();
        updateDisabled();
      });
      observer.observe(viewport);
    }

    viewport.dataset.bound = "1";
    ensureCircularBounds();
    updateDisabled();
  }

  function setupInfiniteScroll(viewportId, genre) {
    const viewport = document.getElementById(viewportId);
    if (!viewport) return;

    let scrollTimeout = null;
    let isLoading = false;

    viewport.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (isLoading) return;
        
        const scrollLeft = viewport.scrollLeft;
        const scrollWidth = viewport.scrollWidth;
        const clientWidth = viewport.clientWidth;
        const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;

        // Load more when scrolled 70% to the right (for circular carousel, check middle section)
        const pagination = state.genrePagination[genre];
        if (pagination && pagination.hasMore && !pagination.loading) {
          const strip = viewport.querySelector(".carousel-strip");
          const isCircular = strip?.dataset.isCircular === "true";
          
          if (isCircular) {
            // For circular carousel, check if we're near the end (70% scrolled)
            const scrollWidth = viewport.scrollWidth;
            const clientWidth = viewport.clientWidth;
            const maxScroll = scrollWidth - clientWidth;
            const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
            
            // Load more when scrolled 70% to the right
            if (scrollPercentage > 0.7) {
              isLoading = true;
              loadMoreGenreContent(genre, viewportId).finally(() => {
                isLoading = false;
              });
            }
          } else {
            // For non-circular carousel, use percentage
            if (scrollPercentage > 0.7) {
              isLoading = true;
              loadMoreGenreContent(genre, viewportId).finally(() => {
                isLoading = false;
              });
            }
          }
        }
      }, 150);
    }, { passive: true });
  }

  async function checkIfMoreContentAvailable(genre, currentCount) {
    try {
      const response = await fetch(
        `/api/content/genre/${encodeURIComponent(genre)}?page=2`
      );
      if (response.ok) {
        const data = await response.json();
        const pagination = state.genrePagination[genre];
        if (pagination) {
          pagination.hasMore = data.hasMore || (data.items && data.items.length > 0);
        }
      }
    } catch (error) {
      // Silently fail - will be checked when user scrolls
      console.debug("Pre-check for more content failed:", error);
    }
  }

  async function loadMoreGenreContent(genre, viewportId) {
    const pagination = state.genrePagination[genre];
    if (!pagination || pagination.loading || !pagination.hasMore) return;

    pagination.loading = true;
    const nextPage = pagination.page + 1;

    try {
      const response = await fetch(
        `/api/content/genre/${encodeURIComponent(genre)}?page=${nextPage}`
      );
      if (!response.ok) {
        throw new Error(`Failed to load more content: ${response.status}`);
      }

      const data = await response.json();
      const newItems = data.items || [];

      if (newItems.length === 0) {
        pagination.hasMore = false;
        pagination.loading = false;
        return;
      }

      // Merge new items into state
      newItems.forEach((item) => {
        mergeContent(item);
        const genreKey = item.category || genre;
        if (!state.sections.newestByGenre[genreKey]) {
          state.sections.newestByGenre[genreKey] = [];
        }
        // Avoid duplicates
        const exists = state.sections.newestByGenre[genreKey].some(
          (existing) => existing.id === item.id || (existing.content && existing.content.id === item.id)
        );
        if (!exists) {
          state.sections.newestByGenre[genreKey].push(item);
        }
      });

      // Update pagination state
      pagination.page = nextPage;
      pagination.hasMore = data.hasMore || false;
      pagination.loading = false;

      // Append new items to the carousel
      const viewport = document.getElementById(viewportId);
      if (viewport) {
        const strip = viewport.querySelector(".carousel-strip");
        if (strip && strip.dataset.isCircular === "true") {
          const genreKey = genre;
          const allItems = state.sections.newestByGenre[genreKey] || [];
          const allCards = allItems.map((item) => {
            const merged = mergeContent(item);
            return {
              content: merged,
              reason: null,
              progress: null,
            };
          });

          const currentScroll = viewport.scrollLeft;
          const previousCloneCount = parseInt(strip.dataset.cloneCount || "0", 10);
          const previousCardWidth = getCardWidthForStrip(strip, viewport);
          const previousCloneWidth = previousCardWidth * previousCloneCount;
          const relativePosition = Math.max(currentScroll - previousCloneWidth, 0);

          const enableLoop = shouldLoopSection(allCards, { allowSort: false });
          if (enableLoop) {
            const { markup, cloneCount } = buildCircularMarkup(allCards, { allowSort: false });
            strip.innerHTML = markup;
            strip.dataset.cloneCount = cloneCount.toString();
            strip.dataset.isCircular = "true";
          } else {
            strip.innerHTML = allCards
              .map((card) =>
                cardHTML(card, {
                  allowSort: false,
                })
              )
              .join("");
            strip.dataset.cloneCount = "0";
            strip.dataset.isCircular = "false";
          }
          strip.dataset.originalLength = allCards.length.toString();

          const newCardWidth = getCardWidthForStrip(strip, viewport);
          const contentWidth = newCardWidth * allItems.length;
          const maxRelative = Math.max(contentWidth - viewport.clientWidth, 0);
          const clampedRelative = Math.min(relativePosition, maxRelative);
          const cloneCount = parseInt(strip.dataset.cloneCount || "0", 10);
          const targetScroll = enableLoop
            ? newCardWidth * cloneCount + clampedRelative
            : clampedRelative;

          const previousBehavior = viewport.style.scrollBehavior;
          viewport.style.scrollBehavior = "auto";
          viewport.scrollLeft = targetScroll;
          viewport.style.scrollBehavior = previousBehavior || "";

          // Trigger a scroll update to refresh arrow state
          viewport.dispatchEvent(new Event("scroll"));
        } else if (strip) {
          const cards = newItems.map((item) => {
            const merged = mergeContent(item);
            return cardHTML(
              {
                content: merged,
                reason: null,
                progress: null,
              },
              { allowSort: false }
            );
          });
          strip.innerHTML += cards.join("");
        }
      }
    } catch (error) {
      console.error("Failed to load more genre content:", error);
      pagination.loading = false;
    }
  }

  function applyGenreFilter(items) {
    let filtered = items;
    
    // Filter by category
    if (state.filter !== "all") {
      filtered = filtered.filter((item) => item.category === state.filter);
    }
    
    // Filter by watched status
    if (state.watchedFilter !== "all") {
      filtered = filtered.filter((item) => {
        const hasProgress = state.progressMap.has(item.id);
        const isWatched = hasProgress && state.progressMap.get(item.id)?.watchPercentage > 0;
        
        if (state.watchedFilter === "watched") {
          return isWatched;
        }
        if (state.watchedFilter === "not-watched") {
          return !isWatched;
        }
        return true;
      });
    }
    
    return filtered;
  }

  function normalizeAsset(value) {
    if (!value || typeof value !== "string") return "";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return value;
    return `/${value.replace(/^\.?\//, "")}`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(String(hrs).padStart(2, "0"));
    parts.push(String(mins).padStart(2, "0"));
    parts.push(String(secs).padStart(2, "0"));
    return parts.join(":");
  }

  function escapeHtml(value) {
    if (typeof value !== "string") return "";
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function openContentModal(content) {
    if (!content || !elements.episodesModal) return;

    // Get the full content data from state (includes actors)
    let fullContent = state.contentById.get(content.id) || content;

    // Always try to fetch fresh content from API to ensure we have actors
    try {
      const response = await fetch(`/api/content/${content.id}`);
      if (response.ok) {
        const apiContent = await response.json();
        if (apiContent) {
          // Merge API data with existing data
          fullContent = { ...fullContent, ...apiContent };
          // Update state
          state.contentById.set(content.id, fullContent);
        }
      }
    } catch (error) {
      console.warn("Could not fetch content details from API, using cached data:", error);
    }

    // Debug: log actors
    console.log("Content actors:", fullContent.actors, "for content:", fullContent.title);
    console.log("Full content object:", fullContent);

    // Set modal title and info
    elements.episodesModalTitle.textContent = fullContent.title || "";
    const metaParts = [];
    if (fullContent.year) metaParts.push(fullContent.year);
    if (fullContent.type) metaParts.push(fullContent.type === "series" ? "Series" : "Movie");
    if (fullContent.category) metaParts.push(fullContent.category);
    elements.episodesModalInfo.textContent = metaParts.join(" · ") || "";

    // Show modal
    elements.episodesModal.style.display = "flex";

    // Render content info and actors first
    renderContentInfo(fullContent);

    // If it's a series, load and render episodes
    if (fullContent.type === "series") {
      // Show loading indicator for episodes
      const loadingHtml = '<div class="episodes-loading">Loading episodes...</div>';
      elements.episodesModalBody.insertAdjacentHTML("beforeend", loadingHtml);

      try {
        const response = await fetch(`/api/content/${fullContent.id}/episodes`);
        if (!response.ok) {
          if (response.status === 404) {
            const loadingEl = elements.episodesModalBody.querySelector(".episodes-loading");
            if (loadingEl) loadingEl.textContent = "No episodes found for this series.";
            return;
          }
          throw new Error(`Failed to load episodes: ${response.status}`);
        }

        const episodes = await response.json();
        const loadingEl = elements.episodesModalBody.querySelector(".episodes-loading");
        if (loadingEl) loadingEl.remove();

        if (!episodes || episodes.length === 0) {
          elements.episodesModalBody.insertAdjacentHTML("beforeend", '<div class="episodes-loading">No episodes available.</div>');
          return;
        }

        // Render episodes grouped by season
        renderEpisodes(episodes, fullContent);
      } catch (error) {
        console.error("Error loading episodes:", error);
        const loadingEl = elements.episodesModalBody.querySelector(".episodes-loading");
        if (loadingEl) {
          loadingEl.textContent = "Error loading episodes. Please try again.";
        } else {
          elements.episodesModalBody.insertAdjacentHTML("beforeend", '<div class="episodes-loading">Error loading episodes. Please try again.</div>');
        }
      }
    } else {
      // For movies, show play button
      renderMovieActions(fullContent);
    }
  }

  function renderContentInfo(content) {
    if (!content || !elements.episodesModalBody) return;

    // Debug: log to see what we have
    console.log("Rendering content info for:", content.title);
    console.log("Actors data:", content.actors);
    console.log("Actors type:", typeof content.actors);
    console.log("Actors length:", content.actors?.length);

    const actors = Array.isArray(content.actors) ? content.actors : [];
    const hasActors = actors.length > 0;

    const infoHtml = `
      <div class="content-info-section">
        <div class="content-details">
          <div class="content-detail-item">
            <span class="content-detail-label">Type:</span>
            <span class="content-detail-value">${content.type === "series" ? "Series" : "Movie"}</span>
          </div>
          <div class="content-detail-item">
            <span class="content-detail-label">Title:</span>
            <span class="content-detail-value">${escapeHtml(content.title || "")}</span>
          </div>
          <div class="content-detail-item">
            <span class="content-detail-label">Year:</span>
            <span class="content-detail-value">${content.year || ""}</span>
          </div>
          <div class="content-detail-item">
            <span class="content-detail-label">Category:</span>
            <span class="content-detail-value">${escapeHtml(content.category || "")}</span>
          </div>
          <div class="content-detail-item">
            <span class="content-detail-label">Rating:</span>
            <span class="content-detail-value">${escapeHtml(content.rating || 'N/A')}</span>
          </div>
          <div class="content-detail-item">
            <span class="content-detail-label">Info:</span>
            <span class="content-detail-value">${escapeHtml(content.info || "")}</span>
          </div>
        </div>
        ${hasActors ? `
          <div class="content-actors-section">
            <h3 class="actors-title">Cast</h3>
            <div class="actors-list">
              ${actors.map(actor => {
                const name = actor?.name || "";
                const url = actor?.wikipediaUrl || "#";
                return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="actor-link">${escapeHtml(name)}</a>`;
              }).join("")}
            </div>
          </div>
        ` : `<div class="content-actors-section"><p style="color: #b3b3b3; font-size: 0.9rem;">No cast information available.</p></div>`}
      </div>
    `;

    elements.episodesModalBody.innerHTML = infoHtml;
  }

  function renderMovieActions(content) {
    if (!content || !elements.episodesModalBody) return;

    const progress = state.progressMap.get(content.id);
    const actionsHtml = `
      <div class="movie-actions">
        <button class="movie-play-btn episode-play-btn" data-content-id="${content.id}">
          <i class="bi bi-play-fill me-2"></i>${progress ? "Resume" : "Play"}
        </button>
        ${progress && progress.watchPercentage > 0 ? `
          <button class="movie-watch-from-beginning-btn watch-from-beginning-btn" data-content-id="${content.id}">
            <i class="bi bi-arrow-clockwise me-1"></i>Watch from Beginning
          </button>
        ` : ""}
      </div>
    `;

    elements.episodesModalBody.insertAdjacentHTML("beforeend", actionsHtml);

    // Add event handlers
    const playBtn = elements.episodesModalBody.querySelector(".movie-play-btn");
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        closeEpisodesModal();
        handlePlay(content.id);
      });
    }

    const watchFromBeginningBtn = elements.episodesModalBody.querySelector(".movie-watch-from-beginning-btn");
    if (watchFromBeginningBtn) {
      watchFromBeginningBtn.addEventListener("click", () => {
        closeEpisodesModal();
        handlePlayFromBeginning(content.id);
      });
    }
  }

  function closeEpisodesModal() {
    if (elements.episodesModal) {
      elements.episodesModal.style.display = "none";
      elements.episodesModalBody.innerHTML = '<div class="episodes-loading">Loading episodes...</div>';
    }
  }

  function renderEpisodes(episodes, content) {
    if (!episodes || episodes.length === 0 || !elements.episodesModalBody) return;

    // Group episodes by season
    const seasons = {};
    episodes.forEach((episode) => {
      const season = episode.season || 1;
      if (!seasons[season]) {
        seasons[season] = [];
      }
      seasons[season].push(episode);
    });

    // Sort seasons
    const sortedSeasons = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));

    let html = `<div class="episodes-section">`;
    sortedSeasons.forEach((seasonNum) => {
      html += `<div class="episodes-seasons">`;
      html += `<h3 class="season-header">Season ${seasonNum}</h3>`;
      html += `<div class="episodes-list">`;

      seasons[seasonNum].forEach((episode) => {
        const episodeId = episode._id?.toString() || episode.id;
        const episodeNumber = episode.episode || 0;
        const episodeTitle = episode.title || `Episode ${episodeNumber}`;
        const episodeDescription = episode.description || "";
        const duration = formatTime(episode.durationSec || 0);
        const airDate = episode.airDate
          ? new Date(episode.airDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "";

        html += `
          <div class="episode-item" data-episode-id="${episodeId}" data-content-id="${content.id}">
            <div class="episode-number">${episodeNumber}</div>
            <div class="episode-info">
              <div class="episode-title">${escapeHtml(episodeTitle)}</div>
              <div class="episode-meta">
                ${duration ? `<span>${duration}</span>` : ""}
                ${airDate ? `<span>${airDate}</span>` : ""}
              </div>
              ${episodeDescription ? `<div class="episode-description">${escapeHtml(episodeDescription)}</div>` : ""}
            </div>
            <button class="episode-play-btn" data-episode-id="${episodeId}" data-content-id="${content.id}">
              <i class="bi bi-play-fill me-1"></i>Play
            </button>
          </div>
        `;
      });

      html += `</div></div>`;
    });
    html += `</div>`;

    elements.episodesModalBody.insertAdjacentHTML("beforeend", html);

    // Add click handlers for episodes
    elements.episodesModalBody.querySelectorAll(".episode-play-btn, .episode-item").forEach((element) => {
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        const episodeId = element.dataset.episodeId || element.closest(".episode-item")?.dataset.episodeId;
        const contentId = element.dataset.contentId || element.closest(".episode-item")?.dataset.contentId;
        if (episodeId && contentId) {
          handleEpisodePlay(contentId, episodeId);
        }
      });
    });
  }

  async function handleEpisodePlay(contentId, episodeId) {
    try {
      // Get episode details to get duration
      const episodesResponse = await fetch(`/api/content/${contentId}/episodes`);
      if (!episodesResponse.ok) {
        throw new Error("Failed to get episode details");
      }

      const episodes = await episodesResponse.json();
      const episode = episodes.find((e) => (e._id?.toString() || e.id) === episodeId);

      if (!episode) {
        throw new Error("Episode not found");
      }

      // Create progress entry for this episode
      const payload = {
        contentId,
        episodeId,
        lastPositionSec: 0,
        durationSec: episode.durationSec || 0,
        watchPercentage: 0,
        status: "in_progress",
        event: "start",
      };

      const progressResponse = await fetch(`/api/profiles/${state.profileId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!progressResponse.ok) {
        throw new Error(`Progress update failed: ${progressResponse.status}`);
      }

      const result = await progressResponse.json();
      const updated = result.progress;

      // Update state
      if (updated?.content) {
        state.progressMap.set(updated.content.id, updated);
        const list = state.sections.continueWatching || [];
        const idx = list.findIndex((entry) => entry.content?.id === updated.content.id);
        if (idx >= 0) {
          list[idx] = updated;
        } else {
          list.unshift(updated);
        }
        state.sections.continueWatching = list;
        buildIndices();
        renderSections();
      }

      // Close modal and show alert
      closeEpisodesModal();
      alert(`Starting ${episode.title || "episode"}...`);
    } catch (error) {
      console.error("Failed to play episode:", error);
      alert("Unable to start playback. Please try again.");
    }
  }
});

