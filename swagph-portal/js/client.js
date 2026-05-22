/**
 * SWAGPH - Client Dashboard Operations & Security
 * Manages secure client sessions and isolates customer-specific order pipelines
 */

// --- 1. SECURITY ROUTE GUARD (Runs Immediately) ---
(function enforceSecurityGate() {
    const sessionRaw = localStorage.getItem('swag_session');
    
    if (!sessionRaw) {
        window.location.href = "login.html";
        return;
    }

    const session = JSON.parse(sessionRaw);
    if (session.role !== 'CLIENT') {
        // Safe execution: Wait for the document to parse before attempting to overwrite the body element
        document.addEventListener('DOMContentLoaded', () => {
            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; text-align:center; background:#f8d7da; color:#721c24; padding: 20px;">
                    <h1 style="font-size:3rem; margin-bottom:10px;">🛑 Access Denied</h1>
                    <p style="font-size:1.2rem;">This area is reserved for clients only.</p>
                    <button onclick="window.location.href='login.html'" style="margin-top:20px; padding:10px 20px; background:#721c24; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Go to Login</button>
                </div>
            `;
        });
        throw new Error("RBAC Authorization Failure: Client clearance required.");
    }
})();

// --- 2. PAGE INTERACTIVITY & CLIENT DATA ISOLATION ---
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('swag_session'));
    if (!session) return;

    // Element Bindings
    const clientWelcomeEl = document.getElementById('client-welcome');
    const logoutBtn = document.getElementById('logout-btn');
    const clientTableBody = document.getElementById('client-orders-table-body');

    // Personalized UI Presentation Layer
    if (clientWelcomeEl) {
        clientWelcomeEl.innerText = `Welcome back, ${session.name}!`;
    }

    // --- CLIENT ORDER HISTORIC PIPELINE FILTER ---
    function renderClientOrders() {
        if (!clientTableBody) return;

        // Pull master database table records
        const allOrders = JSON.parse(localStorage.getItem('order_table')) || [];

        // Security Isolation: Filter down to ONLY items matching this logged-in client's unique identifier
        // (Matches against the email or user identity linked to the session)
        const clientIdentifier = session.email || session.username;
        const personalOrders = allOrders.filter(order => order.o_custid === clientIdentifier);

        clientTableBody.innerHTML = '';

        if (personalOrders.length === 0) {
            clientTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">You haven't placed any orders yet.</td></tr>`;
            return;
        }

        // Render rows for the client tracking layout matrix
        personalOrders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${order.o_no}</strong></td>
                <td>${order.o_date}</td>
                <td>${order.item_id} <small style="color:#64748b;">(Qty: ${order.o_qty})</small></td>
                <td>₱${parseFloat(order.o_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td><span class="badge-status status-${order.o_status.toLowerCase()}">${order.o_status}</span></td>
            `;
            clientTableBody.appendChild(tr);
        });
    }

    // Sign Out Action Handling Controller
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to sign out of SWAGPH?")) {
                localStorage.removeItem('swag_session');
                window.location.href = "login.html";
            }
        });
    }

    // Execute personal pipeline lookup sequence on mount
    renderClientOrders();
});