/**
 * SWAGPH - Client Order Request Controller
 * Increments sysorder_lno sequence register maps natively.
 */
document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('order-request-form');

    // 1. Double-check local arrays initialization presence
    if (!localStorage.getItem('order_table')) {
        localStorage.setItem('order_table', JSON.stringify([]));
    }

    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Load session tokens context state
            const session = JSON.parse(localStorage.getItem('swag_session'));
            if (!session) {
                window.location.href = "login.html";
                return;
            }

            const details = document.getElementById('req-details').value.trim();
            const notes = document.getElementById('req-notes').value.trim();

            // Open operational data storage structures
            let systemTable = JSON.parse(localStorage.getItem('system_table'));
            let orderTable = JSON.parse(localStorage.getItem('order_table')) || [];

            // --- COUNTER INCREMENT REGISTRY ENGINE (sysorder_lno) ---
            // Acknowledge the last order sequence string and convert to integer base-10 calculation
            let currentLastOrderNumber = parseInt(systemTable.sysorder_lno, 10) || 0;
            
            // Advance sequential key by 1 block step
            let nextOrderNumber = currentLastOrderNumber + 1;
            
            // Format back cleanly into your fixed length 6-character text configuration
            let paddedOrderNo = String(nextOrderNumber).padStart(6, '0'); // e.g. "000001"

            // Update system table indicators
            systemTable.sysorder_lno = paddedOrderNo;
            systemTable.sysdate = new Date().toLocaleDateString();
            systemTable.systime = new Date().toLocaleTimeString();

            // --- ASSEMBLE SYSTEM RECORD PACKET COMPONENT ---
            const newOrderRecord = {
                o_no: paddedOrderNo,                       // Generated reference number mapping key
                o_custid: session.id,                     // Client customer reference identifier tracking index
                o_details: details,                       // Item sizing descriptions
                o_notes: notes,                           // Specialized printing style comments text
                o_amount: 0.00,                           // Set to flat zero. Handled by Admin valuation review later.
                o_status: "Pending Review",               // System initial status draft value 
                o_date: new Date().toLocaleDateString()   // Capture date marker
            };

            // Commit modifications down into system data array storage maps
            orderTable.push(newOrderRecord);

            // Re-serialize modified arrays down to local database memory contexts
            localStorage.setItem('system_table', JSON.stringify(systemTable));
            localStorage.setItem('order_table', JSON.stringify(orderTable));

            alert(`Order request successfully generated! Track progress via reference code: Slip No. ${paddedOrderNo}`);
            
            // Redirect user directly down to their purchases tracker view pane
            window.location.href = "client-orders.html";
        });
    }

    // Unified Session Interceptor Hook
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