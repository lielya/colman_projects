// Registration form validation and submission
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('emailInput');
    const username = document.getElementById('usernameInput');
    const password = document.getElementById('passwordInput');
    const confirmPassword = document.getElementById('confirmPasswordInput');
    const submitBtn = document.querySelector('.btn-sign-up');
    
    // Get error elements
    const emailError = document.getElementById('emailError');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    
    // Reset previous errors
    clearErrors();
    
    let isValid = true;
    
    // Email validation - matches MongoDB validation pattern
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.value)) {
        showError(email, emailError, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (username.value.length < 3 || username.value.length > 20) {
        showError(username, usernameError, 'Username must be between 3 and 20 characters');
        isValid = false;
    } else if (!usernameRegex.test(username.value)) {
        showError(username, usernameError, 'Username can only contain letters, numbers, and underscores');
        isValid = false;
    }
    
    // Password validation
    if (password.value.length < 6) {
        showError(password, passwordError, 'Password must be at least 6 characters long');
        isValid = false;
    }
    
    // Confirm password validation
    if (password.value !== confirmPassword.value) {
        showError(confirmPassword, confirmPasswordError, 'Passwords do not match');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    setLoadingState(submitBtn, true);
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.value,
                username: username.value,
                password: password.value,
                confirmPassword: confirmPassword.value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.user && data.user.id) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userId', data.user.id);
            }
            window.location.href = '/';
            return;
        } else {
            // Handle server errors
            if (data.details && Array.isArray(data.details)) {
                // Validation errors from server
                data.details.forEach(error => {
                    switch (error.field) {
                        case 'email':
                            showError(email, emailError, error.message);
                            break;
                        case 'username':
                            showError(username, usernameError, error.message);
                            break;
                        case 'password':
                            showError(password, passwordError, error.message);
                            break;
                        case 'confirmPassword':
                            showError(confirmPassword, confirmPasswordError, error.message);
                            break;
                    }
                });
            } else {
                // General error
                if (response.status === 409) {
                    if (data.error.includes('Email')) {
                        showError(email, emailError, data.error);
                    } else {
                        showError(username, usernameError, data.error);
                    }
                } else {
                    showGeneralError(data.error || 'Registration failed. Please try again.');
                }
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        showGeneralError('Connection failed. Please check your internet connection and try again.');
    } finally {
        setLoadingState(submitBtn, false);
    }
});

function clearErrors() {
    const inputs = ['emailInput', 'usernameInput', 'passwordInput', 'confirmPasswordInput'];
    const errors = ['emailError', 'usernameError', 'passwordError', 'confirmPasswordError'];
    
    inputs.forEach(id => {
        const input = document.getElementById(id);
        input.classList.remove('is-invalid');
    });
    
    errors.forEach(id => {
        const error = document.getElementById(id);
        error.style.display = 'none';
        error.textContent = '';
    });
}

function showError(input, errorElement, message) {
    input.classList.add('is-invalid');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function showGeneralError(message) {
    // Create or update general error message
    let errorDiv = document.getElementById('generalError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'generalError';
        errorDiv.className = 'error-message';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginBottom = '20px';
        document.querySelector('.register-box').insertBefore(errorDiv, document.getElementById('registerForm'));
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showSuccessMessage(message) {
    // Create or update success message
    let successDiv = document.getElementById('successMessage');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'successMessage';
        successDiv.className = 'success-message';
        document.querySelector('.register-box').insertBefore(successDiv, document.getElementById('registerForm'));
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// Check if redirected from login with success message
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        showSuccessMessage('Registration successful! Please sign in with your new account.');
    }
});