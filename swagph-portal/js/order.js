/**
 * SWAGPH - Enterprise Resource Planning (ERP) Order Controller
 * Fully equipped with Approval, Edit, and Deep Delete Capabilities.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. SESSION AUTHORIZATION GATE
    // ==========================================
    const session = JSON.parse(localStorage.getItem('swag_session'));
    if (!session || session.role !== 'ADMIN') {
        window.location.href = "login.html";
        return;
    }

    // DOM Target Bindings
    const tableBody = document.getElementById('orders-table-body');
    const orderModal = document.getElementById('order-modal');
    const addOrderBtn = document.getElementById('add-order-btn');
    const closeOrderModal = document.getElementById('close-order-modal');
    const orderForm = document.getElementById('order-form');
    const skuSelect = document.getElementById('modal-sku-select');
    
    const quantityInput = document.getElementById('modal-quantity-input');
    const priceInput = document.getElementById('modal-price-input');
    const previewTotalEl = document.getElementById('invoice-preview-total');

    const pendingCountEl = document.getElementById('pending-orders-count');
    const completedCountEl = document.getElementById('completed-orders-count');
    const totalPipelineValueEl = document.getElementById('order-pipeline-value');

    // ==========================================
    // 2. PIPELINE METRICS & RENDER ENGINE
    // ==========================================
    function renderOrdersBoard() {
        const orders = JSON.parse(localStorage.getItem('order_table')) || [];
        const inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];
        
        if (tableBody) tableBody.innerHTML = '';
        
        let pendingCount = 0;
        let completedCount = 0;
        let aggregatePipelineValue = 0;

        orders.forEach(order => {
            const totalValue = parseFloat(order.o_amount || 0);
            aggregatePipelineValue += totalValue;

            // Normalize values safely
            const status = (order.o_status || '').toUpperCase();
            if (status === 'PENDING' || status === 'PENDING REVIEW') pendingCount++;
            if (status === 'COMPLETED' || status === 'FULFILLED') completedCount++;

            // Handle mapping description details
            const warehouseItem = inventory.find(i => String(i.id).trim() === String(order.item_id).trim());
            const itemDescription = order.o_details || (warehouseItem ? warehouseItem.name : "Custom Request Profile / Quote");

            if (tableBody) {
                const tr = document.createElement('tr');
                
                // Build an action interface row based on current state parameters
                let actionButtons = '';
                
                if (status === 'PENDING' || status === 'PENDING REVIEW') {
                    actionButtons = `
                        <button class="action-approve-btn" data-id="${order.o_no}" style="padding:4px 8px; font-size:0.8rem; background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; cursor:pointer; border-radius:4px; margin-right:4px;">Approve & Price</button>
                        <button class="action-cancel-btn" data-id="${order.o_no}" style="padding:4px 8px; font-size:0.8rem; background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; cursor:pointer; border-radius:4px; margin-right:4px;">Cancel</button>
                    `;
                } else if (status === 'COMPLETED') {
                    actionButtons = `<span style="font-size:0.85rem; color:#16a34a; font-weight:600;">Fulfilled</span>`;
                } else {
                    actionButtons = `<span style="font-size:0.85rem; color:#94a3b8; font-style:italic;">${order.o_status}</span>`;
                }

                tr.innerHTML = `
                    <td><strong>#${order.o_no}</strong></td>
                    <td>${order.o_date}</td>
                    <td><span style="font-weight:600; color:#334155;">${order.o_custid}</span></td>
                    <td><small style="color:#64748b; font-weight:700;">${order.item_id || 'CUSTOM'}</small><br>${itemDescription}</td>
                    <td>${order.o_qty || 1} units</td>
                    <td><strong style="color:#0f172a;">₱${totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
                    <td><span class="badge-${status.toLowerCase().replace(' ', '-')}">${order.o_status}</span></td>
                    <td class="text-right" style="white-space:nowrap;">
                        ${actionButtons}
                        <button class="action-edit-btn" data-id="${order.o_no}" style="background:none; border:none; cursor:pointer; font-size:1rem; margin-left:4px;" title="Edit Order Details">✏️</button>
                        <button class="action-delete-btn" data-id="${order.o_no}" style="background:none; border:none; cursor:pointer; font-size:1rem; margin-left:4px;" title="Delete Permanently">🗑️</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            }
        });

        if (pendingCountEl) pendingCountEl.innerText = pendingCount;
        if (completedCountEl) completedCountEl.innerText = completedCount;
        if (totalPipelineValueEl) totalPipelineValueEl.innerText = `₱${aggregatePipelineValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    }

    // ==========================================
    // 3. ACTION EVENT DELEGATION PANEL (FIXED & EXPANDED)
    // ==========================================
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const orderId = e.target.closest('button')?.getAttribute('data-id');
            if (!orderId) return;

            let orders = JSON.parse(localStorage.getItem('order_table')) || [];
            let inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];
            const orderIndex = orders.findIndex(o => String(o.o_no).trim() === String(orderId).trim());
            
            if (orderIndex === -1) return;
            const targetOrder = orders[orderIndex];

            // --- APPROVE & PRICE PATHWAY ---
            if (e.target.closest('.action-approve-btn')) {
                const finalAmount = prompt(`Review Order #${targetOrder.o_no} (${targetOrder.o_custid})\n\nEnter total final billing price (₱) to approve:`, targetOrder.o_amount || "0.00");
                if (finalAmount === null) return; // Cancel click guard

                const parsedAmount = parseFloat(finalAmount);
                if (isNaN(parsedAmount) || parsedAmount < 0) {
                    alert("Please specify a valid financial amount valuation.");
                    return;
                }

                targetOrder.o_amount = parsedAmount;
                targetOrder.o_status = 'COMPLETED';
                
                localStorage.setItem('order_table', JSON.stringify(orders));
                renderOrdersBoard();
                alert(`Order #${orderId} approved and closed successfully!`);
                return;
            }

            // --- CANCEL PATHWAY WITH STOCK RESTORATION ---
            if (e.target.closest('.action-cancel-btn')) {
                if (!confirm(`Are you sure you want to decline/cancel order #${orderId}?`)) return;

                if (targetOrder.item_id) {
                    const warehouseItem = inventory.find(item => item.id === targetOrder.item_id);
                    if (warehouseItem) {
                        warehouseItem.stock = parseInt(warehouseItem.stock, 10) + (parseInt(targetOrder.o_qty, 10) || 0);
                        localStorage.setItem('inventory_table', JSON.stringify(inventory));
                    }
                }

                targetOrder.o_status = 'CANCELLED';
                localStorage.setItem('order_table', JSON.stringify(orders));
                renderOrdersBoard();
                return;
            }

            // --- EDIT DETAILS PATHWAY ---
            if (e.target.closest('.action-edit-btn')) {
                const updatedDetails = prompt(`Edit Details/Sizing for Order #${targetOrder.o_no}:`, targetOrder.o_details || targetOrder.item_id || '');
                if (updatedDetails === null) return;

                const updatedQty = prompt(`Update Quantity for Order #${targetOrder.o_no}:`, targetOrder.o_qty || '1');
                if (updatedQty === null) return;

                const parsedQty = parseInt(updatedQty, 10);
                if (isNaN(parsedQty) || parsedQty <= 0) {
                    alert("Invalid item quantity sequence entry.");
                    return;
                }

                targetOrder.o_details = updatedDetails.trim();
                targetOrder.o_qty = parsedQty;
                
                // Recalculate amount if it isn't an unpriced client submission
                if (parseFloat(targetOrder.o_amount) > 0) {
                    const originalUnitPrice = parseFloat(targetOrder.o_amount) / (parseInt(targetOrder.o_qty, 10) || 1);
                    targetOrder.o_amount = originalUnitPrice * parsedQty;
                }

                localStorage.setItem('order_table', JSON.stringify(orders));
                renderOrdersBoard();
                return;
            }

            // --- HARD PERMANENT DELETE PATHWAY ---
            if (e.target.closest('.action-delete-btn')) {
                if (!confirm(`⚠️ CRITICAL WARNING!\n\nAre you sure you want to PERMANENTLY ERASE Order #${orderId} from the database records? This action cannot be reversed.`)) return;

                orders.splice(orderIndex, 1); // Extract record block cleanly
                localStorage.setItem('order_table', JSON.stringify(orders));
                renderOrdersBoard();
                return;
            }
        });
    }

    // ==========================================
    // 4. FORM DROPDOWN GENERATORS & SUBMISSION
    // ==========================================
    function setupSkuDropdownOptions() {
        if (!skuSelect) return;
        const inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];
        skuSelect.innerHTML = '';

        if (inventory.length === 0) {
            skuSelect.innerHTML = `<option value="">No stock items found!</option>`;
            return;
        }

        inventory.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.innerText = `${item.id} - ${item.name} (Stock: ${item.stock})`;
            opt.dataset.baseCost = item.unit_cost || 0;
            skuSelect.appendChild(opt);
        });
        updateFormSubtotalPreview();
    }

    function updateFormSubtotalPreview() {
        if (!previewTotalEl) return;
        const qty = parseInt(quantityInput?.value, 10) || 0;
        const price = parseFloat(priceInput?.value) || 0;
        previewTotalEl.innerText = `₱${(qty * price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    }

    if (skuSelect) {
        skuSelect.addEventListener('change', () => {
            const selectedOption = skuSelect.options[skuSelect.selectedIndex];
            if (selectedOption && priceInput) {
                priceInput.value = parseFloat(selectedOption.dataset.baseCost || 0);
                updateFormSubtotalPreview();
            }
        });
    }

    if (quantityInput) quantityInput.addEventListener('input', updateFormSubtotalPreview);
    if (priceInput) priceInput.addEventListener('input', updateFormSubtotalPreview);

    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let orders = JSON.parse(localStorage.getItem('order_table')) || [];
            let inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];

            const selectedSku = skuSelect?.value;
            const inputQty = parseInt(quantityInput?.value, 10) || 0;
            const inputPrice = parseFloat(priceInput?.value) || 0;
            const customerEmailEl = document.getElementsByName('customer_email')[0] || document.getElementById('customer-email');
            const customerEmail = customerEmailEl ? customerEmailEl.value.trim() : 'walkin@swag.ph';

            if (selectedSku) {
                const warehouseItem = inventory.find(item => item.id === selectedSku);
                if (warehouseItem && warehouseItem.stock < inputQty) {
                    alert(`Insufficient Inventory Stock! Available: ${warehouseItem.stock}`);
                    return;
                }
                if (warehouseItem) {
                    warehouseItem.stock -= inputQty;
                    localStorage.setItem('inventory_table', JSON.stringify(inventory));
                }
            }

            const nextInvoiceNo = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.o_no, 10))) + 1 : 1001;

            const newOrder = {
                o_no: String(nextInvoiceNo).padStart(6, '0'),
                o_date: new Date().toLocaleDateString(),
                o_custid: customerEmail,
                item_id: selectedSku || 'CUSTOM',
                o_qty: inputQty,
                o_amount: inputQty * inputPrice,
                o_status: "COMPLETED"
            };

            orders.push(newOrder);
            localStorage.setItem('order_table', JSON.stringify(orders));

            orderForm.reset();
            if (orderModal) orderModal.style.display = 'none';
            renderOrdersBoard();
        });
    }

    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', () => {
            setupSkuDropdownOptions();
            if (quantityInput) quantityInput.value = 1;
            if (orderModal) orderModal.style.display = 'flex';
            updateFormSubtotalPreview();
        });
    }

    if (closeOrderModal) {
        closeOrderModal.addEventListener('click', () => {
            if (orderModal) orderModal.style.display = 'none';
        });
    }

    // Run layout board calculations on launch
    renderOrdersBoard();
});