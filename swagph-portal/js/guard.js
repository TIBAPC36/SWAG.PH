/**
 * SWAGPH - Route Access Session Guard
 * Prevents unauthorized URL hijacking by validating active session state and role clearance tiers.
 */
(function() {
    const activeSession = localStorage.getItem('swag_session');
    const currentPath = window.location.pathname;

    // 1. Absolute Block: Kick user out if no session token exists at all
    if (!activeSession) {
        alert("Access Denied: Please sign in to authenticate your session.");
        window.location.href = "login.html";
        return;
    }

    try {
        const user = JSON.parse(activeSession);

        // 2. Role-Based Clearance Authorization Guard
        if (currentPath.includes('admin.html') && user.role !== 'ADMIN') {
            alert(`Access Denied: Account ${user.id} does not possess ADMIN clearance levels.`);
            window.location.href = "client-dashboard.html";
        } 
        
        else if (currentPath.includes('client-dashboard.html') && user.role !== 'CLIENT') {
            // If an Admin accidentally wanders to the client portal, redirect them back to base camp
            window.location.href = "admin.html";
        }
    } catch (error) {
        console.error("Session verification corrupted, purging token.", error);
        localStorage.removeItem('swag_session');
        window.location.href = "login.html";
    }
})();