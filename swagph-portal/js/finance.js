/**
 * SWAGPH - Enterprise Resource Planning (ERP) Finance Controller
 * Interlocks sales invoices and operational expenses to map overall cash flows
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Authorization Gate Check
    const session = JSON.parse(localStorage.getItem('swag_session'));
    if (!session || session.role !== 'ADMIN') {
        window.location.href = "login.html";
        return;
    }

    // 2. Initialize Seed Operating Expenses Database if completely empty
    if (!localStorage.getItem('expense_table')) {
        const initialExpenses = [
            { id: "EXP-001", date: new Date().toLocaleDateString(), description: "Workshop Monthly Electricity & Power Utility", category: "Overhead", amount: 4850.00 },
            { id: "EXP-002", date: new Date().toLocaleDateString(), description: "Social Media Advertisement Marketing Batch Runs", category: "Marketing", amount: 2500.00 }
        ];
        localStorage.setItem('expense_table', JSON.stringify(initialExpenses));
    }

    // DOM Target Bindings
    const tableBody = document.getElementById('finance-table-body');
    const expenseModal = document.getElementById('expense-modal');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const closeExpenseModal = document.getElementById('close-expense-modal');
    const expenseForm = document.getElementById('expense-form');

    // Financial Metrics UI Targets
    const revenueEl = document.getElementById('total-revenue');
    const expensesEl = document.getElementById('total-expenses');
    const profitEl = document.getElementById('net-profit');

    // --- CORE FINANCIAL STATEMENT CONSOLIDATOR ---
    function renderFinanceLedger() {
        // Retrieve records from database tables
        const orders = JSON.parse(localStorage.getItem('order_table')) || [];
        const expenses = JSON.parse(localStorage.getItem('expense_table')) || [];
        
        let grossRevenue = 0;
        let totalExpenses = 0;
        let ledgerEntries = [];

        // 1. Process Order Inflow Metrics Pipeline
        orders.forEach(order => {
            const orderValue = parseFloat(order.o_amount || 0);
            grossRevenue += orderValue;

            ledgerEntries.push({
                refId: `REV-${order.o_no}`,
                date: order.o_date,
                description: `Invoice Fulfillment Payment (Client ID: ${order.o_custid})`,
                type: 'INCOME',
                value: orderValue
            });
        });

        // 2. Process Operations Outflow Metrics Pipeline
        expenses.forEach(exp => {
            const expenseValue = parseFloat(exp.amount || 0);
            totalExpenses += expenseValue;

            ledgerEntries.push({
                refId: exp.id,
                date: exp.date,
                description: `[${exp.category}] ${exp.description}`,
                type: 'EXPENSE',
                value: expenseValue
            });
        });

        // 3. Sort Ledger Chronologically (Most Recent Postings on Top)
        ledgerEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Clear and Draw Ledger Rows
        tableBody.innerHTML = '';
        
        if (ledgerEntries.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">No transaction entries found in this ledger period.</td></tr>`;
        }

        ledgerEntries.forEach(entry => {
            const isIncome = entry.type === 'INCOME';
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td><small style="font-family: monospace; font-weight:700; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${entry.refId}</small></td>
                <td>${entry.date}</td>
                <td style="color: #334155; font-weight: 500;">${entry.description}</td>
                <td><span class="${isIncome ? 'badge-income' : 'badge-expense'}">${entry.type}</span></td>
                <td class="text-right ${isIncome ? 'ledger-inflow' : 'ledger-outflow'}">
                    ${isIncome ? '+' : '-'}₱${entry.value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Calculate Final Profit and Update Metric Interfaces
        const netProfit = grossRevenue - totalExpenses;

        if (revenueEl) revenueEl.innerText = `₱${grossRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        if (expensesEl) expensesEl.innerText = `₱${totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        if (profitEl) {
            profitEl.innerText = `₱${netProfit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
            // Color target shift depending on positive return status
            profitEl.style.color = netProfit >= 0 ? '#16a34a' : '#dc2626';
        }
    }

    // --- MANUAL OPERATION EXPENSE POSTING HANDLER ---
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let expenses = JSON.parse(localStorage.getItem('expense_table')) || [];
        
        // Automated entry code counter sequences
        const nextIdNumber = expenses.length + 1;
        const generatedExpId = `EXP-${String(nextIdNumber).padStart(3, '0')}`;

        const formData = new FormData(expenseForm);
        const newExpense = {
            id: generatedExpId,
            date: new Date().toLocaleDateString(),
            description: formData.get('description').trim(),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')) || 0
        };

        expenses.push(newExpense);
        localStorage.setItem('expense_table', JSON.stringify(expenses));

        expenseForm.reset();
        expenseModal.style.display = 'none';
        renderFinanceLedger();
    });

    // --- MODAL BACKDROP LAYER TOGGLE LISTENERS ---
    addExpenseBtn.addEventListener('click', () => expenseModal.style.display = 'flex');
    closeExpenseModal.addEventListener('click', () => expenseModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === expenseModal) expenseModal.style.display = 'none';
    });

    // Fire Initial Array Calculations Execution
    renderFinanceLedger();
});