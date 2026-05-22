/**
 * SWAGPH - Route Access Session Guard
 * Prevents unauthorized URL hijacking by validating active session state and role clearance tiers.
 */
(function() {
    const activeSession = localStorage.getItem('swag_session');
    const currentPath = window.location.pathname.toLowerCase();

    // 1. Define public access screens that do NOT require an active session token
    const publicPages = ['login.html', 'register.html', 'forgot-password.html'];
    const isPublicPage = publicPages.some(page => currentPath.endsWith(page));

    // 2. Absolute Block: Kick unauthenticated users out if trying to access private dashboard pages
    if (!activeSession) {
        if (!isPublicPage) {
            alert("Access Denied: Please sign in to authenticate your session.");
            window.location.href = "login.html";
        }
        return; // Stop execution thread safely for public views
    }

    try {
        const user = JSON.parse(activeSession);

        // 3. Auto-Redirect if authenticated users intentionally try to open the login or registration forms
        if (isPublicPage) {
            if (user.role === 'ADMIN') {
                window.location.href = "admin.html";
            } else {
                window.location.href = "client-dashboard.html";
            }
            return;
        }

        // 4. Role-Based Clearance Authorization Guard Tiers
        if (currentPath.includes('admin') && user.role !== 'ADMIN') {
            alert(`Access Denied: Account ${user.email || 'User'} does not possess ADMIN clearance levels.`);
            window.location.href = "client-dashboard.html";
        } 
        else if ((currentPath.includes('client-') || currentPath.includes('profile')) && user.role !== 'CLIENT') {
            // If an Admin wanders to the client portal components, redirect them back to administrative control views
            window.location.href = "admin.html";
        }
    } catch (error) {
        console.error("Session verification corrupted, purging token.", error);
        localStorage.removeItem('swag_session');
        window.location.href = "login.html";
    }
})();