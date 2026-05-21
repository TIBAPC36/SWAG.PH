// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderStaff();
    setupEventListeners();
    setCurrentDateDisplay();
    renderSecurityLogs(); // Load audit logs initially
});

function setupEventListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const confirmLogout = confirm("Are you sure you want to log out of the Admin Portal?");
            if (confirmLogout) {
                addLog("Admin session terminated.");
                localStorage.removeItem('swag_session'); // Syncs key targeting with home login states
                
                logoutBtn.innerText = "Logging out...";
                logoutBtn.style.color = "#e74c3c";

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 800);
            }
        });
    }
}

// --- STAFF MANAGEMENT ---
function toggleModal(show) {
    const modal = document.getElementById('teamModal');
    if (modal) modal.style.display = show ? 'flex' : 'none';
}

function addStaffMember() {
    const name = document.getElementById('staff-name').value;
    const email = document.getElementById('staff-email').value;
    const role = document.getElementById('staff-role').value;

    if (!name || !email) return alert("Please fill in all fields.");

    const staff = JSON.parse(localStorage.getItem('swag_staff')) || [];
    const newMember = { id: Date.now(), name, email, role };
    
    staff.push(newMember);
    localStorage.setItem('swag_staff', JSON.stringify(staff));
    
    addLog(`Added new team member: ${name} (${role})`);
    toggleModal(false);
    renderStaff();
    
    document.getElementById('staff-name').value = '';
    document.getElementById('staff-email').value = '';
}

function deleteStaff(id) {
    let staff = JSON.parse(localStorage.getItem('swag_staff')) || [];
    staff = staff.filter(s => s.id !== id);
    localStorage.setItem('swag_staff', JSON.stringify(staff));
    addLog("Removed a staff member.");
    renderStaff();
}

function renderStaff() {
    const staff = JSON.parse(localStorage.getItem('swag_staff')) || [];
    const tableBody = document.getElementById('staff-table-body');
    const msg = document.getElementById('no-staff-msg');

    if (!tableBody) return;

    const ownerRow = `
        <tr>
            <td style="padding: 12px 0;"><strong>Admin User</strong></td>
            <td>admin@swagph.com</td>
            <td><span class="badge purple" style="background:#f3e8ff; color:#7e22ce; padding:4px 8px; border-radius:4px;">Owner</span></td>
            <td><span style="color: #2ecc71;">● Active</span></td>
            <td style="text-align: right; padding-right:10px;">-</td>
        </tr>`;

    const staffRows = staff.map(s => `
        <tr>
            <td style="padding: 12px 0;"><strong>${s.name}</strong></td>
            <td>${s.email}</td>
            <td><span class="badge blue" style="background:#dbeafe; color:#1d4ed8; padding:4px 8px; border-radius:4px;">${s.role}</span></td>
            <td><span style="color: #2ecc71;">● Active</span></td>
            <td style="text-align: right; padding-right:10px;">
                <button onclick="deleteStaff(${s.id})" class="delete-btn" style="background:none; border:none; color:#ef4444; font-size:1.2rem; cursor:pointer;">&times;</button>
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = ownerRow + staffRows;
    if (msg) msg.style.display = staff.length === 0 ? 'block' : 'none';
}

// --- LOGGING SYSTEM ---
function addLog(message) {
    const logs = JSON.parse(localStorage.getItem('swag_logs')) || [];
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    logs.unshift({ time, message });
    localStorage.setItem('swag_logs', JSON.stringify(logs.slice(0, 8))); 
    renderSecurityLogs();
}

function renderSecurityLogs() {
    const logContainer = document.getElementById('security-logs');
    const logs = JSON.parse(localStorage.getItem('swag_logs')) || [
        { time: "System", message: "Dashboard initialized." }
    ];
    
    if (!logContainer) return;

    logContainer.innerHTML = logs.map(log => `
        <div style="display: flex; gap: 20px; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
            <span class="text-muted" style="min-width: 80px; color: #64748b;">${log.time}</span>
            <span style="color: #334155;">${log.message}</span>
        </div>
    `).join('');
}

function setCurrentDateDisplay() {
    const currentDateEl = document.getElementById('current-date');
    if (currentDateEl) {
        currentDateEl.innerText = new Date().toLocaleDateString('en-PH', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}