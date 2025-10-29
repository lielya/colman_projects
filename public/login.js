// Amit-Mosseri-206446791-Liel-Yaakobov-322366311-Lihi-Skif-322235888

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

// Validation function
form.addEventListener("submit", function (e) {
  e.preventDefault();
  let isValid = true;

  // Reset errors
  emailError.textContent = "";
  passwordError.textContent = "";

  // Validate email
  const emailValue = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailValue)) {
    emailError.textContent = "Please enter a valid email address.";
    isValid = false;
  }

  // Validate password
  const passwordValue = passwordInput.value.trim();
  if (passwordValue.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    isValid = false;
  }

  // If valid, save state and redirect
  if (isValid) {
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "profiles.html";
  }
});
