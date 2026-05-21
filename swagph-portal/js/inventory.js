/**
 * Project Inventory Controller - SWAGPH Portal
 * Handles production raw material tracking, inventory valuation, intakes, and item removals.
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // SESSION AUTHORIZATION
    // =========================
    const session = JSON.parse(localStorage.getItem('swag_session'));

    if (!session || session.role !== 'ADMIN') {
        window.location.href = "login.html";
        return;
    }

    // =========================
    // INITIALIZE DATABASE
    // =========================
    if (!localStorage.getItem('inventory_table')) {
        localStorage.setItem('inventory_table', JSON.stringify([]));
    }

    // =========================
    // DOM ELEMENTS
    // =========================
    const tableBody = document.getElementById('inventory-table-body');
    const stockModal = document.getElementById('stock-modal');
    const addStockBtn = document.getElementById('add-stock-btn');
    const closeStockModal = document.getElementById('close-stock-modal');
    const inventoryForm = document.getElementById('inventory-form');

    // Metrics
    const totalSkusEl = document.getElementById('total-skus-count');
    const valuationEl = document.getElementById('total-valuation');

    // =========================
    // RENDER INVENTORY TABLE
    // =========================
    function renderInventoryBoard() {
        const inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];
        tableBody.innerHTML = '';

        let totalSKUs = inventory.length;
        let totalAssetValuation = 0;

        // Empty State
        if (inventory.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:30px; color:#64748b; font-style:italic;">
                        No materials registered in inventory.
                    </td>
                </tr>
            `;
        }

        // Render Rows
        inventory.forEach(item => {
            const itemTotalValue = parseFloat(item.stock || 0) * parseFloat(item.unit_cost || 0);
            totalAssetValuation += itemTotalValue;

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>
                    <strong>${item.id}</strong>
                </td>
                <td>
                    <strong>${item.name}</strong><br>
                    <small style="color:#64748b;">
                        Updated: ${item.last_updated || 'N/A'}
                    </small>
                </td>
                <td>
                    <span class="badge-neutral">
                        ${item.category}
                    </span>
                </td>
                <td>
                    <span style="font-weight:700; color:#2d3436;">
                        ${item.stock} units
                    </span>
                </td>
                <td>
                    ₱${parseFloat(item.unit_cost || 0).toFixed(2)}
                </td>
                <td>
                    <strong>
                        ₱${itemTotalValue.toLocaleString('en-PH', {
                            minimumFractionDigits: 2
                        })}
                    </strong>
                </td>
                <td class="text-right" style="white-space:nowrap;">
                    <button
                        type="button"
                        class="btn-secondary restock-btn"
                        data-id="${item.id}"
                        style="padding:6px 12px; font-size:0.85rem; cursor:pointer; margin-right:5px;"
                    >
                        Restock
                    </button>
                    <button
                        type="button"
                        class="delete-btn"
                        data-id="${item.id}"
                        style="color:#e74c3c; background:none; border:none; font-size:1.1rem; cursor:pointer; padding:4px 8px;"
                        title="Delete Item"
                    >
                        🗑️
                    </button>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Update Panel Metrics
        if (totalSkusEl) {
            totalSkusEl.innerText = totalSKUs;
        }

        if (valuationEl) {
            valuationEl.innerText = `₱${totalAssetValuation.toLocaleString('en-PH', {
                minimumFractionDigits: 2
            })}`;
        }
    }

    // =========================
    // EVENT DELEGATION
    // =========================
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {

            // --- RESTOCK BUTTON TRIGGER ---
            const restockBtn = e.target.closest('.restock-btn');
            if (restockBtn) {
                const skuId = restockBtn.dataset.id;
                let inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];
                const itemIndex = inventory.findIndex(item => item.id === skuId);

                if (itemIndex === -1) {
                    alert('Item not found.');
                    return;
                }

                const qty = prompt(
                    `Restock Item: ${inventory[itemIndex].name}\nEnter quantity to add:`,
                    "50"
                );

                if (qty === null) return; // Action cancelled

                const parsedQty = parseInt(qty, 10);
                if (isNaN(parsedQty) || parsedQty <= 0) {
                    alert('Please enter a valid positive quantity.');
                    return;
                }

                inventory[itemIndex].stock = parseInt(inventory[itemIndex].stock, 10) + parsedQty;
                inventory[itemIndex].last_updated = new Date().toLocaleDateString();

                localStorage.setItem('inventory_table', JSON.stringify(inventory));
                renderInventoryBoard();
                return;
            }

            // --- DELETE BUTTON TRIGGER ---
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const skuId = deleteBtn.dataset.id;
                let inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];
                const targetItem = inventory.find(item => item.id === skuId);

                if (!targetItem) {
                    alert('Item not found.');
                    return;
                }

                const confirmed = confirm(
                    `Are you sure you want to delete:\n\n${targetItem.name} (${targetItem.id}) ?`
                );

                if (!confirmed) return; // Action cancelled

                inventory = inventory.filter(item => item.id !== skuId);
                localStorage.setItem('inventory_table', JSON.stringify(inventory));
                renderInventoryBoard();
                return;
            }
        });
    }

    // =========================
    // REGISTER NEW INVENTORY ITEM
    // =========================
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let inventory = JSON.parse(localStorage.getItem('inventory_table')) || [];

            // Generate Serialized SKU Key IDs
            let nextIdNumber = 1;
            if (inventory.length > 0) {
                const ids = inventory
                    .map(item => item.id ? parseInt(item.id.replace('INV-', ''), 10) : NaN)
                    .filter(num => !isNaN(num));

                if (ids.length > 0) {
                    nextIdNumber = Math.max(...ids) + 1;
                }
            }

            const generatedSku = `INV-${String(nextIdNumber).padStart(3, '0')}`;
            const formData = new FormData(inventoryForm);

            const newItem = {
                id: generatedSku,
                name: formData.get('name').trim(),
                category: formData.get('category'),
                stock: parseInt(formData.get('stock'), 10) || 0,
                unit_cost: parseFloat(formData.get('unit_cost')) || 0,
                last_updated: new Date().toLocaleDateString()
            };

            inventory.push(newItem);
            localStorage.setItem('inventory_table', JSON.stringify(inventory));

            inventoryForm.reset();

            if (stockModal) {
                stockModal.style.display = 'none';
            }

            renderInventoryBoard();
        });
    }

    // =========================
    // MODAL CONTROL INTERACTION
    // =========================
    if (addStockBtn) {
        addStockBtn.addEventListener('click', () => {
            stockModal.style.display = 'flex';
        });
    }

    if (closeStockModal) {
        closeStockModal.addEventListener('click', () => {
            stockModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === stockModal) {
            stockModal.style.display = 'none';
        }
    });

    // Initial Board Render Trigger
    renderInventoryBoard();
});