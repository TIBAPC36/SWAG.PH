/**
 * SWAGPH - Client Dashboard Metric Calculator
 * Collects records matching client email to populate performance indicators.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch authenticated token state context
    const session = JSON.parse(localStorage.getItem('swag_session'));
    if (!session || session.role !== 'CLIENT') {
        window.location.href = "login.html";
        return;
    }

    // Bind personalization labels securely using synchronized keys
    const welcomeNameEl = document.getElementById('client-welcome-name');
    if (welcomeNameEl) welcomeNameEl.innerText = session.name || 'Client';

    const activeCountEl = document.getElementById('client-active-count');
    const totalSpentEl = document.getElementById('client-total-spent');
    const recentTableBody = document.getElementById('client-recent-table-body');

    // 2. Fetch order ledger tables data context map
    const orderTable = JSON.parse(localStorage.getItem('order_table')) || [];

    // 3. Extract orders relative only to this customer's account email address tracking key
    const clientEmail = session.email;
    const myOrders = orderTable.filter(order => order.o_custid === clientEmail);

    // 4. Compute Metrics Pipeline
    let activeProductionCount = 0;
    let cumulativeInvestment = 0;

    myOrders.forEach(order => {
        // Normalize status string to uppercase to avoid casing bugs from administrative updates
        const currentStatus = (order.o_status || '').toUpperCase();

        // Evaluate active operational states (MAPPED: Included 'PENDING' to match order booking engine defaults)
        if (currentStatus === "PENDING" ||
            currentStatus === "IN PRODUCTION" || 
            currentStatus === "PROCESSING" || 
            currentStatus === "PENDING REVIEW" || 
            currentStatus === "REVIEWING QUOTE") {
            activeProductionCount++;
        }
        
        // Accumulate completed financial accounts values
        if (currentStatus === "COMPLETED" || currentStatus === "DONE") {
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

    // 5. Render Brief Overview Frame (Limit to top 3 newest entries using slice safety)
    if (recentTableBody) {
        recentTableBody.innerHTML = '';
        const recentSlips = myOrders.slice().reverse().slice(0, 3);

        if (recentSlips.length === 0) {
            recentTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; color:#64748b; font-style:italic; padding: 25px;">
                        No records available. Create a new request configuration to start.
                    </td>
                </tr>`;
        } else {
            recentSlips.forEach(order => {
                const currentStatus = (order.o_status || '').toUpperCase();
                
                let badgeClass = "badge badge-review";
                if (currentStatus === "IN PRODUCTION" || currentStatus === "PROCESSING") {
                    badgeClass = "badge badge-production";
                } else if (currentStatus === "COMPLETED" || currentStatus === "DONE") {
                    badgeClass = "badge badge-completed";
                } else if (currentStatus === "CANCELLED") {
                    badgeClass = "badge badge-cancelled";
                } else if (currentStatus === "PENDING") {
                    badgeClass = "badge badge-pending"; // 👈 Clean layout styling selector for baseline pending orders
                }

                const orderAmount = parseFloat(order.o_amount || 0);
                const formattedPrice = orderAmount.toLocaleString('en-PH', {
                    style: 'currency',
                    currency: 'PHP',
                    minimumFractionDigits: 2
                });

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>SLIP-${order.o_no}</strong></td>
                    <td>${order.o_details || 'Custom Merchandise Item'}</td>
                    <td><span class="${badgeClass}">${order.o_status || 'Pending'}</span></td>
                    <td><strong>${orderAmount > 0 ? formattedPrice : 'Reviewing Quote'}</strong></td>
                `;
                recentTableBody.appendChild(tr);
            });
        }
    }

    // Logout Routine Hook Handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Log out from your Account?")) {
                localStorage.removeItem('swag_session');
                window.location.href = "login.html";
            }
        });
    }
});