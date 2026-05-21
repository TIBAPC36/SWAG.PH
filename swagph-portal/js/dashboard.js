/**
 * Main Dashboard Controller - SWAGPH Portal
 * Synchronizes layout controls with backend data structures.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize standard shell utilities
    setWelcomeMeta();
    setupUnifiedLogout();
    setCurrentDateDisplay();
    
    // Core Engine Process
    updateDashboardMetrics();
});

/**
 * Calculations and Dynamic Content Generation
 */
function updateDashboardMetrics() {
    // Safely parse target tables from LocalStorage
    const orders = JSON.parse(localStorage.getItem('swag_orders')) || [];
    const transactions = JSON.parse(localStorage.getItem('swag_transactions')) || [];
    
    // 1. Calculate Active Orders (Status is not 'Completed' or 'Paid')
    const activeOrdersCount = orders.filter(order => 
        order.status !== 'Completed' && order.status !== 'Paid'
    ).length;
    
    // 2. Calculate Monthly Revenue (Filtering transactions flagged as Sales)
    const runningRevenue = transactions
        .filter(t => t.category === 'Sales')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // 3. Fallback tracking logic for context variables (Suppliers default counter template)
    const pendingSuppliersCount = 5; 

    // Target UI Value Injections
    const activeOrdersEl = document.getElementById('stat-active-orders');
    const revenueEl = document.getElementById('stat-monthly-revenue');
    const suppliersEl = document.getElementById('stat-pending-suppliers');

    if (activeOrdersEl) activeOrdersEl.innerText = activeOrdersCount;
    if (revenueEl) {
        revenueEl.innerText = `₱${runningRevenue.toLocaleString('en-PH', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        })}`;
    }
    if (suppliersEl) suppliersEl.innerText = pendingSuppliersCount;

    // 4. Update Recent Activity Feed to match the concept mockup timeline style
    const timelineFeed = document.getElementById('activity-timeline-feed');
    if (timelineFeed) {
        if (orders.length === 0) {
            timelineFeed.innerHTML = `<div class="empty-feed-msg">No active tracking adjustments found.</div>`;
            return;
        }

        // Loop through the 3 most recent entries
        timelineFeed.innerHTML = orders.slice(-3).reverse().map(order => {
            const timeDiffMock = "Just Now"; 
            const formattedClient = order.client || 'Unknown Client';
            const trackingNum = order.id ? `#${order.id}` : 'N/A';
            const statusLabel = order.status || 'Received';

            return `
                <div class="activity-timeline-item">
                    <div class="activity-details">
                        <span class="activity-bold-text">Order ${trackingNum}</span> 
                        marked as <span class="activity-status-highlight">${statusLabel}</span> for ${formattedClient}.
                    </div>
                    <div class="activity-time-stamp">${timeDiffMock}</div>
                </div>
            `;
        }).join('');
    }
}

/**
 * Renders regional calendar metadata inside header sections
 */
function setCurrentDateDisplay() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.innerText = new Date().toLocaleDateString('en-US', options);
    }
}

/**
 * Handle custom security and credential greeting rules safely
 */
function setWelcomeMeta() {
    const sessionRaw = localStorage.getItem('swag_session');
    const partnerEl = document.getElementById('welcome-partner');
    
    if (sessionRaw && partnerEl) {
        const session = JSON.parse(sessionRaw);
        if (session.name) {
            partnerEl.innerText = `Welcome back, ${session.name}`;
        }
    }
}

function setupUnifiedLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Terminate Admin dashboard session?")) {
                localStorage.removeItem('swag_session');
                window.location.href = "login.html";
            }
        });
    }
}