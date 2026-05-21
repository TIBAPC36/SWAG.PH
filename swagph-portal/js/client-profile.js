/**
 * SWAGPH - Client Profile Controller Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const sessionRaw = localStorage.getItem('swag_session');
    
    if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        
        // Populate DOM components securely
        const nameEl = document.getElementById('prof-name');
        const emailEl = document.getElementById('prof-email');
        
        if (nameEl) nameEl.innerText = session.name || 'N/A';
        if (emailEl) emailEl.innerText = session.email || 'N/A';
    }

    // Connect Unified Logout Listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Log out from your SWAGPH Account?")) {
                localStorage.removeItem('swag_session');
                window.location.href = "login.html"; // Matches your updated redirect scheme
            }
        });
    }
});