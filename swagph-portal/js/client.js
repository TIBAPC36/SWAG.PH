/**
 * SWAGPH - Client Dashboard Operations & Security
 */

// --- 1. SECURITY ROUTE GUARD ---
// This runs immediately to prevent unauthorized eyes from seeing the page
(function enforceSecurityGate() {
    const sessionRaw = localStorage.getItem('swag_session');
    
    if (!sessionRaw) {
        window.location.href = "login.html"; // No session? Kick them to login
        return;
    }

    const session = JSON.parse(sessionRaw);
    if (session.role !== 'CLIENT') {
        // Wrong role? Block the page and show an access denied screen
        document.body.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; text-align:center; background:#f8d7da; color:#721c24;">
                <h1 style="font-size:3rem; margin-bottom:10px;">🛑 Access Denied</h1>
                <p style="font-size:1.2rem;">This area is reserved for clients only.</p>
                <button onclick="window.location.href='login.html'" style="margin-top:20px; padding:10px 20px; background:#721c24; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Go to Login</button>
            </div>
        `;
        throw new Error("RBAC Authorization Failure: Client clearance required.");
    }
})();

// --- 2. PAGE INTERACTIVITY & DATA POPULATION ---
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('swag_session'));
    
    // Dynamically insert the client's actual name into the greeting if the element exists
    const clientNameEl = document.getElementById('client-welcome');
    if (clientNameEl && session) {
        clientNameEl.innerText = `Welcome back, ${session.name}!`;
    }

    // Set up the logout button trigger
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to sign out of SWAGPH?")) {
                localStorage.removeItem('swag_session'); // Wipe the session
                window.location.href = "login.html";    // Kick back to login
            }
        });
    }
});