// SWAGPH - Registration Processing Engine

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMsgDiv = document.getElementById('register-error');

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Clear any old error alerts from previous attempts
            if (errorMsgDiv) {
                errorMsgDiv.textContent = '';
                errorMsgDiv.style.display = 'none';
            }

            // 1. Extract form values matching register.html IDs
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const password = document.getElementById('reg-pass').value;

            // 2. Fetch the central user table array (with fallback protection)
            let userTable = [];
            try {
                const storedUsers = localStorage.getItem('user_table');
                userTable = storedUsers ? JSON.parse(storedUsers) : [];
            } catch (error) {
                console.error("Error loading user records:", error);
                userTable = [];
            }

            // 3. Duplicate Prevention Check
            const emailExists = userTable.some(user => user.u_email.toLowerCase() === email.toLowerCase());
            
            if (emailExists) {
                if (errorMsgDiv) {
                    errorMsgDiv.textContent = "This email address is already registered inside our portal.";
                    errorMsgDiv.style.display = 'block';
                } else {
                    alert("This email address is already registered inside our portal.");
                }
                return;
            }

            // 4. Build the structured user schema object to perfectly match your login engine rules
            const uniqueID = 'CLI' + Math.floor(1000 + Math.random() * 9000); // Generates a dynamic profile ID like CLI7294
            
            const newUser = {
                u_id: uniqueID,
                u_name: name,
                u_email: email,
                u_pass: password,
                u_role: 'CLIENT', // Default operational permission tier for new external signups
                u_phone: phone,
                u_created: new Date().toLocaleDateString()
            };

            // 5. Append new user object to array database and push to localStorage
            userTable.push(newUser);
            localStorage.setItem('user_table', JSON.stringify(userTable));

            // Optional: Provide instant visual success confirmation
            const submitBtn = registerForm.querySelector('.btn-submit');
            if (submitBtn) {
                submitBtn.textContent = "Account Created Successfully!";
                submitBtn.style.backgroundColor = "#2ecc71";
                submitBtn.disabled = true;
            }

            // Redirect user back to login view after a brief processing window
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);
        });
    } else {
        console.warn("Registration form wrapper container element not detected.");
    }
});