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
  } else if (pathname === '/freelancer/projects' || pathname === '/client/projects') {
    showSection('view-projects');
    loadProjectsDirectory();
  } else if (pathname === '/freelancer/invoices' || pathname === '/client/invoices') {
    showSection('view-invoices');
    loadInvoicesLedger();
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
  if (window.lucide) window.lucide.createIcons();
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

function fillDemoCreds(email, password) {
  const emailInput = document.getElementById('user-email');
  const passInput = document.getElementById('user-password');
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
  const form = document.getElementById('custom-login-form-container');
  if (form && form.style.display === 'none') {
    form.style.display = 'block';
  }
  showToast(`Credentials autofilled for ${email}`, 'info');
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
      <a class="nav-item ${appState.currentRoute === '/freelancer/projects' ? 'active' : ''}" onclick="navigateTo('/freelancer/projects')">
        <span class="icon"><i data-lucide="kanban-square" style="width:18px;height:18px;"></i></span>
        <span>Projects</span>
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
      <a class="nav-item ${appState.currentRoute === '/freelancer/invoices' ? 'active' : ''}" onclick="navigateTo('/freelancer/invoices')">
        <span class="icon"><i data-lucide="receipt" style="width:18px;height:18px;"></i></span>
        <span>Tax Invoices</span>
      </a>
      <a class="nav-item" onclick="navigateTo('/projects/PRJ-101')">
        <span class="icon"><i data-lucide="shield-alert" style="width:18px;height:18px;"></i></span>
        <span>Evidence Timeline</span>
      </a>
      <a class="nav-item" onclick="showToast('Profile settings — Priya Sharma (Contractor)', 'info')">
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
      <a class="nav-item ${appState.currentRoute === '/client/projects' ? 'active' : ''}" onclick="navigateTo('/client/projects')">
        <span class="icon"><i data-lucide="folder" style="width:18px;height:18px;"></i></span>
        <span>Projects</span>
      </a>
      <a class="nav-item" onclick="scrollToApprovals()">
        <span class="icon"><i data-lucide="check-circle" style="width:18px;height:18px;"></i></span>
        <span>Approvals Queue</span>
      </a>
      <a class="nav-item ${appState.currentRoute === '/client/invoices' ? 'active' : ''}" onclick="navigateTo('/client/invoices')">
        <span class="icon"><i data-lucide="receipt" style="width:18px;height:18px;"></i></span>
        <span>Tax Invoices</span>
      </a>
      <div class="nav-section-label">Contracts & Security</div>
      <a class="nav-item" onclick="navigateTo('/client/projects')">
        <span class="icon"><i data-lucide="file-text" style="width:18px;height:18px;"></i></span>
        <span>Documents & SOWs</span>
      </a>
      <a class="nav-item" onclick="navigateTo('/freelancer/messages')">
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
      <tr style="cursor:pointer;" onclick="navigateTo('/projects/${p.id}')">
        <td>
          <div style="font-weight:700; color:var(--text-primary); cursor:pointer;">${p.title}</div>
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
          <button class="btn-primary" style="font-size:0.74rem; padding:5px 12px; display:inline-flex; align-items:center; gap:4px;" onclick="event.stopPropagation(); navigateTo('/projects/${p.id}')">
            <span>Workspace</span>
            <i data-lucide="arrow-right" style="width:13px;height:13px;"></i>
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
      <div class="cl-project-card" style="cursor:pointer; display:flex; flex-direction:column; justify-content:space-between;" onclick="navigateTo('/projects/${p.id}')">
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
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:0.75rem; margin-top:0.75rem; font-size:0.78rem;">
          <span>Spent: <strong>₹${p.spentBudget.toLocaleString('en-IN')}</strong> / ₹${p.totalBudget.toLocaleString('en-IN')}</span>
          <button class="btn-primary" style="font-size:0.74rem; padding:4px 10px; display:inline-flex; align-items:center; gap:4px;" onclick="event.stopPropagation(); navigateTo('/projects/${p.id}')">
            <span>Project Details</span>
            <i data-lucide="arrow-right" style="width:13px;height:13px;"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // 4. Invoices
  const invListEl = document.getElementById('cl-invoices-list');
  if (invListEl) {
    invListEl.innerHTML = invoices.map(i => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid var(--border-subtle); font-size:0.8rem;">
        <div>
          <div style="font-weight:700; color:var(--text-primary);">${i.id} · ${i.milestoneTitle}</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">Base: ₹${i.baseAmount.toLocaleString('en-IN')} + 18% GST (₹${i.gstAmount.toLocaleString('en-IN')})</div>
        </div>
        <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          <div style="font-weight:800; color:var(--text-primary);">₹${i.totalAmount.toLocaleString('en-IN')}</div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="status-pill ${i.status === 'paid' ? 'paid' : 'pending'}" style="font-size:0.65rem;">${i.status.toUpperCase()}</span>
            <button class="btn-secondary" style="font-size:0.68rem; padding:2px 7px;" onclick="viewInvoiceDetails('${i.id}')">View Invoice</button>
          </div>
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

  // Ensure active tab button reflects current selection
  const currentTab = appState.activePwSubtab || 'overview';
  document.querySelectorAll('.admin-subnav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`pw-tab-btn-${currentTab}`);
  if (activeBtn) activeBtn.classList.add('active');

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
  } else if (tab === 'invoices') {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <h4 style="font-weight:700; margin:0;">Project Tax Invoices</h4>
          <span style="font-size:0.75rem; color:var(--text-muted);">GST Rule 46 Compliant • Indian Goods &amp; Services Tax</span>
        </div>
        <button class="btn-primary" style="font-size:0.75rem;" onclick="navigateTo(userRoleInProject === 'freelancer' ? '/freelancer/invoices' : '/client/invoices')">
          <i data-lucide="receipt" style="width:13px;height:13px;"></i>
          <span>View All Invoices</span>
        </button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Milestone Phase</th>
              <th>Base Value</th>
              <th>GST (18%)</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${(invoices && invoices.length > 0) ? invoices.map(i => `
              <tr>
                <td><strong style="color:var(--primary); font-family:monospace; cursor:pointer;" onclick="viewInvoiceDetails('${i.id}')">${i.id}</strong></td>
                <td><strong>${i.milestoneTitle}</strong></td>
                <td>₹${i.baseAmount.toLocaleString('en-IN')}</td>
                <td>₹${i.gstAmount.toLocaleString('en-IN')}</td>
                <td><strong style="color:var(--text-primary); font-size:0.95rem;">₹${i.totalAmount.toLocaleString('en-IN')}</strong></td>
                <td><span class="status-pill ${i.status === 'paid' ? 'paid' : 'pending'}">${i.status.toUpperCase()}</span></td>
                <td>
                  <button class="btn-primary" style="font-size:0.75rem; padding:4px 10px;" onclick="viewInvoiceDetails('${i.id}')">
                    <i data-lucide="eye" style="width:13px;height:13px;"></i>
                    <span>View Tax Invoice</span>
                  </button>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
                  No invoices generated yet. Invoices are automatically drafted with 18% GST upon milestone approval.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === 'deliverables') {
    const allDeliverables = [];
    project.milestones.forEach(m => {
      (m.deliverables || []).forEach(d => {
        allDeliverables.push({ ...d, milestoneTitle: m.title, milestoneStatus: m.status });
      });
    });
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <h4 style="font-weight:700; margin:0;">Submitted Deliverables &amp; Integrity Hashes</h4>
          <span style="font-size:0.75rem; color:var(--text-muted);">Tamper-evident cryptographically signed files</span>
        </div>
        ${userRoleInProject === 'freelancer' ? `
          <button class="btn-primary" style="font-size:0.75rem;" onclick="navigateTo('/freelancer/submit-work')">
            <i data-lucide="upload-cloud" style="width:13px;height:13px;"></i> Submit Deliverables
          </button>
        ` : ''}
      </div>
      ${allDeliverables.length === 0 ? `
        <div style="text-align:center; padding:3rem; color:var(--text-muted);">
          <div style="font-size:2rem; margin-bottom:0.5rem;">📂</div>
          <p>No deliverables submitted yet for this project.</p>
          ${userRoleInProject === 'freelancer' ? `
            <button class="btn-primary" style="margin-top:0.75rem;" onclick="navigateTo('/freelancer/submit-work')">Submit First Milestone Work</button>
          ` : ''}
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${allDeliverables.map(d => `
            <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="font-size:1.8rem;">📦</div>
                <div>
                  <div style="font-weight:700; color:var(--text-primary); font-size:0.92rem;">${d.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${d.milestoneTitle} • ${d.size || '3.5 MB'}</div>
                  <div style="margin-top:4px;">
                    <span class="btn-tag" style="font-size:0.68rem; font-family:monospace; background:var(--success-bg); color:var(--success); border-color:var(--success-border);">
                      SHA-256: ${d.hash || 'sha256-verified-file-hash'}
                    </span>
                  </div>
                </div>
              </div>
              <button class="btn-secondary" style="font-size:0.75rem; padding:5px 12px;" onclick="showToast('Downloading verified copy of ${d.name}...', 'info')">
                <i data-lucide="download" style="width:13px;height:13px;"></i> Download
              </button>
            </div>
          `).join('')}
        </div>
      `}
    `;
  } else if (tab === 'documents') {
    container.innerHTML = `
      <div style="margin-bottom:1rem;">
        <h4 style="font-weight:700; margin:0;">Signed Agreements &amp; Scope Amendments</h4>
        <span style="font-size:0.75rem; color:var(--text-muted);">Legally binding milestone contracts and approved adjustments</span>
      </div>
      <div style="display:grid; grid-template-columns: 1fr; gap:1rem;">
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <span class="brand-badge" style="background:var(--primary-light); color:var(--primary); font-size:0.7rem;">MASTER SOW AGREEMENT</span>
              <h4 style="margin:6px 0 2px; color:var(--text-primary); font-size:1rem;">${project.title} — Statement of Work</h4>
              <p style="font-size:0.78rem; color:var(--text-muted);">Signed on ${project.startDate || 'Oct 01, 2026'} • Legally binding milestone contract</p>
            </div>
            <span class="status-pill paid" style="font-size:0.7rem;">SIGNED &amp; ACTIVE</span>
          </div>
          <p style="font-size:0.84rem; color:var(--text-secondary); line-height:1.5; margin:0.75rem 0;">${project.description}</p>
          <div style="font-size:0.78rem; color:var(--text-muted); padding-top:0.5rem; border-top:1px dashed var(--border-subtle);">
            Total Contract Value: <strong>₹${project.totalBudget.toLocaleString('en-IN')} INR</strong> • Total Phases: ${project.milestones.length}
          </div>
        </div>

        ${scopeAmendments.map(amd => `
          <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1.25rem; border-left:3px solid ${amd.status === 'approved' ? 'var(--success)' : 'var(--warning)'};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <span class="brand-badge" style="font-size:0.7rem;">SCOPE AMENDMENT (${amd.id})</span>
                <h4 style="margin:6px 0 2px; color:var(--text-primary); font-size:0.95rem;">${amd.title}</h4>
                <p style="font-size:0.78rem; color:var(--text-muted);">Requested by ${amd.requesterName} (+₹${amd.additionalCost.toLocaleString('en-IN')} INR · +${amd.additionalDays} days)</p>
              </div>
              <span class="status-pill ${amd.status === 'approved' ? 'paid' : 'warning'}" style="font-size:0.7rem;">${amd.status.toUpperCase()}</span>
            </div>
            <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5; margin:0.75rem 0;">${amd.description}</p>
            ${userRoleInProject === 'client' && amd.status === 'pending_client_approval' ? `
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.75rem;">
                <button class="btn-primary" style="font-size:0.75rem;" onclick="clientApproveAmendment('${amd.id}')">Approve Amendment</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'files') {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h4 style="font-weight:700; margin:0;">Project Assets &amp; Deliverable Files</h4>
        <button class="btn-primary" style="font-size:0.75rem;" onclick="showToast('File upload simulator: select deliverables via Submit Work.', 'info')">
          <i data-lucide="upload" style="width:13px;height:13px;"></i> Upload File
        </button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1rem;">
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem;">
          <div style="font-size:1.5rem; margin-bottom:6px;">🎨</div>
          <div style="font-weight:600; color:var(--text-primary); font-size:0.88rem;">fintech_design_system_v2.fig</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin:4px 0 8px;">Figma File • 18.4 MB</div>
          <button class="btn-secondary" style="font-size:0.72rem; width:100%;" onclick="showToast('Downloading Figma file...', 'info')">Download File</button>
        </div>
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem;">
          <div style="font-size:1.5rem; margin-bottom:6px;">📄</div>
          <div style="font-weight:600; color:var(--text-primary); font-size:0.88rem;">architecture_and_user_flows.pdf</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin:4px 0 8px;">PDF Document • 3.2 MB</div>
          <button class="btn-secondary" style="font-size:0.72rem; width:100%;" onclick="showToast('Downloading Architecture PDF...', 'info')">Download File</button>
        </div>
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem;">
          <div style="font-size:1.5rem; margin-bottom:6px;">🗜️</div>
          <div style="font-weight:600; color:var(--text-primary); font-size:0.88rem;">icons_and_tokens_bundle.zip</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin:4px 0 8px;">ZIP Archive • 8.1 MB</div>
          <button class="btn-secondary" style="font-size:0.72rem; width:100%;" onclick="showToast('Downloading Tokens Bundle...', 'info')">Download File</button>
        </div>
      </div>
    `;
  } else if (tab === 'messages') {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; min-height:420px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <h4 style="font-weight:700; margin:0;">Project Chat Channel</h4>
          <span style="font-size:0.75rem; color:var(--text-muted);">Direct Contractor-Client Communication</span>
        </div>
        <div id="pw-chat-messages-container" style="flex:1; overflow-y:auto; padding:1rem; background:var(--bg-surface-elevated); border-radius:var(--radius-md); border:1px solid var(--border-subtle); margin-bottom:0.75rem; min-height:260px;">
          <p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:2rem 0;">Loading conversation...</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <input type="text" id="pw-chat-input" placeholder="Type a message regarding ${project.title}..." style="flex:1; padding:0.65rem; background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); color:var(--text-primary); font-size:0.88rem;" onkeydown="if(event.key==='Enter')sendPwProjectMessage('${project.id}')">
          <button class="btn-primary" onclick="sendPwProjectMessage('${project.id}')" style="padding:0.65rem 1.25rem;">
            <i data-lucide="send" style="width:15px;height:15px;"></i>
          </button>
        </div>
      </div>
    `;
    loadPwProjectMessages(project.id);
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

  const activeTab = appState.activeAdminSubtab || 'overview';

  // Highlight active subtab button
  document.querySelectorAll('#view-admin .admin-subnav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(activeTab));
  });

  const container = document.getElementById('admin-subtab-container');
  if (!container) return;

  try {
    const [auditRes, disputesRes] = await Promise.all([
      fetch('/api/audit-logs', { headers: { 'x-user-id': user.id } }),
      fetch('/api/disputes', { headers: { 'x-user-id': user.id } }).catch(() => ({ json: () => ({ disputes: [] }) }))
    ]);

    const auditData = await auditRes.json();
    const disputesData = await disputesRes.json();
    const disputes = disputesData.disputes || [];
    const auditLogs = auditData.auditLogs || [];

    if (activeTab === 'overview') {
      container.innerHTML = `
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom:1.5rem;">
          <div class="stat-card">
            <span class="stat-title">Platform Active Projects</span>
            <div class="stat-value" id="adm-active-projects">2</div>
            <div class="stat-footer">Fintech App &amp; Marketplace Branding</div>
          </div>
          <div class="stat-card">
            <span class="stat-title">Simulated Escrow Balance</span>
            <div class="stat-value" id="adm-sim-escrow">₹40,000</div>
            <div class="stat-footer">Held across funded milestones</div>
          </div>
          <div class="stat-card">
            <span class="stat-title">Platform Audit Events</span>
            <div class="stat-value" id="adm-audit-count">${auditLogs.length}</div>
            <div class="stat-footer">Append-only integrity log</div>
          </div>
        </div>

        <div class="card-section" style="margin-bottom:1.5rem;">
          <div class="card-section-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="shield-check" style="width:18px;height:18px;color:var(--success);"></i>
              <h3>Platform Health &amp; Trust Oversight</h3>
            </div>
            <span class="brand-badge" style="background:var(--success-bg); color:var(--success); border:1px solid var(--success-border);">Protocol 100% Verified</span>
          </div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; padding:0.5rem 0;">
            <div style="background:var(--bg-surface-elevated); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
              <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">ACTIVE DISPUTES</div>
              <div style="font-size:1.4rem; font-weight:800; color:${disputes.length > 0 ? 'var(--warning)' : 'var(--success)'}; margin:4px 0;">${disputes.length}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${disputes.length === 0 ? 'Zero unresolved grievances' : 'Pending neutral mediation'}</div>
            </div>
            <div style="background:var(--bg-surface-elevated); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
              <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">GST TAX COMPLIANCE</div>
              <div style="font-size:1.4rem; font-weight:800; color:var(--info); margin:4px 0;">Rule 46</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">SAC 998314 digital invoicing</div>
            </div>
            <div style="background:var(--bg-surface-elevated); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
              <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">CLIENT SILENCE WATCHDOG</div>
              <div style="font-size:1.4rem; font-weight:800; color:var(--primary); margin:4px 0;">72 Hours</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Automated schedule proposal guards</div>
            </div>
          </div>
        </div>

        <div class="card-section">
          <div class="card-section-header">
            <h3>Recent Platform Integrity Events</h3>
            <button class="btn-tag" onclick="switchAdminSubtab('audit')">View All Logs →</button>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Project</th>
                  <th>Action</th>
                  <th>Reason / Details</th>
                  <th>SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody id="adm-audit-table-body">
                ${auditLogs.slice(0, 5).map(l => `
                  <tr>
                    <td><span style="font-family:monospace; font-size:0.75rem;">${new Date(l.timestamp).toLocaleString('en-IN')}</span></td>
                    <td><strong>${l.actorName}</strong> (${l.actorRole})</td>
                    <td>${l.projectId || 'N/A'}</td>
                    <td><strong style="color:var(--primary);">${l.action}</strong></td>
                    <td>${l.reason}</td>
                    <td><code style="font-size:0.7rem;">${l.evidenceHash || 'verified'}</code></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (activeTab === 'disputes') {
      container.innerHTML = `
        <div class="card-section">
          <div class="card-section-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="scale" style="width:18px;height:18px;color:var(--primary);"></i>
              <h3>Neutral Dispute Mediation Queue</h3>
            </div>
            <span class="brand-badge" style="background:rgba(239,68,68,0.12); color:var(--danger); border:1px solid var(--danger-border);">${disputes.length} Cases</span>
          </div>

          ${disputes.length === 0 ? `
            <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
              <div style="font-size:2.5rem; margin-bottom:0.75rem;">⚖️</div>
              <h4 style="margin-bottom:0.25rem; color:var(--text-primary);">All Contracts in Good Standing</h4>
              <p style="font-size:0.85rem; max-width:480px; margin:0 auto;">
                There are currently no active disputes. Milestone approvals, revision limits, and client review windows are operating smoothly.
              </p>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:1rem;">
              ${disputes.map(d => `
                <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1.25rem;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                    <div>
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700; color:var(--primary);">${d.id}</span>
                        <span class="status-pill pending">${d.status.replace(/_/g, ' ')}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${d.category}</span>
                      </div>
                      <h4 style="margin:6px 0 2px; font-size:1rem;">${d.reason}</h4>
                      <div style="font-size:0.8rem; color:var(--text-secondary);">Project: <strong>${d.projectTitle}</strong> (${d.projectId}) · Claimant: <strong>${d.claimantName}</strong> (${d.claimantRole})</div>
                    </div>
                    <button class="btn-primary" style="font-size:0.75rem; padding:4px 10px;" onclick="showToast('Assembling neutral evidence briefing dossier...', 'info')">Review Dossier</button>
                  </div>
                  ${d.claimDetails ? `<div style="font-size:0.82rem; color:var(--text-muted); background:var(--bg-surface); padding:0.65rem 0.85rem; border-radius:var(--radius-sm); margin-bottom:0.5rem; line-height:1.4;">"${d.claimDetails}"</div>` : ''}
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:var(--text-muted); border-top:1px solid var(--border-subtle); padding-top:0.5rem; margin-top:0.5rem;">
                    <span>Evidence Hash: <code style="color:var(--text-secondary);">${d.evidenceHash}</code></span>
                    <span>Logged: ${new Date(d.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } else if (activeTab === 'audit') {
      container.innerHTML = `
        <div class="card-section">
          <div class="card-section-header">
            <div>
              <h3>Complete Platform Integrity Audit Log</h3>
              <p style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">Cryptographically hashed event sequence for legal and dispute verification</p>
            </div>
            <button class="btn-secondary" style="font-size:0.75rem;" onclick="showToast('Exporting SHA-256 audit log certificate...', 'success')">
              <i data-lucide="download" style="width:14px;height:14px;"></i>
              <span>Export Certificate</span>
            </button>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Project</th>
                  <th>Action</th>
                  <th>Reason / Details</th>
                  <th>SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody id="adm-audit-table-body">
                ${auditLogs.map(l => `
                  <tr>
                    <td><span style="font-family:monospace; font-size:0.75rem;">${new Date(l.timestamp).toLocaleString('en-IN')}</span></td>
                    <td><strong>${l.actorName}</strong> (${l.actorRole})</td>
                    <td>${l.projectId || 'N/A'}</td>
                    <td><strong style="color:var(--primary);">${l.action}</strong></td>
                    <td>${l.reason}</td>
                    <td><code style="font-size:0.7rem;">${l.evidenceHash || 'verified'}</code></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading admin dashboard subtab:', err);
    container.innerHTML = `<div style="color:var(--danger); padding:2rem; text-align:center;">Failed to load admin data.</div>`;
  }

  if (window.lucide) window.lucide.createIcons();
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
  if (m) {
    m.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }
}

function simulateJobImport() {
  closeModal('modal-url-import');
  showToast('Sample job data extracted and converted into milestone brief draft.', 'success');
}

function openNewProjectBriefModal() {
  showToast('AI Project Assistant: Turn messages into structured SOWs and milestones.', 'info');
}

function openCreateInvoiceModal() {
  const m = document.getElementById('modal-create-invoice');
  if (m) {
    m.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }
}

async function submitCreateInvoice() {
  const user = getSessionUser();
  const projectId = document.getElementById('ci-project-select')?.value || 'PRJ-101';
  const milestoneTitle = document.getElementById('ci-milestone-title')?.value || 'Milestone Delivery';
  const amount = Number(document.getElementById('ci-amount-input')?.value || 25000);
  const taxType = document.getElementById('ci-tax-type')?.value || 'standard_gst';

  closeModal('modal-create-invoice');
  showToast(`Draft Tax Invoice generated for ₹${amount.toLocaleString('en-IN')} (${taxType === 'standard_gst' ? '18% GST' : 'Zero-Rated Export'}). Added to ledger.`, 'success');
  if (appState.currentRoute === '/freelancer/invoices' || appState.currentRoute === '/client/invoices') {
    loadInvoicesLedger();
  }
}

function openCreateProjectModal() {
  const m = document.getElementById('modal-create-project');
  if (m) {
    m.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }
}

async function submitCreateProject() {
  const user = getSessionUser();
  const title = document.getElementById('cp-title-input')?.value.trim();
  const description = document.getElementById('cp-desc-input')?.value.trim();
  const totalBudget = Number(document.getElementById('cp-budget-input')?.value || 50000);
  const freelancerEmail = document.getElementById('cp-freelancer-email')?.value.trim();

  if (!title) {
    showToast('Please enter a project title.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        title,
        description,
        totalBudget,
        freelancerEmail
      })
    });

    const data = await res.json();
    if (res.ok) {
      closeModal('modal-create-project');
      showToast(`Project "${title}" created successfully with ₹${totalBudget.toLocaleString('en-IN')} escrow!`, 'success');
      if (user.role === 'client') {
        loadClientDashboard();
      } else if (user.role === 'freelancer') {
        loadFreelancerDashboard();
      }
      if (appState.currentRoute === '/client/projects' || appState.currentRoute === '/freelancer/projects') {
        loadProjectsDirectory();
      }
    } else {
      showToast(data.error || 'Failed to create project', 'danger');
    }
  } catch (err) {
    console.error('Error creating project:', err);
    showToast('Network error while creating project', 'danger');
  }
}

function openInviteFreelancerModal() {
  const m = document.getElementById('modal-invite-freelancer');
  if (m) {
    m.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }
}

function copyInviteLink() {
  const input = document.getElementById('invite-link-input');
  const textBtn = document.getElementById('copy-link-text');
  if (input) {
    input.select();
    navigator.clipboard?.writeText(input.value);
    if (textBtn) textBtn.textContent = 'Copied!';
    setTimeout(() => {
      if (textBtn) textBtn.textContent = 'Copy';
    }, 2000);
    showToast('Magic onboarding link copied to clipboard!', 'success');
  }
}

function sendInviteDispatched() {
  const email = document.getElementById('invite-email-input')?.value || 'freelancer@studio.com';
  closeModal('modal-invite-freelancer');
  showToast(`Onboarding invitation securely dispatched to ${email}`, 'success');
}

function openRaiseDisputeModal() {
  const m = document.getElementById('modal-raise-dispute');
  if (m) {
    m.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }
}

async function submitRaiseDispute() {
  const user = getSessionUser();
  const projectId = document.getElementById('dispute-project-select')?.value || 'PRJ-101';
  const category = document.getElementById('dispute-category-select')?.value || 'Scope & Quality';
  const reason = document.getElementById('dispute-reason-input')?.value.trim();
  const claimDetails = document.getElementById('dispute-details-input')?.value.trim();

  if (!reason) {
    showToast('Please enter a summary of the dispute reason.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        projectId,
        category,
        reason,
        claimDetails
      })
    });

    const data = await res.json();
    if (res.ok) {
      closeModal('modal-raise-dispute');
      showToast(`Dispute mediation initiated (${data.dispute.id}). Neutral AI dossier compiled for human arbiter.`, 'success');
      if (appState.currentRoute === '/admin') {
        loadAdminDashboard();
      }
    } else {
      showToast(data.error || 'Failed to submit dispute', 'danger');
    }
  } catch (err) {
    console.error('Error submitting dispute:', err);
    showToast('Network error submitting dispute', 'danger');
  }
}

function openRequestRefundModal() {
  const m = document.getElementById('modal-request-refund');
  if (m) {
    m.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }
}

async function submitRequestRefund() {
  const user = getSessionUser();
  const projectId = document.getElementById('refund-project-select')?.value || 'PRJ-101';
  const milestoneId = document.getElementById('refund-milestone-select')?.value || 'MS-102';
  const reason = document.getElementById('refund-reason-input')?.value.trim();

  if (!reason) {
    showToast('Please provide a reason for the refund request.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/refunds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({
        projectId,
        milestoneId,
        reason
      })
    });

    if (res.ok) {
      closeModal('modal-request-refund');
      showToast(`Refund request logged for milestone ${milestoneId}. Reviewing escrow status per Bharosa protocol.`, 'info');
    } else {
      showToast('Could not log refund request', 'danger');
    }
  } catch (err) {
    console.error('Refund error:', err);
    showToast('Network error processing refund request', 'danger');
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap = {
    success: 'check-circle-2',
    danger: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i data-lucide="${iconMap[type] || 'info'}" style="width:16px;height:16px;flex-shrink:0;"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close-btn" aria-label="Dismiss">&times;</button>
    <div class="toast-progress"></div>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn?.addEventListener('click', () => {
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 250);
  });

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    if (toast.isConnected) {
      toast.classList.add('dismissing');
      setTimeout(() => toast.remove(), 250);
    }
  }, 3800);
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
  const query = (e.target.value || '').trim().toLowerCase();

  // 1. Filter Freelancer Dashboard table rows
  const flRows = document.querySelectorAll('#fl-projects-table-body tr');
  flRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = (!query || text.includes(query)) ? '' : 'none';
  });

  // 2. Filter Freelancer Action Items
  const flActions = document.querySelectorAll('#fl-action-items-list .action-item-card');
  flActions.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!query || text.includes(query)) ? '' : 'none';
  });

  // 3. Filter Client Projects Grid
  const clCards = document.querySelectorAll('#cl-projects-grid > div');
  clCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!query || text.includes(query)) ? '' : 'none';
  });

  // 4. Filter Client Approvals List
  const clApprovals = document.querySelectorAll('#cl-approval-items-list > div');
  clApprovals.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!query || text.includes(query)) ? '' : 'none';
  });

  // 5. Filter Projects Directory
  const projCards = document.querySelectorAll('#projects-directory-list > div');
  projCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!query || text.includes(query)) ? '' : 'none';
  });

  // 6. Filter Invoices Table
  const invRows = document.querySelectorAll('#invoices-table-body tr');
  invRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = (!query || text.includes(query)) ? '' : 'none';
  });

  // 7. Filter Opportunities List
  const oppCards = document.querySelectorAll('#opportunities-list > div');
  oppCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!query || text.includes(query)) ? '' : 'none';
  });
}

// Global Keyboard & Backdrop Listeners for Modals & Overlays
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    if (activeModals.length > 0) {
      activeModals[activeModals.length - 1].classList.remove('active');
    }
    toggleMobileSidebar(false);
    const notifPanel = document.getElementById('notification-panel');
    if (notifPanel) notifPanel.style.display = 'none';
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

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

// ==============================================================================
// PROJECTS DIRECTORY CONTROLLER (/freelancer/projects & /client/projects)
// ==============================================================================

async function loadProjectsDirectory() {
  const user = getSessionUser();
  if (!user) return;

  const container = document.getElementById('projects-directory-list');
  const headerActions = document.getElementById('projects-header-actions');
  if (!container) return;

  container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Loading projects...</div>`;

  if (headerActions) {
    if (user.role === 'freelancer') {
      headerActions.innerHTML = `
        <button class="btn-primary" onclick="navigateTo('/freelancer/find-work')">
          <i data-lucide="compass" style="width:15px;height:15px;"></i>
          <span>Find Work</span>
        </button>
        <button class="btn-secondary" onclick="navigateTo('/freelancer/submit-work')">
          <i data-lucide="upload-cloud" style="width:15px;height:15px;"></i>
          <span>Submit Work</span>
        </button>
      `;
    } else {
      headerActions.innerHTML = `
        <button class="btn-primary" onclick="openCreateProjectModal()">
          <i data-lucide="plus-circle" style="width:15px;height:15px;"></i>
          <span>Create Project</span>
        </button>
      `;
    }
  }

  try {
    const res = await fetch('/api/projects', {
      headers: { 'x-user-id': user.id }
    });
    const data = await res.json();
    const projects = data.projects || [];

    if (projects.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
          <h3>No Projects Found</h3>
          <p style="font-size:0.85rem; margin-top:0.5rem;">You do not have any active projects yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(p => {
      const completedCount = (p.milestones || []).filter(m => m.status === 'Released' || m.status === 'Invoiced').length;
      const progressPct = Math.round((completedCount / (p.milestones ? p.milestones.length : 1)) * 100);
      const activeMilestone = (p.milestones || []).find(m => m.status !== 'Invoiced' && m.status !== 'Released') || p.milestones[p.milestones.length - 1];

      return `
        <div class="card-section" style="display:flex; flex-direction:column; justify-content:space-between; border-left: 3px solid var(--primary); transition:all 0.2s; cursor:pointer;" onclick="navigateTo('/projects/${p.id}')">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
              <div>
                <span class="brand-badge" style="font-size:0.68rem;">${p.clientOrg || 'Client Organization'}</span>
                <h3 style="margin-top:0.35rem; font-size:1.05rem; color:var(--text-primary); cursor:pointer;" onclick="navigateTo('/projects/${p.id}')">${p.title}</h3>
                <p style="font-size:0.76rem; color:var(--text-muted);">Client: ${p.clientName} • Contractor: ${p.freelancerName}</p>
              </div>
              <span class="status-pill in-progress" style="font-size:0.68rem;">Active</span>
            </div>

            <!-- Progress Bar -->
            <div style="margin:1rem 0;">
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">
                <span>Milestone Progress</span>
                <span style="font-weight:700; color:var(--text-primary);">${progressPct}% (${completedCount}/${p.milestones.length})</span>
              </div>
              <div style="width:100%; height:6px; background:var(--bg-surface-elevated); border-radius:999px; overflow:hidden;">
                <div style="width:${progressPct}%; height:100%; background:var(--primary-gradient); border-radius:999px;"></div>
              </div>
            </div>

            <div style="background:var(--bg-surface-elevated); padding:0.65rem 0.85rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle); margin-bottom:1rem; font-size:0.78rem;">
              <span style="color:var(--text-muted);">Current Phase:</span>
              <strong style="color:var(--text-primary); margin-left:4px;">${activeMilestone ? activeMilestone.title : 'All Milestones Completed'}</strong>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.75rem; border-top:1px solid var(--border-subtle);">
            <div>
              <div style="font-size:1.1rem; font-weight:800; color:var(--success);">₹${p.totalBudget.toLocaleString('en-IN')}</div>
              <span style="font-size:0.68rem; color:var(--text-muted);">Total Budget</span>
            </div>
            <button class="btn-primary" style="font-size:0.82rem; padding:0.5rem 1rem;" onclick="event.stopPropagation(); navigateTo('/projects/${p.id}')">
              <span>Open Workspace</span>
              <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('Error loading projects directory:', err);
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:var(--danger);">Error loading projects.</div>`;
  }
}

// ==============================================================================
// INVOICES LEDGER CONTROLLER (/freelancer/invoices & /client/invoices)
// ==============================================================================

async function loadInvoicesLedger() {
  const user = getSessionUser();
  if (!user) return;

  const tableBody = document.getElementById('invoices-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading tax invoices...</td></tr>`;

  try {
    const res = await fetch('/api/invoices', {
      headers: { 'x-user-id': user.id }
    });
    const data = await res.json();
    const invoices = data.invoices || [];

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalGst = 0;
    let pendingCount = 0;

    invoices.forEach(i => {
      totalInvoiced += i.totalAmount;
      totalGst += (i.gstAmount || Math.round(i.baseAmount * (i.gstRate || 0.18)));
      if (i.status === 'paid') {
        totalPaid += i.totalAmount;
      } else {
        pendingCount++;
      }
    });

    const totEl = document.getElementById('inv-stat-total');
    const paidEl = document.getElementById('inv-stat-paid');
    const gstEl = document.getElementById('inv-stat-gst');
    const pendEl = document.getElementById('inv-stat-pending');

    if (totEl) totEl.textContent = `₹${totalInvoiced.toLocaleString('en-IN')}`;
    if (paidEl) paidEl.textContent = `₹${totalPaid.toLocaleString('en-IN')}`;
    if (gstEl) gstEl.textContent = `₹${totalGst.toLocaleString('en-IN')}`;
    if (pendEl) pendEl.textContent = `${pendingCount}`;

    if (invoices.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted);">
            No invoices generated yet. Invoices are automatically generated with 18% GST when milestones are approved and settled.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = invoices.map(i => `
      <tr>
        <td>
          <strong style="color:var(--primary); font-family:monospace; cursor:pointer;" onclick="viewInvoiceDetails('${i.id}')">${i.id}</strong>
          <div style="font-size:0.7rem; color:var(--text-muted);">${new Date(i.issuedAt || Date.now()).toLocaleDateString('en-IN')}</div>
        </td>
        <td>
          <div style="font-weight:600; color:var(--text-primary);">${i.milestoneTitle}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${i.projectId}</div>
        </td>
        <td>
          <div style="font-weight:600;">${user.role === 'freelancer' ? i.clientName : i.freelancerName}</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">${user.role === 'freelancer' ? (i.clientOrg || 'Client') : 'Contractor'}</div>
        </td>
        <td>₹${i.baseAmount.toLocaleString('en-IN')}</td>
        <td><span style="color:var(--text-muted);">₹${(i.gstAmount || Math.round(i.baseAmount * 0.18)).toLocaleString('en-IN')}</span></td>
        <td><strong style="color:var(--text-primary); font-size:0.95rem;">₹${i.totalAmount.toLocaleString('en-IN')}</strong></td>
        <td><span class="status-pill ${i.status === 'paid' ? 'paid' : 'pending'}">${i.status.toUpperCase()}</span></td>
        <td>
          <button class="btn-primary" style="font-size:0.75rem; padding:4px 10px;" onclick="viewInvoiceDetails('${i.id}')">
            <i data-lucide="eye" style="width:13px;height:13px;"></i>
            <span>View Tax Invoice</span>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('Error loading invoices ledger:', err);
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--danger);">Error loading invoices.</td></tr>`;
  }
}

// ==============================================================================
// VIEW TAX INVOICE DETAILS MODAL
// ==============================================================================

async function viewInvoiceDetails(invoiceId) {
  const user = getSessionUser();
  if (!user) return;

  try {
    const res = await fetch('/api/invoices', {
      headers: { 'x-user-id': user.id }
    });
    const data = await res.json();
    const invoice = (data.invoices || []).find(i => i.id === invoiceId) || {
      id: invoiceId,
      milestoneTitle: 'Milestone 1: Wireframes & Architecture Map',
      projectId: 'PRJ-101',
      clientName: 'Rahul Verma',
      clientOrg: 'GrowthNest Media Pvt Ltd',
      freelancerName: 'Priya Sharma',
      baseAmount: 25000,
      gstRate: 0.18,
      gstAmount: 4500,
      totalAmount: 29500,
      status: 'paid',
      issuedAt: new Date().toISOString(),
      simulatedPaymentProvider: 'Razorpay Sandbox (Simulated)'
    };

    const container = document.getElementById('invoice-modal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="invoice-paper" style="border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1.5rem; background:var(--bg-surface);">
        <!-- Top Invoice Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; border-bottom:2px solid var(--border-subtle); padding-bottom:1rem;">
          <div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--text-primary); letter-spacing:-0.02em;">TAX INVOICE</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Original for Recipient • GST Rule 46</div>
            <div style="margin-top:6px; font-weight:700; color:var(--primary); font-size:0.95rem;">${invoice.id}</div>
          </div>
          <div style="text-align:right;">
            <div class="brand-badge" style="font-size:0.75rem; background:var(--success-bg); color:var(--success); border:1px solid var(--success-border); font-weight:700;">
              STATUS: ${invoice.status.toUpperCase()}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;">
              Date of Issue: <strong>${new Date(invoice.issuedAt || Date.now()).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}</strong>
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted);">
              Place of Supply: <strong>Karnataka (29)</strong>
            </div>
          </div>
        </div>

        <!-- Supplier & Buyer 2-Column Info -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom:1.5rem; background:var(--bg-surface-elevated); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <div>
            <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Supplier (Service Provider)</div>
            <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">${invoice.freelancerName || 'Priya Sharma'}</div>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">Senior Product Designer &amp; UI Specialist</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Maharashtra, India (State Code: 27)</div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">GSTIN: <strong style="color:var(--text-primary);">27AABCS1429B1Z</strong></div>
            <div style="font-size:0.72rem; color:var(--text-muted);">PAN: <strong style="color:var(--text-primary);">AABCS1429B</strong></div>
          </div>
          <div>
            <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Recipient (Billed To)</div>
            <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">${invoice.clientName || 'Rahul Verma'}</div>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">${invoice.clientOrg || 'GrowthNest Media Pvt Ltd'}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Bengaluru, Karnataka, India (State Code: 29)</div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">GSTIN: <strong style="color:var(--text-primary);">29AABCG8492C1ZT</strong></div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table class="invoice-table" style="width:100%; border-collapse:collapse; margin-bottom:1.25rem;">
          <thead>
            <tr style="background:var(--bg-surface-elevated); font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">
              <th style="padding:0.6rem; border:1px solid var(--border-subtle); text-align:center;">#</th>
              <th style="padding:0.6rem; border:1px solid var(--border-subtle); text-align:left;">Service Description</th>
              <th style="padding:0.6rem; border:1px solid var(--border-subtle); text-align:center;">SAC Code</th>
              <th style="padding:0.6rem; border:1px solid var(--border-subtle); text-align:right;">Taxable Value</th>
              <th style="padding:0.6rem; border:1px solid var(--border-subtle); text-align:right;">IGST (18%)</th>
              <th style="padding:0.6rem; border:1px solid var(--border-subtle); text-align:right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="font-size:0.82rem;">
              <td style="padding:0.7rem; border:1px solid var(--border-subtle); text-align:center;">1</td>
              <td style="padding:0.7rem; border:1px solid var(--border-subtle);">
                <strong>${invoice.milestoneTitle || 'Milestone Deliverables'}</strong>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Digital UI/UX deliverables with verified cryptographic SHA-256 integrity seal</div>
              </td>
              <td style="padding:0.7rem; border:1px solid var(--border-subtle); text-align:center; font-family:monospace;">998314</td>
              <td style="padding:0.7rem; border:1px solid var(--border-subtle); text-align:right;">₹${invoice.baseAmount.toLocaleString('en-IN')}</td>
              <td style="padding:0.7rem; border:1px solid var(--border-subtle); text-align:right;">₹${(invoice.gstAmount || Math.round(invoice.baseAmount * 0.18)).toLocaleString('en-IN')}</td>
              <td style="padding:0.7rem; border:1px solid var(--border-subtle); text-align:right; font-weight:700;">₹${invoice.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals & Payment Summary -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; padding-top:0.75rem;">
          <div style="max-width:55%;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Amount in Words:</div>
            <div style="font-size:0.8rem; font-weight:700; color:var(--text-primary); margin-top:2px; font-style:italic;">
              Indian Rupees ${numberToIndianWords(invoice.totalAmount)}
            </div>
            <div style="margin-top:1rem; font-size:0.72rem; color:var(--text-muted);">
              <div>Payment Mode: <strong>${invoice.simulatedPaymentProvider || 'Razorpay Escrow (Simulated)'}</strong></div>
              <div>Settlement Status: <strong style="color:var(--success);">Escrow Released to Contractor</strong></div>
            </div>
          </div>
          <div style="width:220px; font-size:0.82rem;">
            <div style="display:flex; justify-content:space-between; padding:3px 0;">
              <span style="color:var(--text-muted);">Subtotal (Taxable):</span>
              <span>₹${invoice.baseAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px solid var(--border-subtle);">
              <span style="color:var(--text-muted);">IGST (18%):</span>
              <span>₹${(invoice.gstAmount || Math.round(invoice.baseAmount * 0.18)).toLocaleString('en-IN')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:1rem; font-weight:800; color:var(--success);">
              <span>Grand Total:</span>
              <span>₹${invoice.totalAmount.toLocaleString('en-IN')} INR</span>
            </div>
          </div>
        </div>
      </div>
    `;

    openModal('modal-view-invoice');
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('Error displaying invoice details:', err);
    showToast('Failed to load invoice details', 'danger');
  }
}

function numberToIndianWords(num) {
  if (!num) return 'Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  return inWords(num).trim() + ' Only';
}

function exportInvoicesCsv() {
  showToast('Invoices register exported to CSV (SAC 998314 compliant)', 'success');
}

// ==============================================================================
// PROJECT WORKSPACE INLINE CHAT
// ==============================================================================

async function loadPwProjectMessages(projectId) {
  const user = getSessionUser();
  const container = document.getElementById('pw-chat-messages-container');
  if (!user || !container) return;

  try {
    const res = await fetch(`/api/projects/${projectId}/messages`, {
      headers: { 'x-user-id': user.id }
    });
    const data = await res.json();
    const msgs = data.messages || [];

    if (msgs.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:2rem 0;">No messages in this project yet.</p>`;
    } else {
      container.innerHTML = msgs.map(m => {
        const isMe = m.senderId === user.id;
        const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom:0.75rem;">
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">
              ${isMe ? 'You' : m.senderName} (${m.senderRole}) • ${time}
            </div>
            <div style="max-width:75%; padding:0.65rem 0.9rem; border-radius:var(--radius-md); font-size:0.86rem; line-height:1.4; ${isMe ? 'background:var(--primary); color:white; border-bottom-right-radius:2px;' : 'background:var(--bg-surface); color:var(--text-primary); border:1px solid var(--border-subtle); border-bottom-left-radius:2px;'}">
              ${m.text}
            </div>
          </div>
        `;
      }).join('');
      container.scrollTop = container.scrollHeight;
    }
  } catch (err) {
    console.error('Error loading project messages:', err);
    container.innerHTML = `<p style="color:var(--danger); font-size:0.85rem; padding:1rem;">Failed to load messages.</p>`;
  }
}

async function sendPwProjectMessage(projectId) {
  const user = getSessionUser();
  const input = document.getElementById('pw-chat-input');
  if (!user || !projectId || !input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  try {
    const res = await fetch(`/api/projects/${projectId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id
      },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      loadPwProjectMessages(projectId);
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

// Explicitly bind all navigation and action handlers to window for inline onclick execution
window.navigateTo = navigateTo;
window.navigateHome = navigateHome;
window.navigateBack = navigateBack;
window.viewInvoiceDetails = viewInvoiceDetails;
window.switchPwTab = switchPwTab;
window.toggleMobileSidebar = toggleMobileSidebar;
window.exportInvoicesCsv = exportInvoicesCsv;
window.sendPwProjectMessage = sendPwProjectMessage;
window.loadPwProjectMessages = loadPwProjectMessages;
window.demoLogin = demoLogin;
window.handleCustomLogin = handleCustomLogin;
window.toggleCustomLoginForm = toggleCustomLoginForm;
window.fillDemoCreds = fillDemoCreds;
window.handleLogout = handleLogout;
window.openModal = openModal;
window.closeModal = closeModal;
window.clientFundMilestone = clientFundMilestone;
window.clientApproveMilestone = clientApproveMilestone;
window.freelancerSubmitDeliverable = freelancerSubmitDeliverable;
window.openRevisionRequestModal = openRevisionRequestModal;
window.submitRevisionRequest = submitRevisionRequest;
window.openScopeChangeModal = openScopeChangeModal;
window.submitScopeAmendment = submitScopeAmendment;
window.clientApproveAmendment = clientApproveAmendment;
window.openSilenceReminderModal = openSilenceReminderModal;
window.submitSilenceReminder = submitSilenceReminder;
window.openRaiseDisputeModal = openRaiseDisputeModal;
window.submitDispute = submitDispute;
window.toggleTheme = toggleTheme;
window.loadProjectsDirectory = loadProjectsDirectory;
window.loadInvoicesLedger = loadInvoicesLedger;

// ==============================================================================
// SUPABASE CLIENT STATUS & MODAL CONTROLLER
// ==============================================================================

let currentSupabaseStatus = null;

async function checkSupabaseStatus(showToastOnSuccess = false) {
  const pill = document.getElementById('supabase-status-pill');
  const pillText = document.getElementById('supabase-pill-text');

  try {
    const res = await fetch('/api/supabase/status');
    const data = await res.json();
    currentSupabaseStatus = data;

    if (pill && pillText) {
      if (data.connected) {
        pill.style.borderColor = 'rgba(62, 207, 142, 0.5)';
        pill.style.background = 'rgba(62, 207, 142, 0.12)';
        pill.style.color = '#3ecf8e';
        pillText.textContent = 'Supabase: Connected';
      } else if (data.configured) {
        pill.style.borderColor = 'rgba(234, 179, 8, 0.5)';
        pill.style.background = 'rgba(234, 179, 8, 0.12)';
        pill.style.color = '#eab308';
        pillText.textContent = 'Supabase: Schema Needed';
      } else {
        pill.style.borderColor = 'rgba(148, 163, 184, 0.3)';
        pill.style.background = 'rgba(148, 163, 184, 0.08)';
        pill.style.color = 'var(--text-muted)';
        pillText.textContent = 'DB: Local (Connect Supabase)';
      }
    }

    renderSupabaseModalContent(data);

    if (showToastOnSuccess) {
      if (data.connected) {
        showToast('Supabase connected successfully!', 'success');
      } else if (data.configured) {
        showToast(`Supabase connection error: ${data.error || 'Check tables'}`, 'warning');
      } else {
        showToast('Running in local memory fallback mode. Configure .env with Supabase credentials to persist.', 'info');
      }
    }
  } catch (err) {
    if (pillText) pillText.textContent = 'Supabase: Offline';
  }
}

function renderSupabaseModalContent(status) {
  const card = document.getElementById('supabase-modal-status-card');
  if (!card) return;

  if (status.connected) {
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#3ecf8e; box-shadow:0 0 8px #3ecf8e;"></span>
        <strong style="color:#3ecf8e; font-size:0.95rem;">Connected to Supabase Cloud PostgreSQL</strong>
      </div>
      <div style="font-size:0.8rem; color:var(--text-muted); word-break:break-all; margin-bottom:0.5rem;">
        <strong>Project URL:</strong> ${status.url || 'Configured via .env'}
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:0.5rem; font-size:0.75rem; color:var(--text-secondary); margin-top:0.75rem;">
        <span class="badge" style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.25rem 0.5rem; border-radius:4px;">Users: ${status.activeCounts?.users || 0}</span>
        <span class="badge" style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.25rem 0.5rem; border-radius:4px;">Projects: ${status.activeCounts?.projects || 0}</span>
        <span class="badge" style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.25rem 0.5rem; border-radius:4px;">Invoices: ${status.activeCounts?.invoices || 0}</span>
        <span class="badge" style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:0.25rem 0.5rem; border-radius:4px;">Opportunities: ${status.activeCounts?.opportunities || 0}</span>
      </div>
    `;
  } else if (status.configured) {
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#eab308; box-shadow:0 0 8px #eab308;"></span>
        <strong style="color:#eab308; font-size:0.95rem;">Credentials Detected — Schema Needed</strong>
      </div>
      <p style="margin:0 0 0.5rem; font-size:0.8rem; color:var(--text-muted);">${status.message || 'Run supabase-schema.sql in your Supabase SQL Editor.'}</p>
      ${status.hint ? `<p style="margin:0; font-size:0.75rem; color:#eab308;"><strong>Hint:</strong> ${status.hint}</p>` : ''}
    `;
  } else {
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--text-muted);"></span>
        <strong style="font-size:0.95rem;">Running in-memory database</strong>
      </div>
      <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">
        All actions, state transitions, invoices, and audit trails are fully operational in memory. To persist permanently in the cloud, add your Supabase credentials to <code>.env</code>.
      </p>
    `;
  }
}

function openSupabaseModal() {
  openModal('modal-supabase');
  if (currentSupabaseStatus) {
    renderSupabaseModalContent(currentSupabaseStatus);
  } else {
    checkSupabaseStatus();
  }
}

async function seedSupabaseData() {
  const btn = document.getElementById('btn-seed-supabase');
  if (btn) btn.disabled = true;
  showToast('Seeding initial data into Supabase...', 'info');

  try {
    const res = await fetch('/api/supabase/seed', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Sample dataset successfully seeded into Supabase!', 'success');
      await checkSupabaseStatus();
    } else {
      showToast(data.error || 'Failed to seed Supabase', 'warning');
    }
  } catch (e) {
    showToast('Failed to seed Supabase: ' + e.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

window.openSupabaseModal = openSupabaseModal;
window.checkSupabaseStatus = checkSupabaseStatus;
window.seedSupabaseData = seedSupabaseData;

// ==============================================================================
// RESET DEMO DATA CONTROLLER
// ==============================================================================

function confirmResetDemoData() {
  openModal('modal-reset-data');
}

async function executeResetDemoData() {
  const btn = document.getElementById('btn-confirm-reset-data');
  const headerBtn = document.getElementById('btn-header-reset-demo');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> <span>Resetting Data...</span>`;
  }
  if (headerBtn) {
    headerBtn.disabled = true;
    headerBtn.style.opacity = '0.6';
  }

  showToast('Resetting all platform data to initial test state...', 'info');

  try {
    const res = await fetch('/api/reset-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.success) {
      closeModal('modal-reset-data');
      showToast('Platform data has been reset to pristine initial state!', 'success');
      
      // Update Supabase badge & re-sync
      await checkSupabaseStatus();

      // Refresh current view so newly reset state reflects immediately
      routeView(window.location.pathname);
    } else {
      showToast(data.message || 'Failed to reset demo data', 'danger');
    }
  } catch (err) {
    console.error('Error resetting demo data:', err);
    showToast('Failed to reset data: ' + err.message, 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="rotate-ccw" style="width:14px;height:14px;"></i> <span>Confirm &amp; Reset Data</span>`;
    }
    if (headerBtn) {
      headerBtn.disabled = false;
      headerBtn.style.opacity = '1';
    }
    if (window.lucide) window.lucide.createIcons();
  }
}

window.confirmResetDemoData = confirmResetDemoData;
window.executeResetDemoData = executeResetDemoData;

// App Initialization on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  routeView(window.location.pathname);
  checkSupabaseStatus();
});
