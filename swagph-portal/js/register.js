// --- SWAGPH - Client Registration Control Engine (Backend Synchronized) ---

// ==========================================
// UI & FORM SUBMISSION CONTROLLER
// ==========================================
const RegisterDOM = {
  form: document.getElementById('register-form'),
  nameInput: document.getElementById('reg-name'),
  emailInput: document.getElementById('reg-email'),
  phoneInput: document.getElementById('reg-phone'), // Optional field for UI
  passInput: document.getElementById('reg-pass'),
  errorDisplay: document.getElementById('register-error'),
  submitBtn: document.querySelector('.btn-submit') || document.getElementById('register-btn'),

  init() {
    if (!this.form) {
      console.warn('Registration form elements missing from current view.');
      return;
    }
    this.setupEvents();
  },

  showError(message) {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = message;
      this.errorDisplay.style.display = 'block';
    } else {
      alert(message);
    }
  },

  clearError() {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = '';
      this.errorDisplay.style.display = 'none';
    }
  },

  setSubmitting(state) {
    if (!this.submitBtn) return;
    if (state) {
      this.submitBtn.textContent = 'Creating Account...';
      this.submitBtn.disabled = true;
      this.submitBtn.style.opacity = '0.7';
    } else {
      this.submitBtn.textContent = 'Create Account';
      this.submitBtn.disabled = false;
      this.submitBtn.style.opacity = '1';
    }
  },

  setupEvents() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearError();

      const name = this.nameInput.value.trim();
      const email = this.emailInput.value.trim().toLowerCase();
      const password = this.passInput.value;

      if (!name || !email || !password) {
        this.showError('Please fill out all mandatory fields.');
        return;
      }

      this.setSubmitting(true);

      try {
        // Send registration request directly to your live Node.js API server
        const response = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            fullName: name, // 👈 Matches 'fullName' expected in server.js
            email: email,   // 👈 Matches 'email' expected in server.js
            password: password // 👈 Matches 'password' expected in server.js
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Server returned 201 Created successfully!
          alert('Account created successfully! Redirecting to login window...');
          window.location.href = 'login.html';
        } else {
          // Server returned an error (e.g., Email already registered)
          this.showError(data.message || 'Registration failed. Please try again.');
          this.setSubmitting(false);
        }

      } catch (error) {
        console.error('Connection Error:', error);
        this.showError('Could not connect to backend server. Is server.js running?');
        this.setSubmitting(false);
      }
    });
  }
};

// Initialize execution context once environment signals readiness
document.addEventListener('DOMContentLoaded', () => RegisterDOM.init());