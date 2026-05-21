/**
 * SWAGPH - Client Dashboard Metric Calculator
 * Collects records from order_table matching u_id to populate performance indicators.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch authenticated token state context
    const session = JSON.parse(localStorage.getItem('swag_session'));
    if (!session || session.role !== 'CLIENT') {
        window.location.href = "login.html";
        return;
    }

    // Bind personalization labels
    document.getElementById('client-welcome-name').innerText = session.name;

    const activeCountEl = document.getElementById('client-active-count');
    const totalSpentEl = document.getElementById('client-total-spent');
    const recentTableBody = document.getElementById('client-recent-table-body');

    // 2. Fetch order ledger tables data context map
    const orderTable = JSON.parse(localStorage.getItem('order_table')) || [];

    // 3. Extract orders relative only to this customer ID index tracking key
    const myOrders = orderTable.filter(order => order.o_custid === session.id);

    // 4. Compute Metrics Pipeline
    let activeProductionCount = 0;
    let cumulativeInvestment = 0;

    myOrders.forEach(order => {
        // Evaluate active operational states
        if (order.o_status === "In Production" || order.o_status === "Processing" || order.o_status === "Pending Review") {
            activeProductionCount++;
        }
        // Accumulate completed financial accounts values
        if (order.o_status === "Completed" || order.o_status === "Done") {
            cumulativeInvestment += parseFloat(order.o_amount || 0);
        }
    });

    // Write computed indices safely down to view components
    if (activeCountEl) activeCountEl.innerText = activeProductionCount;
    if (totalSpentEl) {
        totalSpentEl.innerText = cumulativeInvestment.toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        });
    }

    // 5. Render Brief Overview Frame (Limit to top 3 newest entries)
    recentTableBody.innerHTML = '';
    const recentSlips = myOrders.reverse().slice(0, 3);

    if (recentSlips.length === 0) {
        recentTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; font-style:italic; padding: 25px;">No records available. Create a new request configuration to start.</td></tr>`;
    } else {
        recentSlips.forEach(order => {
            let badgeClass = "badge badge-review";
            if (order.o_status === "In Production" || order.o_status === "Processing") badgeClass = "badge badge-production";
            if (order.o_status === "Completed" || order.o_status === "Done") badgeClass = "badge badge-completed";

            const formattedPrice = parseFloat(order.o_amount || 0).toLocaleString('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2
            });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>SLIP-${order.o_no}</strong></td>
                <td>${order.o_details}</td>
                <td><span class="${badgeClass}">${order.o_status}</span></td>
                <td><strong>${order.o_amount > 0 ? formattedPrice : 'Reviewing Quote'}</strong></td>
            `;
            recentTableBody.appendChild(tr);
        });
    }

    // Logout Routine Hook Handler
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