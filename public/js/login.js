// Select form and inputs
const form = document.querySelector("form");
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');

// Create error message containers
const emailError = document.createElement("div");
emailError.style.color = "red";
emailError.style.fontSize = "13px";
emailError.style.marginTop = "4px";
emailInput.insertAdjacentElement("afterend", emailError);

const passwordError = document.createElement("div");
passwordError.style.color = "red";
passwordError.style.fontSize = "13px";
passwordError.style.marginTop = "4px";
passwordInput.insertAdjacentElement("afterend", passwordError);

// Validation + server call
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Reset errors
  emailError.textContent = "";
  passwordError.textContent = "";

  // Validate email & password
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let isValid = true;

  if (!emailRegex.test(email)) {
    emailError.textContent = "Please enter a valid email address.";
    isValid = false;
  }

  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    isValid = false;
  }

  if (!isValid) return;

  // 🔥 Send request to backend for real MongoDB login
  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      passwordError.textContent = data.message || "Invalid credentials.";
      return;
    }

    // Success → save state and redirect
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "profiles.html";
  } catch (err) {
    console.error("Error:", err);
    passwordError.textContent = "Server error. Please try again later.";
  }
});
