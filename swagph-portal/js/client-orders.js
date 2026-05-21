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

    // 2. Load the global order master database table array
    const globalOrders = JSON.parse(localStorage.getItem('order_table')) || [];

    // 3. Filter down records strictly belonging to this logged-in account ID
    const myOrders = globalOrders.filter(order => order.o_custid === session.id);

    // 4. Clean interface render pipeline execution
    tableBody.innerHTML = '';
    if (noOrdersContainer) noOrdersContainer.innerHTML = '';

    if (myOrders.length === 0) {
        if (noOrdersContainer) {
            noOrdersContainer.innerHTML = `
                <div class="no-data-msg">
                    <p>You haven't requested any custom merchandise orders yet.</p>
                    <a href="client-order-request.html" style="color: #3498db; text-decoration: underline; font-weight: 600;">Submit your first design specs here</a>.
                </div>
            `;
        }
        return;
    }

    // Sort order rows descending so newest entries display at the very top
    myOrders.reverse().forEach(order => {
        // Assign beautiful contextual styling classes based on database status string value
        let badgeClass = "badge badge-review";
        if (order.o_status === "In Production" || order.o_status === "Processing") badgeClass = "badge badge-production";
        if (order.o_status === "Completed" || order.o_status === "Done") badgeClass = "badge badge-completed";

        // Safely format numerical records to local Philippine Pesos accounting layouts
        const formattedAmount = parseFloat(order.o_amount || 0).toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        });

        // If price is 0, display a user-friendly "Pending Review" string context instead of ₱0.00
        const priceDisplay = order.o_amount > 0 ? `<strong>${formattedAmount}</strong>` : `<span style="color:#64748b; font-style:italic; font-size:0.9rem;">Reviewing Quote</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>SLIP-${order.o_no}</strong></td>
            <td>
                <div><strong>${order.o_details}</strong></div>
                <div style="font-size:0.85rem; color:#64748b; margin-top:4px; max-width:400px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${order.o_notes || 'No special requirements noted.'}
                </div>
            </td>
            <td><span class="${badgeClass}">${order.o_status}</span></td>
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