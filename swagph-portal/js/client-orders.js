/**
 * SWAGPH - Client Purchase History Controller Engine
 * Securely reads order_table, filters by o_custid, and renders active progress badges.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch current authentication identity state
    const session = JSON.parse(localStorage.getItem('swag_session'));
    if (!session || session.role !== 'CLIENT') {
        window.location.href = "login.html";
        return;
    }

    const tableBody = document.getElementById('client-orders-table-body');
    const noOrdersContainer = document.getElementById('no-orders-container');

    if (!tableBody) return; // Guard clause to prevent script errors if template DOM changes

    // 2. Load the global order master database table array
    const globalOrders = JSON.parse(localStorage.getItem('order_table')) || [];

    // 3. Filter down records strictly belonging to this logged-in account ID (Using Email Match)
    const clientEmail = session.email;
    const myOrders = globalOrders.filter(order => order.o_custid === clientEmail);

    // 4. Clean interface render pipeline execution
    tableBody.innerHTML = '';
    if (noOrdersContainer) noOrdersContainer.innerHTML = '';

    if (myOrders.length === 0) {
        if (noOrdersContainer) {
            noOrdersContainer.innerHTML = `
                <div class="no-data-msg" style="text-align:center; padding:40px; color:#64748b;">
                    <p>You haven't requested any custom merchandise orders yet.</p>
                    <a href="client-order-request.html" style="color: #3498db; text-decoration: underline; font-weight: 600;">Submit your first design specs here</a>.
                </div>
            `;
        }
        return;
    }

    // Sort order rows: Create a shallow copy first, then reverse to display newest entries at the top
    myOrders.slice().reverse().forEach(order => {
        // Normalize status string to uppercase to avoid casing bugs from administrative updates
        const currentStatus = (order.o_status || 'PENDING').toUpperCase();
        
        // Assign beautiful contextual styling classes based on database status string value
        let badgeClass = "badge badge-review";
        if (currentStatus === "IN PRODUCTION" || currentStatus === "PROCESSING") {
            badgeClass = "badge badge-production";
        } else if (currentStatus === "COMPLETED" || currentStatus === "DONE") {
            badgeClass = "badge badge-completed";
        } else if (currentStatus === "CANCELLED") {
            badgeClass = "badge badge-cancelled";
        }

        // Safely format numerical records to local Philippine Pesos accounting layouts
        const orderAmount = parseFloat(order.o_amount || 0);
        const formattedAmount = orderAmount.toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        });

        // If price is 0, display a user-friendly "Pending Review" string context instead of ₱0.00
        const priceDisplay = orderAmount > 0 
            ? `<strong>${formattedAmount}</strong>` 
            : `<span style="color:#64748b; font-style:italic; font-size:0.9rem;">Reviewing Quote</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>SLIP-${order.o_no}</strong></td>
            <td>
                <div><strong>${order.o_details || order.item_id || 'Custom Merchandise Item'}</strong></div>
                <div style="font-size:0.85rem; color:#64748b; margin-top:4px; max-width:400px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${order.o_notes || 'No special requirements noted.'}
                </div>
            </td>
            <td><span class="${badgeClass}">${order.o_status || 'Pending'}</span></td>
            <td>${order.o_date}</td>
            <td class="text-right">${priceDisplay}</td>
        `;
        tableBody.appendChild(tr);
    });

    // Integrated Global Session Interceptor Hook
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