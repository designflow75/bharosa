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
  if (pathname === '/freelancer/find-work') {
    showSection('view-freelancer-find-work');
    loadOpportunities();
  } else if (pathname === '/freelancer/submit-work') {
    showSection('view-freelancer-submit-work');
    loadSubmitWork();
  } else if (pathname === '/freelancer/messages') {
    showSection('view-freelancer-messages');
    loadFreelancerMessages();
  } else if (pathname.startsWith('/freelancer/dashboard') || pathname === '/freelancer') {
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
      <a class="nav-item ${appState.currentRoute === '/freelancer/find-work' ? 'active' : ''}" onclick="navigateTo('/freelancer/find-work')">
        <span class="icon"><i data-lucide="compass" style="width:18px;height:18px;"></i></span>
        <span>Find Work</span>
        <span class="badge-count" style="background:var(--success-bg); color:var(--success);">New</span>
      </a>
      <a class="nav-item ${appState.currentRoute === '/freelancer/submit-work' ? 'active' : ''}" onclick="navigateTo('/freelancer/submit-work')">
        <span class="icon"><i data-lucide="upload-cloud" style="width:18px;height:18px;"></i></span>
        <span>Submit Work</span>
      </a>
      <a class="nav-item ${appState.currentRoute === '/freelancer/messages' ? 'active' : ''}" onclick="navigateTo('/freelancer/messages')">
        <span class="icon"><i data-lucide="message-square" style="width:18px;height:18px;"></i></span>
        <span>Messages</span>
      </a>
      <div class="nav-section-label">Trust & Finance</div>
      <a class="nav-item" onclick="navigateTo('/freelancer/dashboard')">
        <span class="icon"><i data-lucide="kanban-square" style="width:18px;height:18px;"></i></span>
        <span>Projects</span>
      </a>
      <a class="nav-item" onclick="navigateTo('/freelancer/dashboard')">
        <span class="icon"><i data-lucide="receipt" style="width:18px;height:18px;"></i></span>
        <span>Invoices</span>
      </a>
      <a class="nav-item" onclick="navigateTo('/freelancer/dashboard')">
        <span class="icon"><i data-lucide="shield-alert" style="width:18px;height:18px;"></i></span>
        <span>Evidence Timeline</span>
      </a>
      <a class="nav-item" onclick="showToast('Profile settings — Coming soon', 'info')">
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
            <div style="display:flex; gap:6px;">
              <button class="btn-primary" style="font-size:0.74rem; padding:4px 10px;" onclick="navigateTo('/freelancer/submit-work')">
                Submit Work
              </button>
              <button class="btn-secondary" style="font-size:0.74rem; padding:4px 10px;" onclick="navigateTo('/projects/${item.projectId}')">
                Workspace →
              </button>
            </div>
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

// Mobile Menu Toggle
function toggleMobileSidebar(force) {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;
  const shouldOpen = typeof force === 'boolean' ? force : !sidebar.classList.contains('mobile-open');
  if (shouldOpen) {
    sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }
}

// Close mobile sidebar on route navigation
const originalNavigateTo = navigateTo;
window.navigateTo = function(path, pushState = true) {
  toggleMobileSidebar(false);
  originalNavigateTo(path, pushState);
};

// ==============================================================================
// OPPORTUNITIES CONTROLLER (FIND WORK)
// ==============================================================================

async function loadOpportunities() {
  const user = getSessionUser();
  if (!user) return;

  const container = document.getElementById('opportunities-list');
  const emptyEl = document.getElementById('opportunities-empty');
  if (!container) return;

  container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Loading available opportunities...</div>`;

  try {
    const res = await fetch('/api/opportunities', {
      headers: { 'x-user-id': user.id }
    });
    if (!res.ok) throw new Error('Failed to fetch opportunities');
    const data = await res.json();
    const opps = data.opportunities || [];

    if (opps.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    container.innerHTML = opps.map(opp => `
      <div class="card-section" style="display:flex; flex-direction:column; justify-content:space-between; border-left: 3px solid var(--primary); transition:transform 0.2s, box-shadow 0.2s;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
            <div>
              <span class="brand-badge" style="background:var(--primary-light); color:var(--primary); font-size:0.7rem; font-weight:700;">${opp.clientOrg}</span>
              <h3 style="margin-top:0.4rem; font-size:1.1rem; color:var(--text-primary);">${opp.title}</h3>
              <p style="font-size:0.78rem; color:var(--text-muted);">Posted by ${opp.clientName} • Verified Client</p>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.2rem; font-weight:800; color:var(--success);">₹${opp.totalBudget.toLocaleString('en-IN')}</div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Fixed Budget</span>
            </div>
          </div>

          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1rem;">${opp.description}</p>

          <!-- Milestone Preview Breakdown -->
          <div style="background:var(--bg-surface-elevated); border-radius:var(--radius-md); padding:0.75rem; margin-bottom:1rem; border:1px solid var(--border-subtle);">
            <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.5rem; letter-spacing:0.05em;">
              Milestone Breakdown (${opp.milestonesPreview ? opp.milestonesPreview.length : 0} Phases)
            </div>
            ${(opp.milestonesPreview || []).map((m, idx) => `
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding:4px 0; ${idx > 0 ? 'border-top:1px dashed var(--border-subtle);' : ''}">
                <span style="color:var(--text-secondary);"><strong style="color:var(--text-primary);">M${idx + 1}:</strong> ${m.title}</span>
                <span style="font-weight:600; color:var(--text-primary);">₹${m.amount.toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>

          <!-- Tags -->
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:1.25rem;">
            <span class="btn-tag" style="font-size:0.7rem; background:rgba(99,102,241,0.08); color:var(--primary);"><i data-lucide="shield" style="width:12px;height:12px;margin-right:3px;"></i> Escrow Protected</span>
            <span class="btn-tag" style="font-size:0.7rem;">Milestone Locked</span>
            <span class="btn-tag" style="font-size:0.7rem;">GST Compliant</span>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.75rem; border-top:1px solid var(--border-subtle);">
          <span style="font-size:0.78rem; color:var(--text-muted);"><i data-lucide="clock" style="width:13px;height:13px;vertical-align:-2px;"></i> Est. 3-4 Weeks</span>
          <button class="btn-primary" onclick="acceptOpportunity('${opp.id}')" id="btn-accept-${opp.id}" style="padding:0.5rem 1rem; font-size:0.82rem;">
            <i data-lucide="check" style="width:14px;height:14px;"></i>
            <span>Accept &amp; Begin Work</span>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('Error loading opportunities:', err);
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:var(--danger);">Error loading opportunities. Please try again.</div>`;
  }
}

async function acceptOpportunity(oppId) {
  const user = getSessionUser();
  if (!user) return;

  const btn = document.getElementById(`btn-accept-${oppId}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Accepting...</span>`;
  }

  try {
    const res = await fetch(`/api/opportunities/${oppId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Opportunity accepted! New project workspace created.', 'success');
      navigateTo(`/projects/${data.project.id}`);
    } else {
      showToast(data.error || 'Failed to accept opportunity', 'danger');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;"></i><span>Accept &amp; Begin Work</span>`;
      }
    }
  } catch (err) {
    console.error('Error accepting opportunity:', err);
    showToast('Failed to accept opportunity', 'danger');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;"></i><span>Accept &amp; Begin Work</span>`;
    }
  }
}

// ==============================================================================
// SUBMIT WORK CONTROLLER
// ==============================================================================

const submitWorkState = {
  projects: [],
  selectedProjectId: null,
  selectedMilestoneId: null,
  attachedFiles: []
};

async function loadSubmitWork() {
  const user = getSessionUser();
  if (!user) return;

  resetSubmitWorkUI();

  const selector = document.getElementById('sw-project-milestone-selector');
  if (!selector) return;

  selector.innerHTML = `<div style="color:var(--text-muted); padding:1rem; text-align:center;">Loading active milestones...</div>`;

  try {
    const res = await fetch('/api/projects', {
      headers: { 'x-user-id': user.id }
    });
    if (!res.ok) throw new Error('Failed to load projects');
    const data = await res.json();
    const projects = (data.projects || []).filter(p => p.freelancerId === user.id);
    submitWorkState.projects = projects;

    if (projects.length === 0) {
      selector.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--text-muted);">
          <p style="margin-bottom:1rem;">You don't have any active projects yet.</p>
          <button class="btn-primary" onclick="navigateTo('/freelancer/find-work')">Find Work Opportunities</button>
        </div>
      `;
      return;
    }

    let html = `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1rem;">`;
    projects.forEach(project => {
      const activeMilestones = (project.milestones || []).filter(m => ['Agreed', 'In progress', 'Revision requested'].includes(m.status));
      html += `
        <div class="card-section" style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
            <h4 style="color:var(--text-primary); font-size:0.95rem;">${project.title}</h4>
            <span class="brand-badge" style="font-size:0.68rem;">${project.clientOrg}</span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
            Budget: ₹${project.totalBudget.toLocaleString('en-IN')} • Client: ${project.clientName}
          </div>
          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.4rem;">
            Select Milestone to Submit:
          </div>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${activeMilestones.length === 0 ? `
              <span style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">All current milestones completed or in review.</span>
            ` : activeMilestones.map(m => `
              <div onclick="selectMilestoneForSubmission('${project.id}', '${m.id}')" id="sw-ms-card-${m.id}" style="padding:0.6rem 0.75rem; border:1px solid var(--border-subtle); border-radius:var(--radius-md); background:var(--bg-surface); cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;">
                <div>
                  <div style="font-weight:600; font-size:0.84rem; color:var(--text-primary);">${m.title}</div>
                  <span class="status-pill ${m.status === 'Revision requested' ? 'warning' : 'in-progress'}" style="font-size:0.65rem;">${m.status}</span>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700; color:var(--success); font-size:0.84rem;">₹${m.amount.toLocaleString('en-IN')}</div>
                  <span style="font-size:0.68rem; color:var(--primary); font-weight:600;">Click to select →</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    html += `</div>`;
    selector.innerHTML = html;

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('Error loading submit work projects:', err);
    selector.innerHTML = `<div style="color:var(--danger); padding:1rem;">Failed to load projects.</div>`;
  }
}

function selectMilestoneForSubmission(projectId, milestoneId) {
  submitWorkState.selectedProjectId = projectId;
  submitWorkState.selectedMilestoneId = milestoneId;

  // Highlight selected card
  document.querySelectorAll('[id^="sw-ms-card-"]').forEach(el => {
    el.style.borderColor = 'var(--border-subtle)';
    el.style.background = 'var(--bg-surface)';
  });
  const selectedEl = document.getElementById(`sw-ms-card-${milestoneId}`);
  if (selectedEl) {
    selectedEl.style.borderColor = 'var(--primary)';
    selectedEl.style.background = 'var(--primary-light)';
  }

  // Show Step 2
  const step2 = document.getElementById('sw-step-2');
  if (step2) {
    step2.style.display = 'block';
    step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function handleSubmitWorkFiles(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  const mockDeliverables = files.map(f => {
    const mockHash = 'sha256-' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    return {
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
      type: f.name.split('.').pop().toUpperCase(),
      hash: mockHash,
      uploadedAt: new Date().toISOString()
    };
  });

  submitWorkState.attachedFiles = [...submitWorkState.attachedFiles, ...mockDeliverables];
  renderAttachedFilesList();
  updateSubmitWorkSummary();
}

function renderAttachedFilesList() {
  const fileListEl = document.getElementById('sw-file-list');
  if (!fileListEl) return;

  if (submitWorkState.attachedFiles.length === 0) {
    fileListEl.innerHTML = '';
    return;
  }

  fileListEl.innerHTML = `
    <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.5rem;">
      Attached Files (${submitWorkState.attachedFiles.length})
    </div>
    <div style="display:flex; flex-direction:column; gap:0.4rem;">
      ${submitWorkState.attachedFiles.map((f, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.75rem; background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); font-size:0.8rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="file-check" style="width:16px;height:16px;color:var(--success);"></i>
            <div>
              <span style="font-weight:600; color:var(--text-primary);">${f.name}</span>
              <span style="color:var(--text-muted); font-size:0.7rem; margin-left:6px;">${f.size}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="btn-tag" style="font-size:0.65rem; font-family:monospace; background:var(--success-bg); color:var(--success); border-color:var(--success-border);" title="Integrity Hash">${f.hash.slice(0, 16)}...</span>
            <button onclick="removeAttachedFile(${idx})" style="background:none; border:none; color:var(--danger); cursor:pointer; padding:2px;" title="Remove file">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function removeAttachedFile(index) {
  submitWorkState.attachedFiles.splice(index, 1);
  renderAttachedFilesList();
  updateSubmitWorkSummary();
}

function updateSubmitWorkSummary() {
  const step3 = document.getElementById('sw-step-3');
  const summaryEl = document.getElementById('sw-review-summary');
  if (!step3 || !summaryEl) return;

  if (submitWorkState.attachedFiles.length === 0) {
    step3.style.display = 'none';
    return;
  }

  const project = submitWorkState.projects.find(p => p.id === submitWorkState.selectedProjectId);
  const milestone = project ? (project.milestones || []).find(m => m.id === submitWorkState.selectedMilestoneId) : null;

  summaryEl.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:0.75rem;">
      <div>
        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Project</div>
        <div style="font-weight:600; color:var(--text-primary);">${project ? project.title : 'Selected Project'}</div>
      </div>
      <div>
        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Target Milestone</div>
        <div style="font-weight:600; color:var(--text-primary);">${milestone ? milestone.title : 'Milestone'}</div>
      </div>
      <div>
        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Milestone Escrow Value</div>
        <div style="font-weight:700; color:var(--success); font-size:1rem;">₹${milestone ? milestone.amount.toLocaleString('en-IN') : '0'} INR</div>
      </div>
      <div>
        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Files Attached</div>
        <div style="font-weight:600; color:var(--text-primary);">${submitWorkState.attachedFiles.length} file(s) with SHA-256 integrity hashes</div>
      </div>
    </div>
    <div style="font-size:0.78rem; color:var(--text-muted); background:var(--bg-surface); padding:0.6rem 0.8rem; border-radius:var(--radius-sm); border-left:3px solid var(--info);">
      <strong style="color:var(--text-primary);">What happens next:</strong> Milestone state transitions from "${milestone ? milestone.status : 'In progress'}" to <strong>"In review"</strong>. Client is notified to review and release funds or request a scoped revision.
    </div>
  `;

  step3.style.display = 'block';
  if (window.lucide) window.lucide.createIcons();
}

async function executeSubmitWork() {
  const user = getSessionUser();
  if (!user || !submitWorkState.selectedMilestoneId) return;

  const submitBtn = document.getElementById('sw-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Submitting Deliverables...</span>`;
  }

  const notes = document.getElementById('sw-notes-input') ? document.getElementById('sw-notes-input').value : '';

  try {
    const res = await fetch(`/api/milestones/${submitWorkState.selectedMilestoneId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        deliverables: submitWorkState.attachedFiles,
        notes: notes
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Deliverables submitted successfully! Milestone is now in review.', 'success');
      document.getElementById('sw-step-1').style.display = 'none';
      document.getElementById('sw-step-2').style.display = 'none';
      document.getElementById('sw-step-3').style.display = 'none';
      const successEl = document.getElementById('sw-success');
      if (successEl) {
        successEl.style.display = 'block';
        successEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      showToast(data.error || 'Failed to submit deliverables', 'danger');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="send" style="width:15px;height:15px;"></i><span>Submit for Client Review</span>`;
      }
    }
  } catch (err) {
    console.error('Error submitting deliverables:', err);
    showToast('Failed to submit deliverables', 'danger');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="send" style="width:15px;height:15px;"></i><span>Submit for Client Review</span>`;
    }
  }
}

function resetSubmitWork() {
  resetSubmitWorkUI();
  loadSubmitWork();
}

function resetSubmitWorkUI() {
  submitWorkState.selectedProjectId = null;
  submitWorkState.selectedMilestoneId = null;
  submitWorkState.attachedFiles = [];

  const step1 = document.getElementById('sw-step-1');
  const step2 = document.getElementById('sw-step-2');
  const step3 = document.getElementById('sw-step-3');
  const successEl = document.getElementById('sw-success');
  const notesInput = document.getElementById('sw-notes-input');
  const fileInput = document.getElementById('sw-file-input');

  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';
  if (step3) step3.style.display = 'none';
  if (successEl) successEl.style.display = 'none';
  if (notesInput) notesInput.value = '';
  if (fileInput) fileInput.value = '';

  const fileListEl = document.getElementById('sw-file-list');
  if (fileListEl) fileListEl.innerHTML = '';
}

// ==============================================================================
// MESSAGES CONTROLLER
// ==============================================================================

let activeMsgProjectId = null;

async function loadFreelancerMessages() {
  const user = getSessionUser();
  if (!user) return;

  const threadListEl = document.getElementById('msg-thread-list');
  if (!threadListEl) return;

  threadListEl.innerHTML = `<div style="color:var(--text-muted); padding:1rem; font-size:0.85rem;">Loading threads...</div>`;

  try {
    const res = await fetch('/api/projects', {
      headers: { 'x-user-id': user.id }
    });
    if (!res.ok) throw new Error('Failed to load projects');
    const data = await res.json();
    const projects = data.projects || [];

    if (projects.length === 0) {
      threadListEl.innerHTML = `<div style="color:var(--text-muted); padding:1rem; font-size:0.85rem;">No active project threads.</div>`;
      return;
    }

    threadListEl.innerHTML = projects.map(p => `
      <div onclick="openMessageThread('${p.id}')" id="msg-thread-${p.id}" class="msg-thread-item" style="padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle); margin-bottom:0.5rem; cursor:pointer; transition:all 0.2s;">
        <div style="font-weight:600; font-size:0.88rem; color:var(--text-primary); margin-bottom:2px;">${p.title}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted);">
          <span>${p.clientOrg}</span>
          <span class="status-pill in-progress" style="font-size:0.65rem;">Active</span>
        </div>
      </div>
    `).join('');

    // Open first thread by default
    if (projects.length > 0) {
      openMessageThread(projects[0].id);
    }
  } catch (err) {
    console.error('Error loading message threads:', err);
    threadListEl.innerHTML = `<div style="color:var(--danger); padding:1rem; font-size:0.85rem;">Failed to load message threads.</div>`;
  }
}

async function openMessageThread(projectId) {
  const user = getSessionUser();
  if (!user) return;

  activeMsgProjectId = projectId;

  // Highlight active thread item
  document.querySelectorAll('.msg-thread-item').forEach(el => {
    el.style.borderColor = 'var(--border-subtle)';
    el.style.background = 'transparent';
  });
  const currentThread = document.getElementById(`msg-thread-${projectId}`);
  if (currentThread) {
    currentThread.style.borderColor = 'var(--primary)';
    currentThread.style.background = 'var(--primary-light)';
  }

  const titleEl = document.getElementById('msg-chat-project-title');
  const chatMessagesEl = document.getElementById('msg-chat-messages');
  const inputAreaEl = document.getElementById('msg-chat-input-area');

  if (inputAreaEl) inputAreaEl.style.display = 'block';

  try {
    const res = await fetch(`/api/projects/${projectId}/messages`, {
      headers: { 'x-user-id': user.id }
    });
    const data = await res.json();
    const msgs = data.messages || [];

    if (titleEl) {
      const threadEl = document.getElementById(`msg-thread-${projectId}`);
      const title = threadEl ? threadEl.querySelector('div').textContent : 'Project Thread';
      titleEl.textContent = title;
    }

    if (msgs.length === 0) {
      chatMessagesEl.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.85rem;">
          No messages yet. Send a message to start the discussion.
        </div>
      `;
    } else {
      chatMessagesEl.innerHTML = msgs.map(m => {
        const isMe = m.senderId === user.id;
        const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom:0.75rem;">
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">
              ${isMe ? 'You' : m.senderName} (${m.senderRole}) • ${time}
            </div>
            <div style="max-width:70%; padding:0.65rem 0.9rem; border-radius:var(--radius-md); font-size:0.86rem; line-height:1.4; ${isMe ? 'background:var(--primary); color:white; border-bottom-right-radius:2px;' : 'background:var(--bg-surface-elevated); color:var(--text-primary); border:1px solid var(--border-subtle); border-bottom-left-radius:2px;'}">
              ${m.text}
            </div>
          </div>
        `;
      }).join('');
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }
  } catch (err) {
    console.error('Error loading project messages:', err);
    if (chatMessagesEl) {
      chatMessagesEl.innerHTML = `<div style="color:var(--danger); padding:1rem; font-size:0.85rem;">Failed to load messages.</div>`;
    }
  }
}

async function sendProjectMessage() {
  const user = getSessionUser();
  const input = document.getElementById('msg-chat-input');
  if (!user || !activeMsgProjectId || !input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  try {
    const res = await fetch(`/api/projects/${activeMsgProjectId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      openMessageThread(activeMsgProjectId);
    }
  } catch (err) {
    console.error('Error sending message:', err);
    showToast('Failed to send message', 'danger');
  }
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
