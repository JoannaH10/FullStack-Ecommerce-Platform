// public/js/login.js

const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

// --- NEW ADMIN LOGIN LOGIC ---
const adminLoginOverlay = document.getElementById("admin-login-overlay");
const adminSecretKeyInput = document.getElementById("adminSecretKeyInput");
const adminLoginSubmitBtn = document.getElementById("adminLoginSubmitBtn");
const closeAdminModalBtn = document.getElementById("closeAdminModalBtn");

// Get references to the regular login form's email and password fields
// IMPORTANT: Ensure these IDs match your actual HTML for the regular login form's inputs!
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');


// --- Helper Functions for validation ---
// Client-side validation function (Collects all validation errors and returns them as an array of strings).
function validateForm(formType, data) {
    const errors = [];

    if (formType === 'register') {
        const nameRegex = /^[A-Za-z\s]+$/;
        const phoneRegex = /^[0-9]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


        if (!data.name || !nameRegex.test(data.name)) {
            errors.push("Full Name: Please enter a valid full name (letters and spaces only).");
        }
        if (!data.phone || !phoneRegex.test(data.phone)) {
            errors.push("Phone Number: Please enter a valid phone number (numbers only).");
        }
        if (!data.email || !emailRegex.test(data.email)) {
            errors.push("Email: Please enter a valid email address.");
        }
        if (!data.password || !passwordRegex.test(data.password)) {
            errors.push("Password: Must be at least 8 characters, with one uppercase, one lowercase, and one number.");
        }
    } else if (formType === 'login') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) {
            errors.push("Login Email: Please enter a valid email address.");
        }
        if (!data.password) {
            errors.push("Login Password: Password cannot be empty.");
        }
    } else if (formType === 'admin') { // New case for admin login client-side checks
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) {
            errors.push("Email: Please enter a valid email address for admin login.");
        }
        if (!data.password) {
            errors.push("Password: Password cannot be empty for admin login.");
        }
        if (!data.secretKey) {
            errors.push("Secret Key: Please enter the admin secret key.");
        }
    }

    return errors; // Return an array of error messages
}

// Function to show the admin login modal
function showAdminLoginModal() {
    if (adminLoginOverlay) {
        adminLoginOverlay.style.display = "flex"; // Show the flex container
        adminSecretKeyInput.value = ''; // Clear previous secret key input
        adminSecretKeyInput.focus(); // Focus on the secret key input field
    }
}

// Function to hide the admin login modal
function hideAdminLoginModal() {
    if (adminLoginOverlay) {
        adminLoginOverlay.style.display = "none";
    }
}


// Function to handle regular login process
async function handleLogin(email, password) {
    const loginData = { email: email, password: password };

    // Client-side validation for login
    const validationErrors = validateForm('login', loginData);
    if (validationErrors.length > 0) {
        alert('Login Validation Errors:\n' + validationErrors.join('\n')); // Use alert
        return false; // Stop if client-side validation fails
    }

    try {
        const response = await fetch('http://localhost:5000/api/s1/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
        });

        const data = await response.json(); // Still parse response for messages/user info

        if (response.ok) { // Check if status is 2xx
            localStorage.setItem('userEmail', data.user.email); // Keep if you want to store email
            alert('Logged in successfully!'); // Use alert
            window.location.href = '/'; // Redirect to homepage or dashboard
            return true;
        } else {
            const errorMessage = data.message || 'Login failed. Invalid credentials or unknown error.';
            alert('Login Error: ' + errorMessage); // Use alert
            console.error('Login error:', data);
            return false;
        }
    } catch (error) {
        console.error('Network or unexpected error during login:', error);
        alert('An unexpected error occurred during login. Please ensure the backend server is running and try again later.'); // Use alert
        return false;
    }
}


// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    console.log("login.js is running!"); // <-- ADDED FOR DEBUGGING

    // Ensure all necessary elements are grabbed after DOM is loaded
    // const container = document.getElementById("container"); // Already global
    // const registerBtn = document.getElementById("register"); // Already global
    // const loginBtn = document.getElementById("login"); // Already global
    // const adminLoginOverlay = document.getElementById("admin-login-overlay"); // Already global
    // const adminSecretKeyInput = document.getElementById("adminSecretKeyInput"); // Already global
    // const adminLoginSubmitBtn = document.getElementById("adminLoginSubmitBtn"); // Already global
    // const closeAdminModalBtn = document.getElementById("closeAdminModalBtn"); // Already global
    // const loginEmailInput = document.getElementById('loginEmail'); // Already global
    // const loginPasswordInput = document.getElementById('loginPassword'); // Already global


    const forgotPasswordLink = document.getElementById("forgot-password");
    const loginFormContainer = document.querySelector(".form-container.login");
    const resetPasswordFormContainer = document.getElementById("reset-password");

    const signupForm = document.getElementById("signupForm");
    const loginActualForm = document.getElementById("loginForm");

    // --- UI Toggling Logic ---
    if (forgotPasswordLink && loginFormContainer && resetPasswordFormContainer) {
        forgotPasswordLink.addEventListener("click", function (event) {
            event.preventDefault();
            loginFormContainer.style.display = "none";
            resetPasswordFormContainer.style.display = "block";
        });
    }

    if (loginBtn && loginFormContainer && resetPasswordFormContainer && container) {
        loginBtn.addEventListener("click", function () {
            if (resetPasswordFormContainer.style.display === "block") {
                resetPasswordFormContainer.style.display = "none";
                loginFormContainer.style.display = "block";
            }
            container.classList.remove("active");
        });
    }

    if (registerBtn && container) {
        registerBtn.addEventListener("click", () => {
            container.classList.add("active");
        });
    }

    // --- Admin Login Submission Logic (MOVED INSIDE DOMContentLoaded) ---
    // Event listener for keyboard shortcut (Ctrl + Alt + A)
    // Placed here to ensure 'document' is fully parsed and functions are defined
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.altKey && event.key === 'a') {
            event.preventDefault();
            showAdminLoginModal();
        }
    });

    // Event listener for Admin Login Submit Button
    // Placed here to ensure 'adminLoginSubmitBtn' is available in DOM
    if (adminLoginSubmitBtn) {
        adminLoginSubmitBtn.addEventListener('click', async () => {
            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value;
            const secretKey = adminSecretKeyInput.value.trim();

            const adminLoginData = { email, password, secretKey };

            const validationErrors = validateForm('admin', adminLoginData);
            if (validationErrors.length > 0) {
                alert('Admin Login Validation Errors:\n' + validationErrors.join('\n'));
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/s1/users/admin-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(adminLoginData),
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Admin Login successful:', data.message || 'Logged in as Admin!');
                    localStorage.setItem('userEmail', data.user.email);
                    localStorage.setItem('isAdmin', 'true');
                    hideAdminLoginModal();
                    alert('Admin Login successful!');
                    window.location.href = '/admin/dashboard';
                } else {
                    const errorMessage = data.message || 'Admin login failed. Invalid credentials or secret key.';
                    alert('Admin Login Error: ' + errorMessage);
                    console.error('Admin login error:', data);
                }
            } catch (error) {
                console.error('Network or unexpected error during admin login:', error);
                alert('An unexpected error occurred. Please try again.');
            }
        });
    }

    // Event listener for closing the admin modal
    // Placed here to ensure 'closeAdminModalBtn' is available in DOM
    if (closeAdminModalBtn) {
        closeAdminModalBtn.addEventListener('click', hideAdminLoginModal);
    }


    // --- Signup Form Submission Logic ---
    if (signupForm) {
        signupForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const phone = document.getElementById("phoneNumber").value.trim();

            const userData = { name, email, password, phone };

            const validationErrors = validateForm('register', userData);
            if (validationErrors.length > 0) {
                alert('Registration Validation Errors:\n' + validationErrors.join('\n'));
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/s1/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Registration successful:', data.message || 'User registered successfully!');
                    signupForm.reset();
                    if (container) container.classList.remove("active");
                    alert(data.message || 'Registration successful! Please log in.');
                } else {
                    const errorMessage = data.message || 'Registration failed. Please try again.';
                    alert('Registration Error: ' + errorMessage);
                    console.error('Registration error:', data);
                }
            } catch (error) {
                console.error('Network or unexpected error during registration:', error);
                alert('An unexpected error occurred during registration. Please ensure the backend server is running and try again later.');
            }
        });
    }

    // --- Login Form Submission Logic ---
    if (loginActualForm) {
        loginActualForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;
            await handleLogin(email, password);
        });
    }

}); // End DOMContentLoaded