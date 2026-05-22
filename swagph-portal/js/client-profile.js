/**
 * SWAGPH - Client Profile Controller Logic
 * Handles client information rendering and session termination sequences
 */
document.addEventListener('DOMContentLoaded', () => {
    const sessionRaw = localStorage.getItem('swag_session');
    
    // 1. Explicit Redirect Gate: Force back to login if no session data exists
    if (!sessionRaw) {
        window.location.href = "login.html";
        return;
    }

    const session = JSON.parse(sessionRaw);
    
    // 2. Populate DOM components securely
    const nameEl = document.getElementById('prof-name');
    const emailEl = document.getElementById('prof-email');
    const roleEl = document.getElementById('prof-role'); // Optional target for a clean badge look
    
    if (nameEl) nameEl.innerText = session.name || 'N/A';
    if (emailEl) emailEl.innerText = session.email || 'N/A';
    if (roleEl) roleEl.innerText = session.role || 'CLIENT';

    // 3. Connect Unified Logout Listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Log out from your SWAGPH Account?")) {
                localStorage.removeItem('swag_session');
                window.location.href = "login.html";
            }
        });
    }
});