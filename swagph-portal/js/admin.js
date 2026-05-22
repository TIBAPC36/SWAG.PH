// --- SWAGPH - Admin Controls Dashboard Control Engine (Backend Synchronized) ---

// ==========================================
// 1. ROUTE GUARD / SECURITY ZONE
// ==========================================
function checkAdminAuth() {
  const sessionData = localStorage.getItem('swag_session');
  if (!sessionData) {
    window.location.href = 'login.html'; // 👈 Redirect straight to login portal
    return null;
  }

  const currentSession = JSON.parse(sessionData);
  if (!currentSession || currentSession.role !== 'ADMIN') {
    alert('Access Denied: Administrative privileges required.');
    window.location.href = 'login.html'; // 👈 Force eject unauthorized views
    return null;
  }
  return currentSession;
}

// Check session safely at initialization
const activeSession = checkAdminAuth();

// ==========================================
// 2. ADMIN DATA SERVICE (Database Schema Synchronized)
// ==========================================
const AdminService = {
  // Fetches team users, parsing variables to match the live SQL schema
  getStaffMembers() {
    const rawUsers = localStorage.getItem('user_table');
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    // Safety check: Make sure users is always an array before filtering
    if (!Array.isArray(users)) return [];
    // Keeps system admin records safely isolated from removal lists
    return users.filter(user => user && user.user_id !== 'ADM001');
  },

  // Persists a new team member using correct database keys
  saveStaffMember(newMember) {
    const rawUsers = localStorage.getItem('user_table');
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    users.push(newMember);
    localStorage.setItem('user_table', JSON.stringify(users));
    this.logAction(`Added new team member: ${newMember.full_name} (${newMember.role})`);
  },

  // Deletes a team member by matching database ID layout
  deleteStaffMember(userId) {
    const rawUsers = localStorage.getItem('user_table');
    let users = rawUsers ? JSON.parse(rawUsers) : [];
    const targetUser = users.find(u => u.user_id === userId);
    
    if (targetUser) {
      users = users.filter(u => u.user_id !== userId);
      localStorage.setItem('user_table', JSON.stringify(users));
      this.logAction(`Removed team member: ${targetUser.full_name}`);
    }
  },

  // Appends a system action to the log history
  logAction(actionText) {
    const rawLogs = localStorage.getItem('swag_audit_logs');
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    
    const newLog = {
      timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
      user: activeSession ? (activeSession.name || activeSession.email || 'Admin') : 'System',
      action: actionText
    };
    
    logs.unshift(newLog); // Put latest event at top
    localStorage.setItem('swag_audit_logs', JSON.stringify(logs));
  }
};

// ==========================================
// 3. UI RENDERING CONTROLLER
// ==========================================
const DOM = {
  tableBody: document.getElementById('staff-table-body'),
  noStaffMsg: document.getElementById('no-staff-msg'),
  modal: document.getElementById('teamModal'),
  logContainer: document.getElementById('security-logs'),
  dateDisplay: document.getElementById('current-date'),

  init() {
    this.renderDate();
    this.renderStaffTable();
    this.renderAuditLogs();
    this.setupLogout();
  },

  renderDate() {
    if (this.dateDisplay) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      this.dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }
  },

  renderStaffTable() {
    if (!this.tableBody) return;
    
    const staff = AdminService.getStaffMembers();
    this.tableBody.innerHTML = '';

    if (staff.length === 0) {
      if (this.noStaffMsg) this.noStaffMsg.style.display = 'block';
      return;
    }

    if (this.noStaffMsg) this.noStaffMsg.style.display = 'none';
    staff.forEach(member => {
      if (!member) return;

      // 👈 CRITICAL CRASH FIX: Default to 'STAFF' if role is blank or undefined
      const verifiedRole = member.role || 'STAFF';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding: 12px 0; font-weight: 500;">${member.full_name || 'Unnamed Staff'}</td>
        <td>${member.email || 'No Email Added'}</td>
        <td><span class="badge badge-${verifiedRole.toLowerCase().replace(' ', '-')}">${verifiedRole}</span></td>
        <td><span style="color: #2ecc71; font-weight: 600;">● Active</span></td>
        <td style="text-align: right; padding-right: 10px;">
          <button onclick="removeMember('${member.user_id}')" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-weight: 500;">Remove</button>
        </td>
      `;
      this.tableBody.appendChild(row);
    });
  },

  renderAuditLogs() {
    if (!this.logContainer) return;

    const rawLogs = localStorage.getItem('swag_audit_logs');
    const logs = rawLogs ? JSON.parse(rawLogs) : [
      { timestamp: 'Initialization', user: 'System', action: 'Audit engine online.' }
    ];

    this.logContainer.innerHTML = logs.map(log => `
      <div style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; display: flex; justify-content: space-between;">
        <span><strong>[${log.timestamp}]</strong> ${log.user || 'System'}: ${log.action || 'No logged action details'}</span>
      </div>
    `).join('');
  },

  setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('swag_session');
        alert('Logged out successfully.');
        window.location.href = 'login.html'; // 👈 Consistently clear to login layout
      });
    }
  }
};

// ==========================================
// 4. GLOBAL BINDINGS (Maps Inline HTML Onclicks)
// ==========================================
window.toggleModal = function(show) {
  if (DOM.modal) {
    DOM.modal.style.display = show ? 'flex' : 'none';
  }
};

window.addStaffMember = function() {
  const nameInput = document.getElementById('staff-name');
  const emailInput = document.getElementById('staff-email');
  const roleSelect = document.getElementById('staff-role');

  if (!nameInput || !emailInput || !roleSelect) return;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const role = roleSelect.value;

  if (!name || !email) {
    alert('Please fill out all fields.');
    return;
  }

  // Generate structured unique ID matching server properties
  const uniqueId = 'STF' + Math.floor(1000 + Math.random() * 9000);

  const newMember = {
    user_id: uniqueId,            // 👈 Schema Match
    full_name: name,              // 👈 Schema Match
    email: email,                 // 👈 Schema Match
    password_hash: 'TempPass123!',// 👈 Schema Match
    role: (role || 'STAFF').toUpperCase(), // 👈 Schema Match & Casing Normalization
    created_at: new Date().toLocaleDateString()
  };

  AdminService.saveStaffMember(newMember);
  
  // Reset input fields safely
  nameInput.value = '';
  emailInput.value = '';
  window.toggleModal(false);

  // Refresh user interface
  DOM.renderStaffTable();
  DOM.renderAuditLogs();
};

window.removeMember = function(userId) {
  if (confirm('Are you sure you want to remove access rights for this team member?')) {
    AdminService.deleteStaffMember(userId);
    DOM.renderStaffTable();
    DOM.renderAuditLogs();
  }
};

// ==========================================
// 5. SAFE SYSTEM INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // We double-check the auth rule inside the load state so the DOM variables aren't skipped
  if (activeSession) {
    DOM.init();
  }
});