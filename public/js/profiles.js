// Amit-Mosseri-206446791-Liel-Yaakobov-322366311-Lihi-Skif-322235888

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "/login";
    return;
  }

  let profiles = [];
  let isManageMode = false;
  let editingProfileId = null;
  let dailyViewsChart = null;
  let genrePopularityChart = null;

  // DOM elements
  const list = document.querySelector(".profiles-list");
  const manageBtn = document.getElementById("manageBtn");
  const addProfileBtn = document.getElementById("addProfileBtn");
  const profileModal = new bootstrap.Modal(document.getElementById("profileModal"));
  const profileModalTitle = document.getElementById("profileModalTitle");
  const profileForm = document.getElementById("profileForm");
  const profileNameInput = document.getElementById("profileName");
  
  // We select the avatar radio buttons when we need them, so no global var
  
  const saveProfileBtn = document.getElementById("saveProfileBtn");

  // Load profiles from server
  async function loadProfiles() {
    try {
      const response = await fetch(`/api/users/${userId}/profiles`);
      if (response.ok) {
        const data = await response.json();
        profiles = Array.isArray(data) ? data : (data.data || []);
        renderProfiles();
        updateAddButtonState();
      } else {
        console.error("Failed to load profiles:", response.status);
      }
    } catch (err) {
      console.error("Error loading profiles:", err);
    }
  }

  // Render profiles
  function renderProfiles() {
    if (!list) return;
    list.innerHTML = "";

    if (profiles.length === 0) {
      list.innerHTML = "<p style='color: #808080;'>No profiles found. Please create a profile.</p>";
    } else {
      profiles.forEach((profile) => {
        const profileDiv = document.createElement("div");
        profileDiv.className = `profile ${isManageMode ? 'manage-mode' : ''}`;
        profileDiv.dataset.profileId = profile.id;
        
        // Use a default avatar if the profile one is missing
        const avatarSrc = profile.avatar || '/images/avatars/avatar1.png'; // Fallback
        
        profileDiv.innerHTML = `
          <img src="${avatarSrc}" 
               alt="${profile.name}" 
               class="profile-avatar">
          <label class="visually-hidden" for="name-${profile.id}">Profile name</label>
          <input id="name-${profile.id}" 
                 class="profile-name-input" 
                 type="text" 
                 value="${profile.name}" 
                 maxlength="20"
                 ${isManageMode ? 'disabled' : ''} />
          ${isManageMode ? `
            <div class="profile-actions">
              <button class="btn btn-profile-action btn-edit" data-action="edit" data-profile-id="${profile.id}">Edit</button>
              <button class="btn btn-profile-action btn-delete" data-action="delete" data-profile-id="${profile.id}">Delete</button>
            </div>
          ` : ''}
        `;
        list.appendChild(profileDiv);
      });
    }

    // Attach event listeners
    if (!isManageMode) {
      attachProfileClickListeners();
    } else {
      attachManageModeListeners();
    }
  }

  // Attach click listeners for profile selection
  function attachProfileClickListeners() {
    list.addEventListener("click", handleProfileClick);
  }

  // Handle profile click (navigate to main page)
  function handleProfileClick(e) {
    if (e.target.matches(".profile-name-input")) {
      e.stopPropagation();
      return;
    }

    if (e.target.matches(".profile-avatar")) {
      const card = e.target.closest(".profile");
      if (!card) return;
      
      const input = card.querySelector(".profile-name-input");
      if (!input) return;
      
      const profileId = card.dataset.profileId;
      const profile = profiles.find(p => String(p.id) === profileId);
      
      if (!profile) {
        console.error("Profile not found for ID:", profileId);
        return;
      }

      const typedName = (input.value || "").trim();
      const selected = { ...profile };
      if (typedName) selected.name = typedName;

      localStorage.setItem("selectedProfileId", String(selected.id));
      localStorage.setItem("selectedProfileName", selected.name);
      localStorage.setItem("selectedProfileAvatar", selected.avatar || "");

      window.location.href = "/";
    }
  }

  // Attach manage mode listeners
  function attachManageModeListeners() {
    list.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener("click", (e) => {
        const profileId = e.target.dataset.profileId;
        editProfile(profileId);
      });
    });

    list.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener("click", (e) => {
        const profileId = e.target.dataset.profileId;
        deleteProfile(profileId);
      });
    });
  }

  // Toggle manage mode
  manageBtn.addEventListener("click", () => {
    isManageMode = !isManageMode;
    manageBtn.classList.toggle("active", isManageMode);
    manageBtn.textContent = isManageMode ? "DONE" : "MANAGE PROFILES";
    renderProfiles();
  });

  // Add profile button
  addProfileBtn.addEventListener("click", () => {
    editingProfileId = null;
    profileModalTitle.textContent = "Add Profile";
    profileForm.reset(); // This correctly resets the radio buttons to default
    profileNameInput.value = "";
    
    profileModal.show();
  });

  // Save profile
  saveProfileBtn.addEventListener("click", async () => {
    const name = profileNameInput.value.trim();
    if (!name) {
      alert("Profile name is required");
      return;
    }

    // Find the radio button that is 'checked' and get its 'value'.
    const avatar = document.querySelector('input[name="profileAvatar"]:checked').value;

    try {
      if (editingProfileId) {
        // Update existing profile
        const response = await fetch(`/api/profiles/${editingProfileId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, avatar }) // 'avatar' is now a local path
        });

        if (response.ok) {
          await loadProfiles();
          profileModal.hide();
        } else {
          const error = await response.json();
          alert(error.error || "Failed to update profile");
        }
      } else {
        // Create new profile
        const response = await fetch(`/api/users/${userId}/profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, avatar }) // 'avatar' is now a local path
        });

        if (response.ok) {
          await loadProfiles();
          profileModal.hide();
        } else {
          const error = await response.json();
          alert(error.error || "Failed to create profile");
        }
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("An error occurred while saving the profile");
    }
  });

  // Edit profile
  function editProfile(profileId) {
    const profile = profiles.find(p => String(p.id) === profileId);
    if (!profile) return;

    editingProfileId = profileId;
    profileModalTitle.textContent = "Edit Profile";
    profileNameInput.value = profile.name;
    
    // We find the radio button whose 'value' matches the profile's
    // avatar path and 'check' it.
    
    // Default to the first avatar if the profile has an old/empty value
    const avatarValue = profile.avatar || "/images/avatars/avatar1.png";
    const matchingRadio = document.querySelector(`input[name="profileAvatar"][value="${avatarValue}"]`);
    
    if (matchingRadio) {
      matchingRadio.checked = true;
    } else {
      // Fallback: If the saved value is invalid, check the first avatar
      document.querySelector('input[name="profileAvatar"]').checked = true;
    }

    profileModal.show();
  }

  // Delete profile
  async function deleteProfile(profileId) {
    if (!confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        await loadProfiles();
        
        // Safely try to reload charts. If it fails,
        // log the error but don't show the user an alert.
        try {
          await loadCharts(); // Reload charts after deletion
        } catch (chartError) {
          console.error("Chart reload failed after deletion, but profile was deleted.", chartError);
        }

      } else {
        
        // --- THIS IS THE FIX ---
        // The server responded with an error (e.g., 404, 500)
        // We will *safely* try to parse the JSON error.
        let errorMsg = "Failed to delete profile";
        try {
          // Try to parse the error message from the server
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch (e) {
          // The error response wasn't JSON, just use the status
          errorMsg = `Failed to delete profile. Server responded with ${response.status}.`;
          console.warn("Could not parse error JSON from delete response", e);
        }
        alert(errorMsg);
        // --- END OF FIX ---
      }
    } catch (err) {
      console.error("Error deleting profile:", err);
      alert("An error occurred while deleting the profile");
    }
  }

  // Update add button state
  function updateAddButtonState() {
    if (addProfileBtn) {
      addProfileBtn.disabled = profiles.length >= 5;
    }
  }

  // Load and render charts
  async function loadCharts() {
    try {
      // Load daily views chart
      const dailyViewsResponse = await fetch(`/api/users/${userId}/stats/daily-views`);
      if (dailyViewsResponse.ok) {
        const dailyViewsData = await dailyViewsResponse.json();
        renderDailyViewsChart(dailyViewsData);
      }

      // Load genre popularity chart
      const genreResponse = await fetch(`/api/users/${userId}/stats/genre-popularity`);
      if (genreResponse.ok) {
        const genreData = await genreResponse.json();
        renderGenrePopularityChart(genreData);
      }
    } catch (err) {
      console.error("Error loading charts:", err);
    }
  }

  // Render daily views chart (bar chart)
  function renderDailyViewsChart(data) {
    const ctx = document.getElementById("dailyViewsChart");
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (dailyViewsChart) {
      dailyViewsChart.destroy();
    }

    // Format dates for display
    const formattedLabels = data.labels.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    dailyViewsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: formattedLabels,
        datasets: data.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Daily Views by Profile (Last 7 Days)',
            color: '#fff',
            font: {
              size: 18
            }
          },
          legend: {
            labels: {
              color: '#fff'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#fff',
              stepSize: 1
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  }

  // Render genre popularity chart (pie chart)
  function renderGenrePopularityChart(data) {
    const ctx = document.getElementById("genrePopularityChart");
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (genrePopularityChart) {
      genrePopularityChart.destroy();
    }

    genrePopularityChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: data.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Content Popularity by Genre',
            color: '#fff',
            font: {
              size: 18
            }
          },
          legend: {
            position: 'right',
            labels: {
              color: '#fff',
              padding: 15
            }
          }
        }
      }
    });
  }

  // Initialize
  await loadProfiles();
  await loadCharts();
});