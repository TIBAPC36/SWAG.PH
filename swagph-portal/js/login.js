// --- SWAGPH - Unified Authentication Logic Engine (Backend Synchronized) ---

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const loginFailed = document.getElementById('login-failed');
const togglePassword = document.getElementById('toggle-password');
const formWrapper = document.querySelector('.form-wrapper');

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function updateButtonState() {
  if (!emailInput || !passwordInput || !loginBtn) return;
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  loginBtn.disabled = !(email.length >= 1 && password.length >= 1);
}

function showError(input, message) {
  if (input === 'email' && emailError) {
    emailError.textContent = message;
  } else if (input === 'password' && passwordError) {
    passwordError.textContent = message;
  }
}

function clearErrors() {
  if (emailError) emailError.textContent = '';
  if (passwordError) passwordError.textContent = '';
  if (loginFailed) {
    loginFailed.textContent = '';
    loginFailed.style.display = 'none';
  }
}

function setAuthenticating(state) {
  if (!loginBtn) return;
  if (state) {
    loginBtn.textContent = 'Authenticating...';
    loginBtn.disabled = true;
  } else {
    loginBtn.textContent = 'Login';
    updateButtonState();
  }
}

function shakeForm() {
  if (formWrapper) {
    formWrapper.classList.add('shake');
    setTimeout(() => {
      formWrapper.classList.remove('shake');
    }, 500);
  }
}

// Save active session locally for dashboard use
function saveSession(userRecord) {
  const currentSession = {
    id: userRecord.user_id,             // 👈 Maps perfectly to database response schema
    name: userRecord.full_name,         // 👈 Maps perfectly to database response schema
    email: userRecord.email.toLowerCase().trim(),
    role: userRecord.role || 'CLIENT'   // 👈 Matches the exact nested role string ('ADMIN' / 'CLIENT')
  };
  localStorage.setItem('swag_session', JSON.stringify(currentSession));
}

function routeByRole(role) {
  if (role === 'ADMIN') {
    window.location.href = 'admin.html';              // 👈 Correctly routes Admin users
  } else if (role === 'CLIENT') {
    window.location.href = 'client-dashboard.html';   // 👈 Correctly routes Client users
  } else {
    const message = 'Critical System error: User account does not possess a valid security role.';
    if (loginFailed) {
      loginFailed.textContent = message;
      loginFailed.style.display = 'block';
    } else {
      alert(message);
    }
    localStorage.removeItem('swag_session');
  }
}

// Form Operational Scope Initialization Guard
if (loginForm) {

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      clearErrors();
      const email = emailInput.value.trim();
      if (email.length > 0 && !validateEmail(email)) {
        showError('email', 'Enter a valid email.');
      }
      updateButtonState();
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      clearErrors();
      updateButtonState();
    });
  }

  if (togglePassword && passwordInput) {
    let passwordVisible = false;
    togglePassword.addEventListener('click', () => {
      passwordVisible = !passwordVisible;
      passwordInput.type = passwordVisible ? 'text' : 'password';
      togglePassword.textContent = passwordVisible ? '👁️' : '🙈';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    setAuthenticating(true);

    const enteredEmail = emailInput.value.trim().toLowerCase();
    const enteredPassword = passwordInput.value;

    try {
      // Send login credentials directly to your Node.js API server
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: enteredEmail, password: enteredPassword })
      });

      const data = await response.json();

      if (response.ok) {
        // Backend says OK -> Save database values into session and redirect!
        saveSession(data.user);
        routeByRole(data.user.role || 'CLIENT'); // 👈 Seamlessly triggers alignment check
      } else {
        // Backend returned a 401 or bad request error
        const errorMsg = data.message || 'Invalid email address or access password credentials.';
        if (loginFailed) {
          loginFailed.textContent = errorMsg;
          loginFailed.style.display = 'block';
        } else {
          alert(errorMsg);
        }
        shakeForm();
        setAuthenticating(false);
      }

    } catch (error) {
      console.error('Connection Error:', error);
      const networkError = 'Could not connect to the backend server. Is server.js running?';
      if (loginFailed) {
        loginFailed.textContent = networkError;
        loginFailed.style.display = 'block';
      } else {
        alert(networkError);
      }
      setAuthenticating(false);
    }
  });

  updateButtonState();
} else {
  console.warn('Login form fields skipped. Operating on a non-authentication page container context.');
}