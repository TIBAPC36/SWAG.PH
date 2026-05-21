/**
 * SWAGPH - Enterprise Resource Planning (ERP) Order Controller
 * Coordinates order desk transactions and handles inventory allocation limits
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Authorization Gate Check
    const session = JSON.parse(localStorage.getItem('swag_session'));
    if (!session || session.role !== 'ADMIN') {
        window.location.href = "login.html";
        return;
    }

    // 2. Initialize Seed Order Registry Database if completely empty
    if (!localStorage.getItem('order_table')) {
        const initialOrders = [
            { o_no: "1001", o_date: new Date().toLocaleDateString(), o_custid: "client.star@design.com", item_id: "INV-001", o_qty: 15, o_amount: 2475.00, o_status: "COMPLETED" },
            { o_no: "1002", o_date: new Date().toLocaleDateString(), o_custid: "merieh.gold@ops.ph", item_id: "INV-003", o_qty: 5, o_amount: 2100.00, o_status: "PENDING" }
        ];
        localStorage.setItem('order_table', JSON.stringify(initialOrders));
    }

    // DOM Target Bindings
    const tableBody = document.getElementById('orders-table-body');
    const orderModal = document.getElementById('order-modal');
    const addOrderBtn = document.getElementById('add-order-btn');
    const closeOrderModal = document.getElementById('close-order-modal');
    const orderForm = document.getElementById('order-form');
    const skuSelect = document.getElementById('modal-sku-select');
    
    // Form Realtime Calculation Inputs
    const quantityInput = document.getElementById('modal-quantity-input');
    const priceInput = document.getElementById('modal-price-input');
    const previewTotalEl = document.getElementById('invoice-preview-total');

    // Metrics Dashboard UI Elements
    const pendingCountEl = document.getElementById('pending-orders-count');
    const completedCountEl = document.getElementById('completed-orders-count');
    const totalPipelineValueEl = document.getElementById('order-pipeline-value');

    // --- PIPELINE METRICS & RENDER ENGINE ---
    function renderOrdersBoard() {
        const orders = JSON.parse(localStorage.getItem('order_table')) || [];
        const inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];
        
        tableBody.innerHTML = '';
        
        let pendingCount = 0;
        let completedCount = 0;
        let aggregatePipelineValue = 0;

        orders.forEach(order => {
            const totalValue = parseFloat(order.o_amount || 0);
            aggregatePipelineValue += totalValue;

            if (order.o_status === 'PENDING') pendingCount++;
            if (order.o_status === 'COMPLETED') completedCount++;

            // Track item description names relative to source inventory table identifiers
            const correspondingItem = inventory.find(i => i.id === order.item_id);
            const itemName = correspondingItem ? correspondingItem.name : "Unknown SKU Asset";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${order.o_no}</strong></td>
                <td>${order.o_date}</td>
                <td><span style="font-weight:600; color:#334155;">${order.o_custid}</span></td>
                <td><small style="color:#64748b; font-weight:700;">${order.item_id}</small><br>${itemName}</td>
                <td>${order.o_qty} units</td>
                <td><strong>₱${totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
                <td><span class="badge-${order.o_status.toLowerCase()}">${order.o_status}</span></td>
                <td class="text-right">
                    ${order.o_status === 'PENDING' ? `
                        <button class="btn-secondary action-complete-btn" data-id="${order.o_no}" style="padding:4px 8px; font-size:0.8rem; background:#dcfce7; color:#15803d; border-color:#bbf7d0;">Mark Fulfilled</button>
                        <button class="btn-secondary action-cancel-btn" data-id="${order.o_no}" style="padding:4px 8px; font-size:0.8rem; background:#fee2e2; color:#b91c1c; border-color:#fecaca;">Cancel</button>
                    ` : `<span style="font-size:0.85rem; color:#94a3b8; font-style:italic;">No Actions</span>`}
                </td>
            `;
            tableBody.appendChild(tr);
        });

        if (pendingCountEl) pendingCountEl.innerText = pendingCount;
        if (completedCountEl) completedCountEl.innerText = completedCount;
        if (totalPipelineValueEl) totalPipelineValueEl.innerText = `₱${aggregatePipelineValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

        attachOrderActionListeners();
    }

    // --- INTER-MODULE DROPDOWN SYNC ENGINE ---
    function setupSkuDropdownOptions() {
        const inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];
        skuSelect.innerHTML = '';

        if (inventory.length === 0) {
            skuSelect.innerHTML = `<option value="">No inventory items registered!</option>`;
            return;
        }

        inventory.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            // Display cost and stock directly inside dropdown option frame text
            opt.innerText = `${item.id} - ${item.name} (Stock: ${item.stock} | Base Cost: ₱${item.unit_cost})`;
            opt.dataset.baseCost = item.unit_cost;
            skuSelect.appendChild(opt);
        });

        updateFormSubtotalPreview();
    }

    // --- FORM SUBTOTAL CALCULATION LOGIC ---
    function updateFormSubtotalPreview() {
        const qty = parseInt(quantityInput.value, 10) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const subtotal = qty * price;
        previewTotalEl.innerText = `₱${subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    }

    skuSelect.addEventListener('change', () => {
        const selectedOption = skuSelect.options[skuSelect.selectedIndex];
        if (selectedOption) {
            priceInput.value = parseFloat(selectedOption.dataset.baseCost || 0);
            updateFormSubtotalPreview();
        }
    });

    quantityInput.addEventListener('input', updateFormSubtotalPreview);
    priceInput.addEventListener('input', updateFormSubtotalPreview);

    // --- FULFILLMENT STATE TRANSITION LISTENERS ---
    function attachOrderActionListeners() {
        document.querySelectorAll('.action-complete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-id');
                let orders = JSON.parse(localStorage.getItem('order_table')) || [];
                const order = orders.find(o => o.o_no === orderId);

                if (order) {
                    order.o_status = 'COMPLETED';
                    localStorage.setItem('order_table', JSON.stringify(orders));
                    renderOrdersBoard();
                }
            });
        });

        document.querySelectorAll('.action-cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-id');
                let orders = JSON.parse(localStorage.getItem('order_table')) || [];
                const order = orders.find(o => o.o_no === orderId);

                if (order) {
                    order.o_status = 'CANCELLED';
                    localStorage.setItem('order_table', JSON.stringify(orders));
                    renderOrdersBoard();
                }
            });
        });
    }

    // --- SUBMIT BOOK NEW INVOICE ORDER ---
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let orders = JSON.parse(localStorage.getItem('order_table')) || [];
        let inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];

        const selectedSku = skuSelect.value;
        const inputQty = parseInt(quantityInput.value, 10) || 0;
        const inputPrice = parseFloat(priceInput.value) || 0;

        // Inventory safety cross check verification
        const warehouseItem = inventory.find(item => item.id === selectedSku);
        if (warehouseItem && warehouseItem.stock < inputQty) {
            alert(`Insufficient Inventory Asset Allocation Stock!\nRequested: ${inputQty} units\nAvailable in warehouse: ${warehouseItem.stock} units.`);
            return;
        }

        // Deduct raw items stock from warehouse array store allocation
        if (warehouseItem) {
            warehouseItem.stock -= inputQty;
            warehouseItem.last_updated = new Date().toLocaleDateString();
            localStorage.setItem('inventory_table', JSON.stringify(inventory));
        }

        const nextInvoiceNo = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.o_no))) + 1 : 1001;

        const newOrder = {
            o_no: String(nextInvoiceNo),
            o_date: new Date().toLocaleDateString(),
            o_custid: document.getElementsByName('customer_email')[0].value.trim(),
            item_id: selectedSku,
            o_qty: inputQty,
            o_amount: inputQty * inputPrice,
            o_status: "PENDING"
        };

        orders.push(newOrder);
        localStorage.setItem('order_table', JSON.stringify(orders));

        orderForm.reset();
        orderModal.style.display = 'none';
        renderOrdersBoard();
    });

    // --- ACTION DIALOG MODAL DISPLAY LISTENERS ---
    addOrderBtn.addEventListener('click', () => {
        setupSkuDropdownOptions();
        
        // Populate form fields with initial default item data options
        const firstOpt = skuSelect.options[0];
        if (firstOpt) {
            priceInput.value = parseFloat(firstOpt.dataset.baseCost || 0);
        }
        quantityInput.value = 1;
        
        orderModal.style.display = 'flex';
        updateFormSubtotalPreview();
    });

    closeOrderModal.addEventListener('click', () => orderModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) orderModal.style.display = 'none';
    });

    // Run layout board calculations on launch
    renderOrdersBoard();
});