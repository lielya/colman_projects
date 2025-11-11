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
    genrePagination: {}, 
  };

  let searchTimer = null;

  let allEpisodes = [];
  let currentEpisodeId = null;
  let playerEventsBound = false; 
  let progressUpdateTimer = null; 

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

      if (name.toLowerCase() === "admin") {
        const adminElements = document.querySelectorAll('.admin-only');
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
      merged.rating = merged.rating || existing.rating || 'N/A'; 

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
    elements.heroPlay.textContent = stored.type === "series" ? "View Episodes" : (progress ? "Resume" : "Play");
    elements.heroPlay.onclick = () => openContentModal(stored);

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
      openContentModal(stored);
    };
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

        if (state.filter !== "all" && merged.category !== state.filter) {
          return null;
        }

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
          progress: options.showProgress ? state.progressMap.get(merged.id) : null, 
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
            const ratingA = parseFloat(contentA.rating) || 0;
            const ratingB = parseFloat(contentB.rating) || 0;
            return ratingB - ratingA; 
          
          case "popularity":
            const likesA = contentA.likes || 0;
            const likesB = contentB.likes || 0;
            return likesB - likesA; 
          
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
    
    if (cards.length > 0) {
      strip.innerHTML = cards.map((card) => cardHTML(card, options)).join("");
      strip.dataset.originalLength = cards.length;
      
      // --- THIS IS THE FIX ---
      // We are turning OFF circular scrolling.
      strip.dataset.isCircular = "false"; 
    } else {
      strip.innerHTML = cards.map((card) => cardHTML(card, options)).join("");
    }

    viewport.appendChild(strip);
    sectionEl.appendChild(prevBtn);
    sectionEl.appendChild(viewport);
    sectionEl.appendChild(nextBtn);

    elements.sections.appendChild(sectionEl);

    // This logic is no longer needed because we are not doing a cyclic scroll
    // if (cards.length > 0 && strip.dataset.isCircular === "true") {
    //   ...
    // }

    bindArrows(viewportId);
    
    if (options.infiniteScroll && options.genre) {
      setupInfiniteScroll(viewportId, options.genre);
      if (!state.genrePagination[options.genre]) {
        const initialItemCount = cards.length;
        state.genrePagination[options.genre] = {
          page: 1,
          hasMore: true, 
          loading: false,
          initialCount: initialItemCount,
        };
        checkIfMoreContentAvailable(options.genre, initialItemCount);
      }
    }
  }

  function mergeContent(content) {
    if (!content || !content.id) return content;
    const stored = state.contentById.get(content.id);
    if (stored) return stored;
    
    const existing = {};
    const merged = { ...existing, ...content };
    merged.poster = normalizeAsset(merged.poster || existing.poster || "");
    merged.backdrop = normalizeAsset(merged.backdrop || existing.backdrop || "");
    merged.rating = merged.rating || existing.rating || 'N/A';
    state.contentById.set(content.id, merged);
    return merged;
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
    const rating = content.rating || 'N/A'; 

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
          
          <span class="ms-auto"><i class="bi bi-star-fill text-white"></i> ${rating}</span>

        </div>
        <p class="flyout-text">${escapeHtml(content.info || "")}</p>
    </div>
  `;

  return `
      <article class="media-card" data-id="${content.id}">
        ${flyout}
        <img class="media-thumb" src="${poster}" alt="${escapeHtml(
      content.title
    )}" onerror="this.src='images/fallback.jpg'">
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
              <span>${rating}</span>
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
    
    // תיקון: ודא ש-resumePositionSec קיים
    const resumeLabel = formatTime(progress.resumePositionSec || progress.lastPositionSec || 0);

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

    if (elements.episodesModalClose) {
      elements.episodesModalClose.addEventListener("click", closeEpisodesModal);
    }
    if (elements.episodesModalOverlay) {
      elements.episodesModalOverlay.addEventListener("click", closeEpisodesModal);
    }
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
    const startTime = progress ? progress.resumePositionSec : 0;
    
    if (content.type === 'movie') {
      startPlayback(content, null, startTime); 
    } else {
      const episodeId = progress ? progress.episode?.id : null;
      startPlayback(content, episodeId, startTime); 
    }
  }

  async function handlePlayFromBeginning(contentId) {
    const content = state.contentById.get(contentId);
    if (!content) return;

    try {
      let episodeId = null;
      
      if (content.type === "series") {
        const response = await fetch(
          `/api/content/${contentId}/first-episode`
        );
        if (response.ok) {
          const firstEpisode = await response.json();
          episodeId = firstEpisode.id;
        } else {
           throw new Error('Could not find first episode');
        }
      }
      
      closeEpisodesModal();
      startPlayback(content, episodeId, 0); 

    } catch (error) {
      console.error("Failed to start from beginning:", error);
      alert("Unable to start playback from the beginning. Please try again.");
    }
  }

  // --- THIS IS THE FIX ---
  // A simple, non-cyclic bindArrows function.
  function bindArrows(viewportId) {
    const viewport = document.getElementById(viewportId);
    if (!viewport || viewport.dataset.bound === "1") return;

    const section = viewport.parentElement;
    const prev = section.querySelector(".arrow-btn.prev");
    const next = section.querySelector(".arrow-btn.next");
    const strip = viewport.querySelector(".carousel-strip");

    // Function to calculate the scroll amount (one "page")
    const page = () => {
      const firstCard = strip?.querySelector('.media-card');
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth + 12; // 12 is the gap
        // Scroll by 7 cards (like in your CSS)
        return cardWidth * 7; 
      }
      // Fallback to viewport width
      return viewport.clientWidth;
    };

    // Function to update the disabled state of the buttons
    const updateDisabled = () => {
      // Use a small tolerance (e.g., 5px) for calculations
      const tolerance = 5;
      const scrollLeft = viewport.scrollLeft;
      const scrollWidth = viewport.scrollWidth;
      const clientWidth = viewport.clientWidth;
      const maxScroll = scrollWidth - clientWidth;

      if (prev) {
        prev.disabled = scrollLeft <= tolerance;
      }
      if (next) {
        next.disabled = scrollLeft >= maxScroll - tolerance;
      }
    };

    if (prev) {
      prev.addEventListener("click", () => {
        const scrollAmount = -page();
        // scrollBy will use the 'scroll-behavior: smooth' from the CSS
        viewport.scrollBy({ left: scrollAmount }); 
        
        // We use setTimeout to wait for the smooth scroll animation
        // to finish before updating the button states.
        setTimeout(updateDisabled, 500); // 500ms should be enough
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        const scrollAmount = page();
        viewport.scrollBy({ left: scrollAmount });
        setTimeout(updateDisabled, 500);
      });
    }

    // Update buttons on initial load
    // Use setTimeout to run this *after* the browser has rendered
    setTimeout(updateDisabled, 100);

    // Update buttons on manual scroll
    viewport.addEventListener("scroll", () => {
      // Use a timeout to avoid running this function too many times
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateDisabled, 150);
    }, { passive: true });
    
    // Update buttons if the window is resized
    if (window.ResizeObserver) {
      new ResizeObserver(updateDisabled).observe(viewport);
    }

    viewport.dataset.bound = "1";
  }
  // --- END OF FIX ---


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
        
        // Check if we are near the end of the scroll
        const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;

        const pagination = state.genrePagination[genre];
        if (pagination && pagination.hasMore && !pagination.loading) {
          
          // Since it's not circular, we just check if we are near the end
          if (scrollPercentage > 0.7) { 
            isLoading = true;
            loadMoreGenreContent(genre, viewportId).finally(() => {
              isLoading = false;
            });
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

      newItems.forEach((item) => {
        mergeContent(item);
        const genreKey = item.category || genre;
        if (!state.sections.newestByGenre[genreKey]) {
          state.sections.newestByGenre[genreKey] = [];
        }
        const exists = state.sections.newestByGenre[genreKey].some(
          (existing) => existing.id === item.id || (existing.content && existing.content.id === item.id)
        );
        if (!exists) {
          state.sections.newestByGenre[genreKey].push(item);
        }
      });

      pagination.page = nextPage;
      pagination.hasMore = data.hasMore || false;
      pagination.loading = false;

      const viewport = document.getElementById(viewportId);
      if (viewport) {
        const strip = viewport.querySelector(".carousel-strip");
        
        // Since it's not circular, we just append the new cards
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
        
        // Update the button state after adding new content
        bindArrows(viewportId); 
      }
    } catch (error) {
      console.error("Failed to load more genre content:", error);
      pagination.loading = false;
    }
  }

  function applyGenreFilter(items) {
    let filtered = items;
    
    if (state.filter !== "all") {
      filtered = filtered.filter((item) => item.category === state.filter);
    }
    
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

    let fullContent = state.contentById.get(content.id) || content;

    try {
      const response = await fetch(`/api/content/${content.id}`);
      if (response.ok) {
        const apiContent = await response.json();
        if (apiContent) {
          fullContent = { ...fullContent, ...apiContent };
          state.contentById.set(content.id, fullContent);
        }
      }
    } catch (error) {
      console.warn("Could not fetch content details from API, using cached data:", error);
    }
    
    fullContent.rating = fullContent.rating || 'N/A';
    state.contentById.set(content.id, fullContent);
    
    elements.episodesModalTitle.textContent = fullContent.title || "";
    const metaParts = [];
    if (fullContent.year) metaParts.push(fullContent.year);
    if (fullContent.type) metaParts.push(fullContent.type === "series" ? "Series" : "Movie");
    if (fullContent.category) metaParts.push(fullContent.category);
    elements.episodesModalInfo.textContent = metaParts.join(" · ") || "";

    // --- 👇 התיקון מתחיל כאן 👇 ---
    const modalHeader = elements.episodesModal.querySelector(".episodes-modal-header");

    // 1. נקה כפתור עריכה ישן (אם קיים)
    const oldEditBtn = modalHeader.querySelector('.admin-edit-button');
    if (oldEditBtn) {
      oldEditBtn.remove();
    }

    // 2. בדוק אם המשתמש הוא אדמין
    if (state.profile.name.toLowerCase() === 'admin') {
      // 3. צור את כפתור העריכה עם הקישור הנכון (בלי .html)
      const editButtonHtml = `
        <div class="admin-edit-button">
            <a href="/admin/add-content?edit=${fullContent.id}" class="btn btn-outline-light">
                <i class="bi bi-pencil-square"></i> Edit
            </a>
        </div>
      `;
      // 4. הזרק את הכפתור לתוך ה-header
      modalHeader.insertAdjacentHTML('beforeend', editButtonHtml);
    }
    // --- 👆 סוף התיקון 👆 ---

    elements.episodesModal.style.display = "flex";

    renderContentInfo(fullContent);

    if (fullContent.type === "series") {
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
      renderMovieActions(fullContent);
    }
  }

  function renderContentInfo(content) {
    if (!content || !elements.episodesModalBody) return;

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

    const playBtn = elements.episodesModalBody.querySelector(".movie-play-btn");
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        closeEpisodesModal();
        const startTime = progress ? progress.resumePositionSec : 0;
        startPlayback(content, null, startTime);
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

    const seasons = {};
    episodes.forEach((episode) => {
      const season = episode.season || 1;
      if (!seasons[season]) {
        seasons[season] = [];
      }
      seasons[season].push(episode);
    });

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
    const content = state.contentById.get(contentId);
    if (!content) {
        alert("Error: Content not found.");
        return;
    }
    
    closeEpisodesModal(); 
    startPlayback(content, episodeId, 0); 
  }
  
  
  // --- 👇 כל פונקציות הנגן החדשות מתחילות כאן 👇 ---
  
  async function startPlayback(content, episodeId = null, startTime = null) {
    if (!content) return;

    const playerModal = document.getElementById("playerModal");
    const playerWrapper = document.querySelector(".player-wrapper");
    const videoPlayer = document.getElementById("playerVideo");
    const playerTitle = document.getElementById("playerTitle");
    const playerSubtitle = document.getElementById("playerSubtitle");
    
    if (!playerModal || !videoPlayer) {
        console.error("CRITICAL ERROR: Player elements (playerModal, videoPlayer) not found in main.html!");
        return;
    }
    
    let videoUrl = null;
    let episodeTitle = null;
    
    allEpisodes = [];
    currentEpisodeId = null;
    playerWrapper.dataset.type = content.type; 
    playerWrapper.dataset.contentId = content.id; 

    if (content.type === 'series') {
        if (!episodeId) {
            const progress = state.progressMap.get(content.id);
            episodeId = progress ? progress.episode?.id : null;
            
            if (!episodeId) {
                try {
                    const response = await fetch(`/api/content/${content.id}/first-episode`);
                    if (response.ok) {
                        const firstEpisode = await response.json();
                        episodeId = firstEpisode.id;
                        videoUrl = firstEpisode.videoUrl;
                        episodeTitle = firstEpisode.title;
                    } else {
                        throw new Error('No first episode found');
                    }
                } catch (err) {
                    alert('Could not load first episode.');
                    return;
                }
            }
        }
        
        if (!videoUrl) {
            const episodes = await fetchEpisodes(content.id); 
            const episode = episodes.find(e => (e._id || e.id) === episodeId);
            if (episode) {
                videoUrl = episode.videoUrl;
                episodeTitle = episode.title;
            } else {
                alert('Episode not found.');
                return;
            }
        }
        
        await populateEpisodeDrawer(content.id, episodeId);
        currentEpisodeId = episodeId;
        
    } else {
        videoUrl = content.videoUrl; 
        document.getElementById("episodeDrawer").classList.remove('visible'); 
    }

    if (!videoUrl) {
        videoUrl = content.videoUrl || null;
        if (!videoUrl) {
            alert('Video file not found for this content.');
            return;
        }
    }
    
    videoPlayer.src = videoUrl;
    playerTitle.textContent = content.title || '';
    playerSubtitle.textContent = episodeTitle || ''; 
    
    playerModal.classList.add('show'); 
    
    if (startTime && startTime > 0) {
        videoPlayer.currentTime = startTime;
    }

    try {
        await videoPlayer.play();
    } catch (playError) {
        console.error("Play failed (usually requires user interaction):", playError);
    }

    if (!playerEventsBound) {
        bindPlayerEvents();
        playerEventsBound = true;
    }
  }

  /**
   * מחבר את כל האירועים לכפתורי הנגן
   */
  function bindPlayerEvents() {
    console.log("DEBUG: Binding player events NOW."); 
    
    const videoPlayer = document.getElementById("playerVideo");
    const playerClose = document.getElementById("playerClose");
    const playerOverlay = document.getElementById("playerOverlay");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const rewindBtn = document.getElementById("rewindBtn");
    const forwardBtn = document.getElementById("forwardBtn");
    const timeline = document.getElementById("timeline");
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const playerWrapper = document.querySelector(".player-wrapper");
    const nextEpisodeBtn = document.getElementById("nextEpisodeBtn");
    const episodeListBtn = document.getElementById("episodeListBtn");
    const episodeDrawer = document.getElementById("episodeDrawer");
    const episodeListContainer = document.getElementById("episodeListContainer");

    // סגירת הנגן
    if (playerClose) playerClose.addEventListener('click', stopPlayback);
    if (playerOverlay) playerOverlay.addEventListener('click', stopPlayback);

    // כפתור Play/Pause
    if (playPauseBtn && videoPlayer) {
        playPauseBtn.addEventListener('click', () => {
            if (videoPlayer.paused) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
        });
        videoPlayer.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        });
        videoPlayer.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        });
    }

    // חזרה/קדימה 10 שניות
    if (rewindBtn) {
      rewindBtn.addEventListener('click', () => {
        if (videoPlayer) videoPlayer.currentTime -= 10;
      });
    }
    if (forwardBtn) {
      forwardBtn.addEventListener('click', () => {
        if (videoPlayer) videoPlayer.currentTime += 10;
      });
    }

    // טיימליין
    if (videoPlayer && timeline) {
      videoPlayer.addEventListener('timeupdate', () => {
        const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        timeline.value = progress || 0;
      });
      timeline.addEventListener('input', () => {
        const newTime = (timeline.value * videoPlayer.duration) / 100;
        videoPlayer.currentTime = newTime;
      });
      videoPlayer.addEventListener('loadedmetadata', () => {
        timeline.max = 100; 
      });
    }

    // מסך מלא (עם תיקון ליציאה)
    if (fullscreenBtn && playerWrapper) {
        fullscreenBtn.addEventListener('click', () => {
            if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) { 
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { 
                    document.msExitFullscreen();
                }
            } else {
                const el = playerWrapper;
                if (el.requestFullscreen) el.requestFullscreen();
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                else if (el.msRequestFullscreen) el.msRequestFullscreen();
            }
        });
    }

    // פרק הבא
    if (nextEpisodeBtn) {
        nextEpisodeBtn.addEventListener('click', playNextEpisode);
    }
    if (videoPlayer) {
        videoPlayer.addEventListener('ended', () => {
            if (playerWrapper.dataset.type === 'series') {
                playNextEpisode();
            } else {
                stopPlayback(); 
            }
        });
    }

    // מגירת פרקים
    if (episodeListBtn) {
        episodeListBtn.addEventListener('click', () => {
            episodeDrawer.classList.toggle('visible');
        });
    }
    if (episodeListContainer) {
        episodeListContainer.addEventListener('click', handleDrawerEpisodeClick);
    }
    
    // --- 👇 תיקון 1: שמירת התקדמות 👇 ---
    if (videoPlayer) {
      videoPlayer.addEventListener('timeupdate', () => {
        clearTimeout(progressUpdateTimer); 
        progressUpdateTimer = setTimeout(() => {
          if (!videoPlayer.paused && videoPlayer.duration > 0) {
            const contentId = playerWrapper.dataset.contentId;
            const lastPositionSec = videoPlayer.currentTime;
            const durationSec = videoPlayer.duration;
            
            if (contentId) {
              sendProgressUpdate(contentId, currentEpisodeId, lastPositionSec, durationSec);
            }
          }
        }, 5000); // שמירת התקדמות כל 5 שניות
      });
    }
  }

  /**
   * סוגר את מודאל הנגן
   */
  function stopPlayback() {
    const videoPlayer = document.getElementById("playerVideo");
    const playerModal = document.getElementById("playerModal");
    const episodeDrawer = document.getElementById("episodeDrawer");
    const playerWrapper = document.querySelector(".player-wrapper"); // ⭐️ הוספנו
    
    clearTimeout(progressUpdateTimer); // הפסק לשלוח עדכוני התקדמות

    // --- 👇 התיקון הקריטי מתחיל כאן 👇 ---
    // בצע שמירה אחרונה, ידנית, של הזמן הנוכחי
    if (videoPlayer && videoPlayer.duration > 0) {
        const contentId = playerWrapper.dataset.contentId;
        const lastPositionSec = videoPlayer.currentTime;
        const durationSec = videoPlayer.duration;
        
        if (contentId && lastPositionSec > 0) {
            // קריאה סינכרונית (לא async) לפונקציה כדי לעדכן את ה-state
            sendProgressUpdate(contentId, currentEpisodeId, lastPositionSec, durationSec);
        }
    }
    // --- 👆 סוף התיקון 👆 ---

    renderSections(); // עכשיו הקריאה הזו תשתמש במידע המעודכן
    
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = ""; 
    }
    if (playerModal) {
        playerModal.classList.remove('show');
    }
    if (episodeDrawer) {
        episodeDrawer.classList.remove('visible'); 
    }
  }

  /**
   * טוען פרקים מה-API
   */
  async function fetchEpisodes(contentId) {
    allEpisodes = []; 
    try {
        const response = await fetch(`/api/content/${contentId}/episodes`);
        if (!response.ok) throw new Error('Failed to fetch episodes');
        allEpisodes = await response.json();
        return allEpisodes;
    } catch (err) {
        console.error(err);
        return [];
    }
  }

  /**
   * ממלא את מגירת הפרקים ב-HTML
   */
  async function populateEpisodeDrawer(contentId, activeEpisodeId) {
    const episodeListContainer = document.getElementById("episodeListContainer");
    const episodeListTitle = document.getElementById("episodeListTitle");
    
    if (!episodeListContainer || !episodeListTitle) return;

    const episodes = await fetchEpisodes(contentId);
    episodeListContainer.innerHTML = ""; 
    
    const content = state.contentById.get(contentId);
    episodeListTitle.textContent = content ? content.title : "Episodes";
    
    if (episodes.length === 0) {
        episodeListContainer.innerHTML = "<li>No episodes found.</li>";
        return;
    }
    
    episodes.forEach(episode => {
        const epId = episode._id?.toString() || episode.id;
        const li = document.createElement('li');
        if (epId === activeEpisodeId) {
            li.className = 'active'; 
        }
        li.innerHTML = `<a href="#" data-episode-id="${epId}" data-content-id="${contentId}">
            S${episode.season || 1} E${episode.episode || '?'}: ${episode.title}
        </a>`;
        episodeListContainer.appendChild(li);
    });
  }

  /**
   * מטפל בלחיצה על פרק במגירה
   */
  function handleDrawerEpisodeClick(event) {
    event.preventDefault();
    const target = event.target.closest('a');
    if (!target) return;

    const episodeId = target.dataset.episodeId;
    const contentId = target.dataset.contentId;
    const content = state.contentById.get(contentId);
    
    if (content && episodeId) {
        startPlayback(content, episodeId, 0); 
    }
  }

  /**
   * מפעיל את הפרק הבא
   */
  function playNextEpisode() {
    if (allEpisodes.length === 0 || !currentEpisodeId) return;

    const currentIndex = allEpisodes.findIndex(e => (e._id || e.id) === currentEpisodeId);
    if (currentIndex > -1 && currentIndex < allEpisodes.length - 1) {
        const nextEpisode = allEpisodes[currentIndex + 1];
        const contentId = nextEpisode.seriesId || (allEpisodes[0] ? allEpisodes[0].seriesId : null); 
        if (!contentId) {
            console.error("Could not find contentId for next episode.");
            stopPlayback();
            return;
        }
        
        const content = state.contentById.get(contentId);
        if (content) {
            startPlayback(content, (nextEpisode._id || nextEpisode.id), 0); 
        } else {
            console.error("Content not found for next episode:", contentId);
            stopPlayback();
        }
    } else {
        console.log("End of series or episode not found.");
        stopPlayback(); 
    }
  }

  async function sendProgressUpdate(contentId, episodeId, lastPositionSec, durationSec) {
    const payload = {
      contentId,
      episodeId: episodeId || null,
      lastPositionSec,
      durationSec,
      status: "in_progress",
      event: "timeupdate" 
    };

    try {
      fetch(`/api/profiles/${state.profileId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const progress = state.progressMap.get(contentId) || { content: state.contentById.get(contentId) };
      progress.lastPositionSec = lastPositionSec;
      progress.durationSec = durationSec;
      progress.watchPercentage = (lastPositionSec / durationSec) * 100;
      progress.resumePositionSec = Math.max(0, lastPositionSec); 
      progress.status = "in_progress";
      if (episodeId) {
          const episode = allEpisodes.find(e => (e._id || e.id) === episodeId);
          progress.episode = { 
              id: episodeId,
              title: episode ? episode.title : "Episode",
              season: episode ? episode.season : 1,
              number: episode ? episode.episode : 1
          };
      }
      state.progressMap.set(contentId, progress);
      
    } catch (err) {
      console.error("Failed to send progress update:", err);
    }
  }
});