// js/dashboard.js
// SWAGPH - Central Workspace Dashboard Controller

// ==========================================
// 1. SESSION & ROUTE PROTECTION
// ==========================================
function verifySession() {
  const sessionData = localStorage.getItem('swag_session');
  if (!sessionData) {
    window.location.href = 'login.html'; // 👈 Redirects safely to your login window
    return null;
  }
  return JSON.parse(sessionData);
}

const userSession = verifySession();

// ==========================================
// 2. DASHBOARD DATA SERVICE (Future Aggregation API)
// ==========================================
const DashboardService = {
  // Aggregates cross-module KPIs from local data stores safely matching actual table schemas
  getSystemMetrics() {
    // 1. Calculate Active Orders (MAPPED: order_table & o_status)
    const rawOrders = localStorage.getItem('order_table');
    const orders = rawOrders ? JSON.parse(rawOrders) : [];
    const activeOrdersCount = orders.filter(o => o.o_status === 'PENDING').length;

    // 2. Calculate Gross Income Pipeline (MAPPED: order_table & o_amount)
    const grossRevenue = orders.reduce((sum, o) => sum + parseFloat(o.o_amount || 0), 0);

    // 3. Calculate Low Stock Items Alert Count (MAPPED: inventory_table, stock & min_required)
    const rawInventory = localStorage.getItem('inventory_table');
    const items = rawInventory ? JSON.parse(rawInventory) : [];
    const lowStockAlertsCount = items.filter(i => {
      const currentStock = parseInt(i.stock, 10) || 0;
      const criticalLimit = parseInt(i.min_required, 10) || 0;
      return currentStock <= criticalLimit;
    }).length;

    return {
      activeOrders: activeOrdersCount || 0,
      monthlyRevenue: grossRevenue || 0,
      pendingSuppliers: lowStockAlertsCount || 0
    };
  },

  // Retrieves global operational system logs
  getWorkspaceTimeline() {
    const rawLogs = localStorage.getItem('swag_audit_logs');
    return rawLogs ? JSON.parse(rawLogs) : [
      { timestamp: new Date().toLocaleTimeString(), user: 'System', action: 'Workspace environment ready.' }
    ];
  }
};

// ==========================================
// 3. UI RENDERING CONTROLLER
// ==========================================
const DashboardDOM = {
  welcomeText: document.getElementById('welcome-partner'),
  dateDisplay: document.getElementById('current-date'),
  statOrders: document.getElementById('stat-active-orders'),
  statRevenue: document.getElementById('stat-monthly-revenue'),
  statSuppliers: document.getElementById('stat-pending-suppliers'),
  timelineFeed: document.getElementById('activity-timeline-feed'),
  searchBar: document.getElementById('order-search'),

  init() {
    this.renderPersonalization();
    this.renderDateTime();
    this.renderMetrics();
    this.renderTimeline();
    this.setupInteractions();
  },

  renderPersonalization() {
    if (this.welcomeText && userSession) {
      this.welcomeText.textContent = `Welcome back, ${userSession.name}`;
    }
  },

  renderDateTime() {
    if (this.dateDisplay) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      this.dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }
  },

  renderMetrics() {
    const stats = DashboardService.getSystemMetrics();

    if (this.statOrders) this.statOrders.textContent = stats.activeOrders;
    if (this.statSuppliers) this.statSuppliers.textContent = stats.pendingSuppliers;
    
    if (this.statRevenue) {
      // Format to crisp Philippine Peso standard matching your local platform rules
      this.statRevenue.textContent = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2
      }).format(stats.monthlyRevenue);
    }
  },

  renderTimeline() {
    if (!this.timelineFeed) return;

    const logs = DashboardService.getWorkspaceTimeline();
    this.timelineFeed.innerHTML = '';

    if (logs.length === 0) {
      this.timelineFeed.innerHTML = '<div class="activity-placeholder-text" style="padding:15px; color:#64748b; font-style:italic;">No active operational logs found.</div>';
      return;
    }

    // Pull the latest 5 activities to keep the home dashboard light and responsive
    logs.slice(0, 5).forEach(log => {
      const logItem = document.createElement('div');
      logItem.style.cssText = 'padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem;';
      logItem.innerHTML = `
        <span style="color: #64748b; font-size: 0.85rem; display: block; margin-bottom: 2px;">${log.timestamp}</span>
        <strong>${log.user}</strong> — <span style="color: #334155;">${log.action}</span>
      `;
      this.timelineFeed.appendChild(logItem);
    });
  },

  setupInteractions() {
    // Global Logout flow configuration
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('swag_session');
        window.location.href = 'login.html'; // 👈 Sends user out securely to login panel
      });
    }

    // Dynamic Search Field Proxy Hook
    if (this.searchBar) {
      this.searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = this.searchBar.value.trim();
          if (query) {
            // Forward search parameters directly into the order tracking view
            window.location.href = `order.html?search=${encodeURIComponent(query)}`;
          }
        }
      });
    }
  }
};

// Initialize only when route clearance criteria met
if (userSession) {
  document.addEventListener('DOMContentLoaded', () => DashboardDOM.init());
}