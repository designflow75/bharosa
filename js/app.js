/**
 * ==============================================================================
 * BHAROSA — AI-Powered Freelance OS & Trust Platform
 * Full-Stack Client Controller & Real-Time Role-Enforced Router
 * ==============================================================================
 */

// Storage Keys
const SESSION_USER_KEY = 'bharosa_session_user';
const THEME_KEY = 'bharosa_theme';

// Application State
const appState = {
  currentUser: null, // { id, name, email, role, title, organization, avatar }
  currentRoute: window.location.pathname || '/',
  activeProjectId: null,
  activePwSubtab: 'overview',
  activeAdminSubtab: 'overview',
  pendingRevisionMilestoneId: null
};

// ==============================================================================
// 1. ROUTER & PERMISSIONS (CLIENT-SIDE ROUTE GUARD + SERVER-SIDE PERMISSION ENFORCEMENT)
// ==============================================================================

function getSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setSessionUser(user) {
  if (user) {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    appState.currentUser = user;
  } else {
    localStorage.removeItem(SESSION_USER_KEY);
    appState.currentUser = null;
  }
}

function navigateTo(path, pushState = true) {
  if (pushState && window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  appState.currentRoute = path;
  routeView(path);
}

window.addEventListener('popstate', () => {
  appState.currentRoute = window.location.pathname;
  routeView(window.location.pathname);
});

function routeView(pathname) {
  const user = getSessionUser();
  appState.currentUser = user;

  // If not logged in and not on login page, show auth
  if (!user && pathname !== '/' && pathname !== '/login') {
    showAuthScreen();
    return;
  }

  if (!user) {
    showAuthScreen();
    return;
  }

  // Parse path
  if (pathname === '/' || pathname === '/login') {
    // Redirect logged-in user to their role workspace
    if (user.role === 'freelancer') {
      navigateTo('/freelancer/dashboard');
    } else if (user.role === 'client') {
      navigateTo('/client/dashboard');
    } else if (user.role === 'admin') {
      navigateTo('/admin');
    }
    return;
  }

  // Check 403 Forbidden Access
  if (pathname.startsWith('/freelancer') && user.role !== 'freelancer' && user.role !== 'admin') {
    showForbiddenPage(`You are signed in as a Client (${user.name}). Accessing Freelancer workspaces (/freelancer/*) is forbidden.`);
    return;
  }

  if (pathname.startsWith('/client') && user.role !== 'client' && user.role !== 'admin') {
    showForbiddenPage(`You are signed in as a Freelancer (${user.name}). Accessing Client approvals and administrative portals (/client/*) is forbidden.`);
    return;
  }

  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    showForbiddenPage(`Super Admin Control Panel (/admin) is restricted to platform operators. Your role is '${user.role}'.`);
    return;
  }

  // Hide Auth and show App Shell
  hideAuthScreen();
  updateHeaderAndSidebar(user);

  // Route Views
  if (pathname.startsWith('/freelancer/dashboard') || pathname === '/freelancer') {
    showSection('view-freelancer-dashboard');
    loadFreelancerDashboard();
  } else if (pathname.startsWith('/client/dashboard') || pathname === '/client') {
    showSection('view-client-dashboard');
    loadClientDashboard();
  } else if (pathname.startsWith('/admin')) {
    showSection('view-admin');
    loadAdminDashboard();
  } else if (pathname.startsWith('/projects/')) {
    const projectId = pathname.split('/')[2];
    appState.activeProjectId = projectId;
    showSection('view-project-workspace');
    loadProjectWorkspace(projectId);
  } else if (pathname === '/403') {
    showSection('view-403');
  } else {
    // Default fallback
    if (user.role === 'freelancer') {
      navigateTo('/freelancer/dashboard');
    } else if (user.role === 'client') {
      navigateTo('/client/dashboard');
    } else {
      navigateTo('/admin');
    }
  }
}

function showAuthScreen() {
  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');
  if (authScreen) authScreen.style.display = 'flex';
  if (appShell) appShell.classList.remove('active');
}

function hideAuthScreen() {
  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');
  if (authScreen) authScreen.style.display = 'none';
  if (appShell) appShell.classList.add('active');
}

function showSection(sectionId) {
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
  }
  if (window.lucide) window.lucide.createIcons();
}

function showForbiddenPage(explanation) {
  hideAuthScreen();
  updateHeaderAndSidebar(appState.currentUser);
  showSection('view-403');
  const expEl = document.getElementById('forbidden-explanation');
  if (expEl && explanation) expEl.textContent = explanation;
  if (window.location.pathname !== '/403') {
    window.history.pushState({}, '', '/403');
  }
}

function navigateHome() {
  const user = getSessionUser();
  if (!user) {
    navigateTo('/login');
  } else if (user.role === 'freelancer') {
    navigateTo('/freelancer/dashboard');
  } else if (user.role === 'client') {
    navigateTo('/client/dashboard');
  } else {
    navigateTo('/admin');
  }
}

function navigateBack() {
  navigateHome();
}

// ==============================================================================
// 2. AUTHENTICATION ACTIONS & DEMO LOGINS
// ==============================================================================

async function demoLogin(role) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setSessionUser(data.user);
      showToast(`Signed in as ${data.user.name} (${data.user.role})`, 'success');
      navigateTo(data.redirectTo || (data.user.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'));
    } else {
      showToast(data.error || 'Failed to sign in', 'danger');
    }
  } catch (err) {
    console.error('Demo login error:', err);
    showToast('Login request failed', 'danger');
  }
}

async function handleCustomLogin(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('user-email')?.value;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setSessionUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      navigateTo(data.redirectTo);
    } else {
      showToast(data.error || 'User not found. Try priya@bharosa.design or rahul@growthnest.media', 'danger');
    }
  } catch (err) {
    showToast('Custom login failed', 'danger');
  }
}

function confirmLogout() {
  if (confirm('Sign out of Bharosa OS?')) {
    setSessionUser(null);
    navigateTo('/login');
    showToast('Signed out successfully.', 'info');
  }
}

function toggleCustomLoginForm() {
  const form = document.getElementById('custom-login-form-container');
  if (form) {
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
  }
}

// ==============================================================================
// 3. HEADER & SIDEBAR DYNAMIC ROLE RENDERING
// ==============================================================================

function updateHeaderAndSidebar(user) {
  if (!user) return;

  // Header profile badge
  const nameEl = document.getElementById('nav-user-name');
  const roleEl = document.getElementById('nav-user-role');
  const avatarEl = document.getElementById('nav-user-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.organization ? `${user.title} • ${user.organization}` : user.title;
  if (avatarEl) avatarEl.textContent = user.avatar || user.name.slice(0, 2).toUpperCase();

  // Sidebar header
  const suiteTitle = document.getElementById('sidebar-suite-title');
  const roleBadge = document.getElementById('sidebar-role-badge');
  if (suiteTitle) suiteTitle.textContent = `${user.role.toUpperCase()} SUITE`;
  if (roleBadge) roleBadge.textContent = user.role === 'freelancer' ? 'Freelancer' : (user.role === 'client' ? 'Client' : 'Admin');

  // Sidebar navigation links tailored to role
  const navContainer = document.getElementById('sidebar-nav-container');
  if (!navContainer) return;

  if (user.role === 'freelancer') {
    navContainer.innerHTML = `
      <div class="nav-section-label">Core Workspace</div>
      <a class="nav-item ${appState.currentRoute === '/freelancer/dashboard' ? 'active' : ''}" onclick="navigateTo('/freelancer/dashboard')">
        <span class="icon"><i data-lucide="layout-dashboard" style="width:18px;height:18px;"></i></span>
        <span>Dashboard</span>
      </a>
      <a class="nav-item ${appState.currentRoute === '/freelancer/projects' ? 'active' : ''}" onclick="navigateTo('/freelancer/dashboard')">
        <span class="icon"><i data-lucide="kanban-square" style="width:18px;height:18px;"></i></span>
        <span>Projects</span>
      </a>
      <a class="nav-item" onclick="openUrlImportModal()">
        <span class="icon"><i data-lucide="compass" style="width:18px;height:18px;"></i></span>
        <span>Opportunities</span>
        <span class="badge-count" style="background:var(--primary-light); color:var(--primary);">Demo</span>
      </a>
      <a class="nav-item" onclick="showToast('Invoicing ledger loaded with GST compliance fields.', 'info')">
        <span class="icon"><i data-lucide="receipt" style="width:18px;height:18px;"></i></span>
        <span>Invoices</span>
      </a>
      <div class="nav-section-label">Trust & Protection</div>
      <a class="nav-item" onclick="showToast('Evidence vault: All deliverable hashes recorded for integrity.', 'info')">
        <span class="icon"><i data-lucide="shield-alert" style="width:18px;height:18px;"></i></span>
        <span>Evidence Timeline</span>
      </a>
      <a class="nav-item" onclick="showToast('Direct client messaging channel active.', 'info')">
        <span class="icon"><i data-lucide="message-square" style="width:18px;height:18px;"></i></span>
        <span>Messages</span>
      </a>
      <a class="nav-item" onclick="showToast('Freelancer profile settings: Priya Sharma.', 'info')">
        <span class="icon"><i data-lucide="settings" style="width:18px;height:18px;"></i></span>
        <span>Settings</span>
      </a>
    `;
  } else if (user.role === 'client') {
    navContainer.innerHTML = `
      <div class="nav-section-label">Client Portal</div>
      <a class="nav-item ${appState.currentRoute === '/client/dashboard' ? 'active' : ''}" onclick="navigateTo('/client/dashboard')">
        <span class="icon"><i data-lucide="layout-dashboard" style="width:18px;height:18px;"></i></span>
        <span>Dashboard</span>
      </a>
      <a class="nav-item" onclick="navigateTo('/client/dashboard')">
        <span class="icon"><i data-lucide="folder" style="width:18px;height:18px;"></i></span>
        <span>Projects</span>
      </a>
      <a class="nav-item" onclick="scrollToApprovals()">
        <span class="icon"><i data-lucide="check-circle" style="width:18px;height:18px;"></i></span>
        <span>Approvals Queue</span>
      </a>
      <a class="nav-item" onclick="showToast('Client invoices: GST breakdowns available for accounting audits.', 'info')">
        <span class="icon"><i data-lucide="receipt" style="width:18px;height:18px;"></i></span>
        <span>Invoices</span>
      </a>
      <div class="nav-section-label">Contracts & Security</div>
      <a class="nav-item" onclick="showToast('All SOWs and approved scope amendments stored securely.', 'info')">
        <span class="icon"><i data-lucide="file-text" style="width:18px;height:18px;"></i></span>
        <span>Documents</span>
      </a>
      <a class="nav-item" onclick="showToast('Contractor communication channel active.', 'info')">
        <span class="icon"><i data-lucide="message-square" style="width:18px;height:18px;"></i></span>
        <span>Messages</span>
      </a>
      <a class="nav-item" onclick="showToast('Client organization settings: GrowthNest Media.', 'info')">
        <span class="icon"><i data-lucide="settings" style="width:18px;height:18px;"></i></span>
        <span>Settings</span>
      </a>
    `;
  } else if (user.role === 'admin') {
    navContainer.innerHTML = `
      <div class="nav-section-label">Platform Governance</div>
      <a class="nav-item active" onclick="navigateTo('/admin')">
        <span class="icon"><i data-lucide="shield-check" style="width:18px;height:18px;"></i></span>
        <span>Admin Dashboard</span>
      </a>
      <a class="nav-item" onclick="switchAdminSubtab('disputes')">
        <span class="icon"><i data-lucide="scale" style="width:18px;height:18px;"></i></span>
        <span>Dispute Center</span>
      </a>
      <a class="nav-item" onclick="switchAdminSubtab('audit')">
        <span class="icon"><i data-lucide="list" style="width:18px;height:18px;"></i></span>
        <span>Audit Logs</span>
      </a>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

function scrollToApprovals() {
  const el = document.getElementById('cl-approvals-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ==============================================================================
// 4. FREELANCER DASHBOARD CONTROLLER (/freelancer/dashboard)
// ==============================================================================

async function loadFreelancerDashboard() {
  const user = getSessionUser();
  if (!user) return;

  try {
    const res = await fetch('/api/freelancer/dashboard', {
      headers: { 'x-user-id': user.id }
    });

    if (res.status === 403) {
      showForbiddenPage('You do not have permission to view the Freelancer Dashboard.');
      return;
    }

    const data = await res.json();
    renderFreelancerDashboardUI(data);
  } catch (err) {
    console.error('Error loading freelancer dashboard:', err);
  }
}

function renderFreelancerDashboardUI(data) {
  const { overview, actionItems, alerts, projects } = data;

  // 1. Metric Cards (Strictly separate received, pending, projected income)
  const actProjEl = document.getElementById('fl-stat-active-projects');
  if (actProjEl) actProjEl.textContent = `${overview.activeProjectsCount} Active`;

  const nextDeadEl = document.getElementById('fl-stat-next-deadline');
  const nextProjTitle = document.getElementById('fl-stat-next-project-title');
  if (nextDeadEl && overview.nextDeadline) {
    const d = new Date(overview.nextDeadline.deadline);
    nextDeadEl.textContent = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (nextProjTitle) nextProjTitle.textContent = overview.nextDeadline.projectTitle;
  } else if (nextDeadEl) {
    nextDeadEl.textContent = 'None';
  }

  const pendingPayEl = document.getElementById('fl-stat-pending-payouts');
  if (pendingPayEl) pendingPayEl.textContent = `₹${overview.financials.pendingPayouts.toLocaleString('en-IN')}`;

  const recIncEl = document.getElementById('fl-stat-received-income');
  if (recIncEl) recIncEl.textContent = `₹${overview.financials.receivedIncome.toLocaleString('en-IN')}`;

  const projIncEl = document.getElementById('fl-projected-income-text');
  if (projIncEl) projIncEl.textContent = `₹${overview.financials.projectedIncome.toLocaleString('en-IN')} INR`;

  // 2. Needs Your Action Section
  const actionListEl = document.getElementById('fl-action-items-list');
  const actionCountEl = document.getElementById('fl-action-count-badge');
  if (actionCountEl) actionCountEl.textContent = `${actionItems.length} items`;

  if (actionListEl) {
    if (actionItems.length === 0) {
      actionListEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; padding:1rem;">All caught up! No urgent actions required right now.</div>`;
    } else {
      actionListEl.innerHTML = actionItems.map(item => `
        <div class="action-item-card">
          <div class="action-item-header">
            <div>
              <div class="action-item-title">${item.projectTitle}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${item.milestoneTitle}</div>
            </div>
            <span class="status-pill pending" style="font-size:0.68rem;">Action Required</span>
          </div>
          <div class="action-item-desc">${item.message}</div>
          <div class="action-item-footer">
            <span>Due: ${new Date(item.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
            <button class="btn-primary" style="font-size:0.74rem; padding:4px 10px;" onclick="navigateTo('/projects/${item.projectId}')">
              Open Workspace →
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // 3. Alerts: 72-Hour Client Silence & Possible Scope Change
  const alertsRow = document.getElementById('fl-alerts-row');
  if (alertsRow) {
    let html = '';
    alerts.forEach(a => {
      if (a.type === 'client_silence_watch') {
        html += `
          <div class="alert-banner silence">
            <div class="alert-icon-box"><i data-lucide="clock" style="width:22px;height:22px;color:var(--warning);"></i></div>
            <div class="alert-content">
              <h4>72-Hour Client Silence Protection Active</h4>
              <p>Milestone <strong>"${a.milestoneTitle}"</strong> is in review. If unanswered after 72 hours, send a polite reminder and propose a new schedule. Deadlines are never silently extended.</p>
              <div class="alert-actions">
                <button class="btn-tag" onclick="openSilenceReminderModal('${a.milestoneId}')">Send Reminder &amp; Propose Schedule</button>
              </div>
            </div>
          </div>
        `;
      } else if (a.type === 'possible_scope_change') {
        html += `
          <div class="alert-banner fairness">
            <div class="alert-icon-box"><i data-lucide="alert-triangle" style="width:22px;height:22px;color:var(--primary);"></i></div>
            <div class="alert-content">
              <h4>Possible Scope Change Detected</h4>
              <p>${a.message}</p>
              <div class="alert-actions">
                <button class="btn-tag" onclick="openScopeChangeModal('${a.milestoneId}')">Draft Scope Amendment (+₹6,500)</button>
              </div>
            </div>
          </div>
        `;
      }
    });
    alertsRow.innerHTML = html;
  }

  // 4. Projects Table
  const tableBody = document.getElementById('fl-projects-table-body');
  if (tableBody) {
    tableBody.innerHTML = projects.map(p => `
      <tr>
        <td>
          <div style="font-weight:700; color:var(--text-primary); cursor:pointer;" onclick="navigateTo('/projects/${p.id}')">${p.title}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${p.id}</div>
        </td>
        <td>
          <div style="font-weight:600;">${p.clientName}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${p.clientOrg}</div>
        </td>
        <td>
          <div style="font-size:0.8rem; font-weight:600;">${p.activeMilestone.title}</div>
        </td>
        <td>
          <span style="font-size:0.78rem;">${new Date(p.activeMilestone.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
        </td>
        <td>
          <strong>₹${p.activeMilestone.amount.toLocaleString('en-IN')}</strong>
        </td>
        <td>
          <span class="status-pill ${p.activeMilestone.status === 'Invoiced' ? 'paid' : 'pending'}" style="font-size:0.7rem;">
            ${p.activeMilestone.status}
          </span>
          <div style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;">Payment via provider (simulated)</div>
        </td>
        <td>
          <button class="btn-secondary" style="font-size:0.72rem; padding:4px 8px;" onclick="navigateTo('/projects/${p.id}')">
            Workspace
          </button>
        </td>
      </tr>
    `).join('');
  }

  if (window.lucide) window.lucide.createIcons();
}

// ==============================================================================
// 5. CLIENT DASHBOARD CONTROLLER (/client/dashboard)
// ==============================================================================

async function loadClientDashboard() {
  const user = getSessionUser();
  if (!user) return;

  try {
    const res = await fetch('/api/client/dashboard', {
      headers: { 'x-user-id': user.id }
    });

    if (res.status === 403) {
      showForbiddenPage('You do not have permission to view the Client Dashboard.');
      return;
    }

    const data = await res.json();
    renderClientDashboardUI(data);
  } catch (err) {
    console.error('Error loading client dashboard:', err);
  }
}

function renderClientDashboardUI(data) {
  const { overview, needsApproval, amendmentsRequiringApproval, projects, invoices, recentActivity } = data;

  // 1. Metric Cards (Committed vs Spent, Pending Approvals, Active Projects)
  const commEl = document.getElementById('cl-stat-committed');
  if (commEl) commEl.textContent = `₹${overview.budgetCommitted.toLocaleString('en-IN')}`;

  const spentEl = document.getElementById('cl-stat-spent');
  if (spentEl) spentEl.textContent = `₹${overview.budgetSpent.toLocaleString('en-IN')}`;

  const pendEl = document.getElementById('cl-stat-pending-count');
  if (pendEl) pendEl.textContent = String(overview.pendingApprovalsCount);

  const actProjEl = document.getElementById('cl-stat-active-projects');
  if (actProjEl) actProjEl.textContent = `${overview.activeProjectsCount} Active`;

  // 2. Needs Your Approval Queue
  const approvalListEl = document.getElementById('cl-approval-items-list');
  const countBadge = document.getElementById('cl-approval-count-badge');
  if (countBadge) countBadge.textContent = `${overview.pendingApprovalsCount} items`;

  if (approvalListEl) {
    if (needsApproval.length === 0 && amendmentsRequiringApproval.length === 0) {
      approvalListEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; padding:1rem;">All caught up! No deliverables or amendments pending approval.</div>`;
    } else {
      let html = '';

      // Deliverables to approve or revise
      needsApproval.forEach(item => {
        if (item.type === 'deliverable_approval') {
          html += `
            <div class="action-item-card" style="border-left: 3px solid var(--info);">
              <div class="action-item-header">
                <div>
                  <div class="action-item-title">${item.projectTitle}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${item.milestoneTitle} (₹${item.amount.toLocaleString('en-IN')})</div>
                </div>
                <span class="status-pill" style="background:var(--info-bg); color:var(--info); font-size:0.68rem;">Review Ready</span>
              </div>
              <div class="action-item-desc">
                ${item.deliverables?.length || 0} deliverable files uploaded by contractor. Revisions used: ${item.revisionsUsed} of ${item.revisionsAllowed}.
              </div>
              <div class="action-item-footer">
                <span style="color:var(--text-muted);">Due: ${new Date(item.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                <div style="display:flex; gap:0.4rem;">
                  <button class="btn-tag" style="color:var(--danger); border-color:var(--danger-border);" onclick="openRevisionRequestModal('${item.milestoneId}')">
                    Request Revision
                  </button>
                  <button class="btn-primary" style="font-size:0.74rem; padding:4px 10px;" onclick="clientApproveMilestone('${item.milestoneId}')">
                    Approve Deliverables
                  </button>
                </div>
              </div>
            </div>
          `;
        } else if (item.type === 'fund_milestone') {
          html += `
            <div class="action-item-card" style="border-left: 3px solid var(--warning);">
              <div class="action-item-header">
                <div>
                  <div class="action-item-title">${item.projectTitle}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${item.milestoneTitle}</div>
                </div>
                <span class="status-pill pending" style="font-size:0.68rem;">Funding Required</span>
              </div>
              <div class="action-item-desc">${item.message}</div>
              <div class="action-item-footer">
                <span>Amount: ₹${item.amount.toLocaleString('en-IN')}</span>
                <button class="btn-primary" style="font-size:0.74rem; padding:4px 10px;" onclick="clientFundMilestone('${item.milestoneId}')">
                  Fund Milestone
                </button>
              </div>
            </div>
          `;
        }
      });

      // Scope Amendments needing approval
      amendmentsRequiringApproval.forEach(amd => {
        html += `
          <div class="action-item-card" style="border-left: 3px solid var(--primary);">
            <div class="action-item-header">
              <div>
                <div class="action-item-title">Scope Amendment: ${amd.title}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">Requested by ${amd.requesterName} (+₹${amd.additionalCost} INR · +${amd.additionalDays} days)</div>
              </div>
              <span class="status-pill" style="background:var(--primary-light); color:var(--primary); font-size:0.68rem;">Amendment</span>
            </div>
            <div class="action-item-desc">${amd.description}</div>
            <div class="action-item-footer">
              <span style="font-size:0.72rem; color:var(--text-muted);">Contract updates upon approval</span>
              <button class="btn-primary" style="font-size:0.74rem; padding:4px 10px;" onclick="clientApproveAmendment('${amd.id}')">
                Approve Amendment
              </button>
            </div>
          </div>
        `;
      });

      approvalListEl.innerHTML = html;
    }
  }

  // 3. Project Cards
  const projGridEl = document.getElementById('cl-projects-grid');
  if (projGridEl) {
    projGridEl.innerHTML = projects.map(p => `
      <div class="cl-project-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary);">${p.title}</h4>
            <span class="brand-badge" style="font-size:0.68rem;">${p.progressPct}% Complete</span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">Contractor: <strong>${p.freelancerName}</strong></div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${p.progressPct}%;"></div>
          </div>
          <div style="margin-top:0.75rem; background:var(--bg-surface-elevated); padding:0.65rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Current Milestone</div>
            <div style="font-size:0.82rem; font-weight:600; color:var(--text-primary); margin-top:2px;">${p.currentMilestone.title}</div>
            <div style="display:flex; justify-content:space-between; font-size:0.74rem; color:var(--text-secondary); margin-top:4px;">
              <span>Responsible: <strong>${p.currentMilestone.responsibleParty}</strong></span>
              <span>Status: <strong style="color:var(--primary);">${p.currentMilestone.status}</strong></span>
            </div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:0.75rem; font-size:0.78rem;">
          <span>Spent: <strong>₹${p.spentBudget.toLocaleString('en-IN')}</strong> / ₹${p.totalBudget.toLocaleString('en-IN')}</span>
          <button class="btn-secondary" style="font-size:0.74rem; padding:4px 9px;" onclick="navigateTo('/projects/${p.id}')">
            Project Details →
          </button>
        </div>
      </div>
    `).join('');
  }

  // 4. Invoices
  const invListEl = document.getElementById('cl-invoices-list');
  if (invListEl) {
    invListEl.innerHTML = invoices.map(i => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.65rem 0; border-bottom:1px solid var(--border-subtle); font-size:0.8rem;">
        <div>
          <div style="font-weight:700;">${i.id} · ${i.milestoneTitle}</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">Base: ₹${i.baseAmount.toLocaleString('en-IN')} + 18% GST (₹${i.gstAmount.toLocaleString('en-IN')})</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800; color:var(--text-primary);">₹${i.totalAmount.toLocaleString('en-IN')}</div>
          <span class="status-pill ${i.status === 'paid' ? 'paid' : 'pending'}" style="font-size:0.65rem;">${i.status.toUpperCase()}</span>
        </div>
      </div>
    `).join('');
  }

  // 5. Activity Timeline
  const actTimelineEl = document.getElementById('cl-activity-timeline');
  if (actTimelineEl) {
    actTimelineEl.innerHTML = recentActivity.map(a => `
      <div style="display:flex; gap:8px; padding:0.6rem 0; border-bottom:1px solid var(--border-subtle); font-size:0.78rem;">
        <div style="font-size:1rem; line-height:1;">🛡️</div>
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between;">
            <strong style="color:var(--text-primary); font-size:0.8rem;">${a.action}</strong>
            <span style="font-size:0.68rem; color:var(--text-muted);">${new Date(a.timestamp).toLocaleDateString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
          </div>
          <div style="color:var(--text-secondary); margin-top:2px;">By: ${a.actorName} (${a.actorRole}) · ${a.reason}</div>
        </div>
      </div>
    `).join('');
  }

  if (window.lucide) window.lucide.createIcons();
}

// ==============================================================================
// 6. SHARED PROJECT WORKSPACE CONTROLLER (/projects/:id)
// ==============================================================================

async function loadProjectWorkspace(projectId) {
  const user = getSessionUser();
  if (!user) return;

  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: { 'x-user-id': user.id }
    });

    if (res.status === 403) {
      showForbiddenPage('You are not a participant in this project.');
      return;
    }

    const data = await res.json();
    renderProjectWorkspaceUI(data);
  } catch (err) {
    console.error('Error loading project workspace:', err);
  }
}

function renderProjectWorkspaceUI(data) {
  const { project, scopeAmendments, auditLogs, invoices, userRoleInProject } = data;
  const user = getSessionUser();

  // Header
  const titleEl = document.getElementById('pw-project-title');
  const metaEl = document.getElementById('pw-project-meta');
  if (titleEl) titleEl.textContent = project.title;
  if (metaEl) {
    metaEl.textContent = `Client: ${project.clientName} (${project.clientOrg}) · Contractor: ${project.freelancerName} · Budget: ₹${project.totalBudget.toLocaleString('en-IN')} INR · Role: ${userRoleInProject.toUpperCase()}`;
  }

  // Header Actions by Role
  const actionsEl = document.getElementById('pw-header-actions');
  if (actionsEl) {
    if (userRoleInProject === 'freelancer') {
      actionsEl.innerHTML = `
        <button class="btn-secondary" onclick="openScopeChangeModal()">
          <i data-lucide="plus" style="width:14px;height:14px;"></i>
          <span>Request Scope Amendment</span>
        </button>
        <button class="btn-primary" onclick="switchPwTab('milestones')">
          <i data-lucide="upload" style="width:14px;height:14px;"></i>
          <span>Submit Milestone Deliverable</span>
        </button>
      `;
    } else if (userRoleInProject === 'client') {
      actionsEl.innerHTML = `
        <button class="btn-secondary" onclick="openRaiseDisputeModal()">
          <i data-lucide="alert-triangle" style="width:14px;height:14px;"></i>
          <span>Raise Dispute</span>
        </button>
        <button class="btn-primary" onclick="switchPwTab('milestones')">
          <i data-lucide="check" style="width:14px;height:14px;"></i>
          <span>Review Milestones</span>
        </button>
      `;
    }
  }

  // Render Subtab Content
  renderPwSubtabContent(data);
  if (window.lucide) window.lucide.createIcons();
}

function switchPwTab(tabName) {
  appState.activePwSubtab = tabName;
  document.querySelectorAll('.admin-subnav-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`pw-tab-btn-${tabName}`);
  if (btn) btn.classList.add('active');

  if (appState.activeProjectId) {
    loadProjectWorkspace(appState.activeProjectId);
  }
}

function renderPwSubtabContent(data) {
  const container = document.getElementById('pw-subtab-content');
  if (!container) return;

  const { project, scopeAmendments, auditLogs, invoices, userRoleInProject } = data;
  const tab = appState.activePwSubtab;

  if (tab === 'overview') {
    container.innerHTML = `
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem;">
        <div>
          <h4 style="font-weight:700; margin-bottom:0.5rem;">Project Scope &amp; Deliverables</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">${project.description}</p>

          <h4 style="font-weight:700; margin-top:1.5rem; margin-bottom:0.75rem;">Milestone Schedule</h4>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Revisions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${project.milestones.map(m => `
                  <tr>
                    <td><strong>${m.title}</strong></td>
                    <td>₹${m.amount.toLocaleString('en-IN')}</td>
                    <td><span class="status-pill ${m.status === 'Invoiced' ? 'paid' : 'pending'}">${m.status}</span></td>
                    <td>${m.revisionsUsed || 0} / ${m.revisionsAllowed}</td>
                    <td>
                      ${userRoleInProject === 'client' && (m.status === 'In review' || m.status === 'Submitted') ?
                        `<button class="btn-primary" style="font-size:0.72rem; padding:3px 8px;" onclick="clientApproveMilestone('${m.id}')">Approve</button>` :
                        (userRoleInProject === 'freelancer' && m.status === 'In progress' ?
                          `<button class="btn-primary" style="font-size:0.72rem; padding:3px 8px;" onclick="freelancerSubmitDeliverable('${m.id}')">Submit Files</button>` :
                          `<span style="font-size:0.72rem; color:var(--text-muted);">-</span>`
                        )
                      }
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Financial Status</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--text-primary); margin:6px 0;">₹${project.totalBudget.toLocaleString('en-IN')} INR</div>
            <div style="font-size:0.78rem; color:var(--text-secondary);">Spent: ₹${project.spentBudget.toLocaleString('en-IN')} · Remaining: ₹${(project.totalBudget - project.spentBudget).toLocaleString('en-IN')}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:8px;">Payment via provider (simulated in demo)</div>
          </div>
        </div>
      </div>
    `;
  } else if (tab === 'milestones') {
    container.innerHTML = `
      <h4 style="font-weight:700; margin-bottom:1rem;">All Project Milestones &amp; State Machine Transitions</h4>
      <div style="display:flex; flex-direction:column; gap:1rem;">
        ${project.milestones.map(m => `
          <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; font-size:0.95rem;">${m.title}</div>
              <div style="font-size:0.78rem; color:var(--text-muted);">Amount: ₹${m.amount.toLocaleString('en-IN')} · Status: <strong style="color:var(--primary);">${m.status}</strong> · Deadline: ${new Date(m.deadline).toLocaleDateString('en-IN')}</div>
            </div>
            <div style="display:flex; gap:0.5rem;">
              ${userRoleInProject === 'client' && (m.status === 'In review' || m.status === 'Submitted') ?
                `<button class="btn-tag" style="color:var(--danger);" onclick="openRevisionRequestModal('${m.id}')">Request Revision</button>
                 <button class="btn-primary" style="font-size:0.74rem;" onclick="clientApproveMilestone('${m.id}')">Approve &amp; Release</button>` : ''
              }
              ${userRoleInProject === 'client' && m.status === 'Agreed' ?
                `<button class="btn-primary" style="font-size:0.74rem;" onclick="clientFundMilestone('${m.id}')">Fund Milestone</button>` : ''
              }
              ${userRoleInProject === 'freelancer' && m.status === 'In progress' ?
                `<button class="btn-primary" style="font-size:0.74rem;" onclick="freelancerSubmitDeliverable('${m.id}')">Submit Deliverable Files</button>` : ''
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'evidence') {
    container.innerHTML = `
      <h4 style="font-weight:700; margin-bottom:1rem;">Append-Only Integrity Audit Log</h4>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Reason</th>
              <th>SHA-256 Hash</th>
            </tr>
          </thead>
          <tbody>
            ${auditLogs.map(a => `
              <tr>
                <td><span style="font-family:monospace; font-size:0.75rem;">${new Date(a.timestamp).toLocaleString('en-IN')}</span></td>
                <td><strong>${a.actorName}</strong> (${a.actorRole})</td>
                <td><strong style="color:var(--primary);">${a.action}</strong></td>
                <td>${a.reason}</td>
                <td><code style="font-size:0.72rem;">${a.evidenceHash || 'verified'}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem; color:var(--text-muted);">
        Tab <strong>${tab}</strong> is active for project ${project.id}. Real-time synchronization enabled.
      </div>
    `;
  }
}

// ==============================================================================
// 7. BACKEND WORKFLOW TRANSITIONS
// ==============================================================================

async function clientApproveMilestone(milestoneId) {
  const user = getSessionUser();
  if (!user) return;

  try {
    const res = await fetch(`/api/milestones/${milestoneId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        action: 'APPROVE_MILESTONE',
        reason: 'Client reviewed and verified deliverables against contractual SOW specifications.'
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Milestone approved! Funds released via simulated payment provider. Draft invoice created.', 'success');
      if (appState.activeProjectId) loadProjectWorkspace(appState.activeProjectId);
      if (appState.currentRoute.includes('/client')) loadClientDashboard();
    } else {
      showToast(data.error || 'Approval rejected by server state machine.', 'danger');
    }
  } catch (err) {
    showToast('Failed to approve milestone', 'danger');
  }
}

async function clientFundMilestone(milestoneId) {
  const user = getSessionUser();
  if (!user) return;

  try {
    const res = await fetch(`/api/milestones/${milestoneId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        action: 'FUND_MILESTONE',
        reason: 'Client funded milestone into simulated provider vault.'
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Milestone funded! Contractor may now begin work.', 'success');
      if (appState.activeProjectId) loadProjectWorkspace(appState.activeProjectId);
      if (appState.currentRoute.includes('/client')) loadClientDashboard();
    } else {
      showToast(data.error || 'Failed to fund milestone', 'danger');
    }
  } catch (err) {
    showToast('Funding failed', 'danger');
  }
}

async function freelancerSubmitDeliverable(milestoneId) {
  const user = getSessionUser();
  if (!user) return;

  try {
    const res = await fetch(`/api/milestones/${milestoneId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        action: 'SUBMIT_DELIVERABLES',
        reason: 'Delivered revised assets and prototype tokens.',
        deliverableFiles: [
          { name: 'Handoff_Release_v3.fig', hash: Math.random().toString(36).substring(2, 18), size: '12.4 MB' }
        ]
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Deliverables submitted for client review. 72-hour review clock started.', 'success');
      if (appState.activeProjectId) loadProjectWorkspace(appState.activeProjectId);
      if (appState.currentRoute.includes('/freelancer')) loadFreelancerDashboard();
    } else {
      showToast(data.error || 'Submission failed', 'danger');
    }
  } catch (err) {
    showToast('Deliverable submission failed', 'danger');
  }
}

function openRevisionRequestModal(milestoneId) {
  appState.pendingRevisionMilestoneId = milestoneId;
  const modal = document.getElementById('modal-revision-request');
  if (modal) modal.classList.add('active');
}

async function submitRevisionRequest() {
  const user = getSessionUser();
  const reason = document.getElementById('revision-reason-input')?.value;
  const milestoneId = appState.pendingRevisionMilestoneId;

  if (!reason || reason.trim().length === 0) {
    showToast('A specific reason is required when requesting revisions.', 'warning');
    return;
  }

  try {
    const res = await fetch(`/api/milestones/${milestoneId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        action: 'REQUEST_REVISION',
        reason: reason.trim()
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Revision request recorded. Quota updated.', 'info');
      closeModal('modal-revision-request');
      if (appState.activeProjectId) loadProjectWorkspace(appState.activeProjectId);
      if (appState.currentRoute.includes('/client')) loadClientDashboard();
    } else {
      showToast(data.error || 'Revision request failed', 'danger');
    }
  } catch (err) {
    showToast('Failed to record revision request', 'danger');
  }
}

function openScopeChangeModal(milestoneId = 'MS-102') {
  appState.pendingRevisionMilestoneId = milestoneId;
  const modal = document.getElementById('modal-scope-change');
  if (modal) modal.classList.add('active');
}

async function submitScopeAmendment() {
  const user = getSessionUser();
  const title = document.getElementById('scope-title-input')?.value;
  const description = document.getElementById('scope-desc-input')?.value;
  const additionalCost = document.getElementById('scope-cost-input')?.value;
  const additionalDays = document.getElementById('scope-days-input')?.value;
  const milestoneId = appState.pendingRevisionMilestoneId || 'MS-102';

  try {
    const res = await fetch(`/api/milestones/${milestoneId}/scope-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({ title, description, additionalCost, additionalDays })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Scope amendment drafted. Contract will update ONLY after client approval.', 'success');
      closeModal('modal-scope-change');
      if (appState.activeProjectId) loadProjectWorkspace(appState.activeProjectId);
      if (appState.currentRoute.includes('/freelancer')) loadFreelancerDashboard();
    } else {
      showToast(data.error || 'Failed to draft amendment', 'danger');
    }
  } catch (err) {
    showToast('Failed to submit amendment', 'danger');
  }
}

async function clientApproveAmendment(amendmentId) {
  const user = getSessionUser();
  try {
    const res = await fetch(`/api/scope-amendments/${amendmentId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      }
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Scope amendment approved! Contract budget and timeline updated.', 'success');
      if (appState.activeProjectId) loadProjectWorkspace(appState.activeProjectId);
      if (appState.currentRoute.includes('/client')) loadClientDashboard();
    } else {
      showToast(data.error || 'Failed to approve amendment', 'danger');
    }
  } catch (err) {
    showToast('Approval failed', 'danger');
  }
}

function openSilenceReminderModal(milestoneId) {
  appState.pendingRevisionMilestoneId = milestoneId;
  const modal = document.getElementById('modal-silence-reminder');
  if (modal) modal.classList.add('active');
}

async function submitSilenceReminder() {
  const user = getSessionUser();
  const proposedSchedule = document.getElementById('silence-schedule-input')?.value;
  const milestoneId = appState.pendingRevisionMilestoneId || 'MS-102';

  try {
    const res = await fetch(`/api/milestones/${milestoneId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        action: 'SEND_SILENCE_REMINDER',
        proposedSchedule
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast('Polite reminder dispatched with proposed schedule. No silent extensions.', 'info');
      closeModal('modal-silence-reminder');
    } else {
      showToast(data.error || 'Failed to send silence reminder', 'danger');
    }
  } catch (err) {
    showToast('Reminder request failed', 'danger');
  }
}

// ==============================================================================
// 8. ADMIN DASHBOARD CONTROLLER (/admin)
// ==============================================================================

async function loadAdminDashboard() {
  const user = getSessionUser();
  if (!user || user.role !== 'admin') {
    showForbiddenPage('Super Admin area requires platform administrator privileges.');
    return;
  }

  try {
    const res = await fetch('/api/audit-logs', {
      headers: { 'x-user-id': user.id }
    });
    const data = await res.json();
    const tbody = document.getElementById('adm-audit-table-body');
    const countEl = document.getElementById('adm-audit-count');
    if (countEl) countEl.textContent = String(data.auditLogs.length);

    if (tbody) {
      tbody.innerHTML = data.auditLogs.map(l => `
        <tr>
          <td><span style="font-family:monospace; font-size:0.75rem;">${new Date(l.timestamp).toLocaleString('en-IN')}</span></td>
          <td><strong>${l.actorName}</strong> (${l.actorRole})</td>
          <td>${l.projectId || 'N/A'}</td>
          <td><strong style="color:var(--primary);">${l.action}</strong></td>
          <td>${l.reason}</td>
          <td><code style="font-size:0.7rem;">${l.evidenceHash || 'verified'}</code></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading admin audit logs:', err);
  }
}

function switchAdminSubtab(tab) {
  appState.activeAdminSubtab = tab;
  loadAdminDashboard();
}

// ==============================================================================
// 9. MODALS & TOAST UTILITIES
// ==============================================================================

function openUrlImportModal() {
  const m = document.getElementById('modal-url-import');
  if (m) m.classList.add('active');
}

function simulateJobImport() {
  closeModal('modal-url-import');
  showToast('Sample job data extracted and converted into milestone brief draft.', 'success');
}

function openNewProjectBriefModal() {
  showToast('AI Project Assistant: Turn messages into structured SOWs and milestones.', 'info');
}

function openCreateInvoiceModal() {
  showToast('Invoices are auto-drafted with GST when milestones are approved.', 'info');
}

function openCreateProjectModal() {
  showToast('Create Project wizard opened (Sample data in demo).', 'info');
}

function openInviteFreelancerModal() {
  showToast('Invite link generated for freelancer onboarding.', 'info');
}

function openRaiseDisputeModal() {
  alert('Dispute Protocol: A dispute gathers the contract, submissions, feedback and messages, summarizes both sides neutrally, and submits to a human arbiter. AI never decides outcomes or releases funds.');
}

function openRequestRefundModal() {
  showToast('Refund request logged for milestone escrow review.', 'info');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function toggleNotificationPanel() {
  const p = document.getElementById('notification-panel');
  if (p) p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

function markAllNotifsRead() {
  const badge = document.getElementById('notif-count-badge');
  if (badge) badge.style.display = 'none';
  showToast('All notifications marked as read', 'info');
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);

  const label = document.getElementById('theme-label');
  if (label) label.textContent = next === 'dark' ? 'Dark' : 'Light';
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const label = document.getElementById('theme-label');
  if (label) label.textContent = saved === 'dark' ? 'Dark' : 'Light';
}

function handleGlobalSearch(e) {
  // Simple filter helper
}

// Global modal dismiss
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// App Initialization on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  routeView(window.location.pathname);
});
