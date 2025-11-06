// Select form and inputs
const form = document.querySelector("form");
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');

// Check if elements exist
if (!form || !emailInput || !passwordInput) {
  console.error("Login form elements not found");
  // Exit early - form elements not found
} else {

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

  // Send request to backend for real MongoDB login
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = "Invalid credentials.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      passwordError.textContent = errorMessage;
      return;
    }

    const data = await response.json();

    // Success → save state and redirect
    localStorage.setItem("isLoggedIn", "true");
    if (data.user && data.user.id) {
      localStorage.setItem("userId", data.user.id);
      window.location.href = "/profiles";
    } else {
      passwordError.textContent = "Login successful but user data missing. Please try again.";
    }
  } catch (err) {
    passwordError.textContent = "Connection error. Please check if the server is running.";
  }
});
} // End of else block