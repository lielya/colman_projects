// Amit-Mosseri-206446791-Liel-Yaakobov-322366311-Lihi-Skif-322235888

document.addEventListener("DOMContentLoaded", () => {
  // Dummy profiles, same order as in profiles.html
  const profiles = [
    {
      id: 1,
      name: "Liel",
      avatar:
        "https://i.pinimg.com/564x/b2/a0/29/b2a029a6c2757e9d3a09265e3d07d49d.jpg",
    },
    {
      id: 2,
      name: "Lihi",
      avatar:
        "https://i.pinimg.com/564x/a4/c6/5f/a4c65f709d4c0cb1b4329c12beb9cd78.jpg",
    },
    {
      id: 3,
      name: "Amit",
      avatar:
        "https://i.pinimg.com/236x/86/2a/53/862a537a244d4f18264398ebd1a8873a.jpg",
    },
  ];

  const list = document.querySelector(".profiles-list");
  const form = list?.closest("form");
  if (!list) return;

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
      const cards = Array.from(list.querySelectorAll(".profile"));
      const index = cards.indexOf(card);
      if (index < 0 || index >= profiles.length) return;

      // Read the current typed name from the input, default to preset
      const input = card.querySelector(".profile-name-input");
      const typedName = (input?.value || "").trim();
      const selected = { ...profiles[index] };
      if (typedName) selected.name = typedName;

      // Persist for main.html
      localStorage.setItem("selectedProfileId", String(selected.id));
      localStorage.setItem("selectedProfileName", selected.name);
      localStorage.setItem("selectedProfileAvatar", selected.avatar);

      // Navigate to main.html
      window.location.href = "main.html";
    }
  });

  // Optional quality of life: save edits on blur so name persists for next time
  list.addEventListener("blur", (e) => {
    if (!e.target.matches(".profile-name-input")) return;
    const card = e.target.closest(".profile");
    const cards = Array.from(list.querySelectorAll(".profile"));
    const index = cards.indexOf(card);
    if (index < 0 || index >= profiles.length) return;

    const newName = e.target.value.trim();
    if (!newName) return;

    // Store a small map of custom names by id
    const customNames =
      JSON.parse(localStorage.getItem("customProfileNames") || "{}") || {};
    customNames[profiles[index].id] = newName;
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
