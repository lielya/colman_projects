// // Amit-Mosseri-206446791-Liel-Yaakobov-322366311-Lihi-Skif-322235888

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "/login";
    return;
  }

  // Load profiles from server
  let profiles = [];
  try {
    const response = await fetch(`/api/users/${userId}/profiles`);
    if (response.ok) {
      const data = await response.json();
      profiles = Array.isArray(data) ? data : (data.data || []);
    } else {
      console.error("Failed to load profiles:", response.status);
    }
  } catch (err) {
    console.error("Error loading profiles:", err);
  }

  // Render profiles dynamically
  const list = document.querySelector(".profiles-list");
  const form = list?.closest("form");
  if (!list) return;

  // Clear existing hardcoded profiles
  list.innerHTML = "";

  // Render profiles from server
  if (profiles.length === 0) {
    list.innerHTML = "<p style='color: #808080;'>No profiles found. Please create a profile.</p>";
  } else {
    profiles.forEach((profile, index) => {
      const profileDiv = document.createElement("div");
      profileDiv.className = "profile";
      profileDiv.innerHTML = `
        <img src="${profile.avatar || 'https://i.pinimg.com/236x/86/2a/53/862a537a244d4f18264398ebd1a8873a.jpg'}" 
             alt="${profile.name}" 
             class="profile-avatar">
        <label class="visually-hidden" for="name-${profile.id}">Profile name</label>
        <input id="name-${profile.id}" 
               class="profile-name-input" 
               type="text" 
               value="${profile.name}" 
               maxlength="20" />
      `;
      list.appendChild(profileDiv);
    });
  }

  // Do not let Enter submit the form
  if (form) {
    form.addEventListener("submit", (e) => e.preventDefault());
  }

  // Allow typing in the name inputs without redirect
  list.addEventListener("click", (e) => {
    // If the click is on the input, do nothing
    if (e.target.matches(".profile-name-input")) {
      e.stopPropagation();
      return;
    }

    // Redirect only when clicking the avatar image
    if (e.target.matches(".profile-avatar")) {
      const card = e.target.closest(".profile");
      if (!card) return;
      
      // Get profile ID from the input ID
      const input = card.querySelector(".profile-name-input");
      if (!input) return;
      
      const profileId = input.id.replace("name-", "");
      const profile = profiles.find(p => String(p.id) === profileId);
      
      if (!profile) {
        console.error("Profile not found for ID:", profileId);
        return;
      }

      // Read the current typed name from the input, default to preset
      const typedName = (input.value || "").trim();
      const selected = { ...profile };
      if (typedName) selected.name = typedName;

      // Persist for main.html
      localStorage.setItem("selectedProfileId", String(selected.id));
      localStorage.setItem("selectedProfileName", selected.name);
      localStorage.setItem("selectedProfileAvatar", selected.avatar || "");

      // Navigate to main page
      window.location.href = "/";
    }
  });

  // Optional quality of life: save edits on blur so name persists for next time
  list.addEventListener("blur", (e) => {
    if (!e.target.matches(".profile-name-input")) return;
    
    const profileId = e.target.id.replace("name-", "");
    const profile = profiles.find(p => String(p.id) === profileId);
    
    if (!profile) return;

    const newName = e.target.value.trim();
    if (!newName) return;

    // Store a small map of custom names by id
    const customNames =
      JSON.parse(localStorage.getItem("customProfileNames") || "{}") || {};
    customNames[profile.id] = newName;
    localStorage.setItem("customProfileNames", JSON.stringify(customNames));
  }, true);

  // Optional load of previously saved custom names
  try {
    const customNames =
      JSON.parse(localStorage.getItem("customProfileNames") || "{}") || {};
    const inputs = list.querySelectorAll(".profile-name-input");
    inputs.forEach((inp, i) => {
      const id = profiles[i]?.id;
      if (id && customNames[id]) inp.value = customNames[id];
    });
  } catch {}
});

