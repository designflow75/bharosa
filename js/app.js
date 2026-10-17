/**
 * ==============================================================================
 * BHAROSA — AI-Powered Freelance OS & Trust Platform
 * Shared Real-Time Store, Dual-Perspective Controller & Escrow Automation
 * ==============================================================================
 */

// Storage Keys
const SHARED_STORE_KEY = 'bharosa_shared_store_v2';
const ROLE_STORAGE_KEY = 'bharosa_current_role_v2';

// Default initial state for the shared data store
function getDefaultSharedStore() {
  return {
    // Financial metrics
    stats: {
      monthlyEarnings: 51000, // Settled/disbursed base: 25k (Milestone 1) + 20k (Advance) + 6k (Batch 1 Reels)
      gstSettled: 9180,       // 18% GST collected
      escrowBalance: 20000,   // Currently secured in escrow for Milestone 2
      trustIndex: 99.8,
      milestonesDelivered: "18 of 18 Milestones On-Time"
    },

    // Milestones (Flow: Pending → In Review → Released)
    milestones: [
      {
        id: 'MS-101',
        projectId: 'PRJ-101',
        projectTitle: 'Fintech Mobile App Redesign',
        client: 'GrowthNest Media (Rahul Verma)',
        category: 'Design',
        title: 'Milestone 1: Wireframes & Information Architecture Map',
        amount: 25000,
        status: 'Released', // Pending | In Review | Released
        deadline: 'Oct 14, 2026',
        releasedAt: 'Oct 14, 2026, 17:45 IST',
        submittedAt: 'Oct 12, 2026, 11:30 IST',
        protection: 'Escrow Released'
      },
      {
        id: 'MS-102',
        projectId: 'PRJ-101',
        projectTitle: 'Fintech Mobile App Redesign',
        client: 'GrowthNest Media (Rahul Verma)',
        category: 'Design',
        title: 'Milestone 2: Design System & 3D Assets',
        amount: 20000,
        status: 'In Review', // Currently in review waiting for client approval!
        deadline: 'Oct 24, 2026',
        submittedAt: 'Today, 11:30 IST',
        releasedAt: null,
        protection: 'Escrow Secured (₹20,000 Held)',
        silenceAlert: true
      },
      {
        id: 'MS-103',
        projectId: 'PRJ-101',
        projectTitle: 'Fintech Mobile App Redesign',
        client: 'GrowthNest Media (Rahul Verma)',
        category: 'Design',
        title: 'Milestone 3: Developer Handoff Tokens & Asset Export',
        amount: 20000,
        status: 'Pending', // Pending submission by freelancer
        deadline: 'Nov 05, 2026',
        submittedAt: null,
        releasedAt: null,
        protection: 'Escrow Secured'
      },
      {
        id: 'MS-104',
        projectId: 'PRJ-102',
        projectTitle: 'E-commerce Marketplace Branding',
        client: 'UrbanBazaar Pvt Ltd',
        category: 'Branding',
        title: 'Milestone 1: Identity Guide & Logos',
        amount: 20000,
        status: 'Pending',
        deadline: 'Nov 02, 2026',
        submittedAt: null,
        releasedAt: null,
        protection: 'Revision Guard (1/2 used)'
      },
      {
        id: 'MS-105',
        projectId: 'PRJ-103',
        projectTitle: '12 Instagram Short-Form Reels Campaign',
        client: 'CreatorSpark Studios',
        category: 'Video',
        title: 'Batch 1: First 4 Reels Handover',
        amount: 6000,
        status: 'Released',
        deadline: 'Oct 18, 2026',
        releasedAt: 'Oct 18, 2026, 10:15 IST',
        submittedAt: 'Oct 17, 2026, 16:30 IST',
        protection: 'Milestone Escrow (₹6,000)'
      }
    ],

    // Invoices list
    invoices: [
      {
        id: 'INV-2026-001',
        client: 'GrowthNest Media',
        project: 'Fintech Mobile Redesign — Milestone 1 (Wireframes)',
        baseAmount: 25000,
        gst: 4500,
        total: 29500,
        dueDate: 'Oct 14, 2026',
        status: 'paid',
        milestoneId: 'MS-101'
      },
      {
        id: 'INV-2026-002',
        client: 'UrbanBazaar Pvt Ltd',
        project: 'Marketplace Brand Identity — Retainer Advance',
        baseAmount: 20000,
        gst: 3600,
        total: 23600,
        dueDate: 'Oct 17, 2026',
        status: 'paid',
        milestoneId: null
      },
      {
        id: 'INV-2026-003',
        client: 'CreatorSpark Studios',
        project: '12 Instagram Reels — Batch 1 Initial Handover',
        baseAmount: 6000,
        gst: 1080,
        total: 7080,
        dueDate: 'Oct 18, 2026',
        status: 'paid',
        milestoneId: 'MS-105'
      },
      {
        id: 'INV-2026-004',
        client: 'GrowthNest Media',
        project: 'Fintech Mobile Redesign — Milestone 2 (Design System & 3D)',
        baseAmount: 20000,
        gst: 3600,
        total: 23600,
        dueDate: 'Oct 24, 2026',
        status: 'secured', // Moves to 'paid' when approved!
        milestoneId: 'MS-102'
      }
    ],

    // Cryptographic Evidence Vault audit trail
    evidenceVault: [
      {
        id: 'ev-1',
        timestamp: 'Today, 14:22 IST',
        hash: '8f9b4c2e1a341b5d',
        title: 'Scope Change Request Detected',
        desc: 'Client requested "3D interactive coin animation". AI verified against Initial Agreement (Clause 3.2: 2D Assets only). Cost amendment prepared for ₹6,500.',
        dotColor: 'var(--primary)'
      },
      {
        id: 'ev-2',
        timestamp: 'Yesterday, 09:15 IST',
        hash: '4e1cb892a091d33f',
        title: 'Client Silence Protocol Triggered',
        desc: '72-hour feedback window on Deliverable #3 expired without client response. Contractual deadline paused.',
        dotColor: 'var(--warning)'
      },
      {
        id: 'ev-3',
        timestamp: 'Oct 14, 2026, 17:45 IST',
        hash: 'd22a901e67bf3c88',
        title: 'Milestone 1 Approved & Released',
        desc: 'Wireframe package accepted by Rahul Verma. Payment of ₹25,000 disbursed to freelancer bank account.',
        dotColor: 'var(--success)'
      }
    ],

    // Kanban Tasks
    kanbanTasks: [
      {
        id: 'task-1',
        col: 'backlog',
        title: 'Dark Mode Theme System',
        desc: 'Create accessible high-contrast color tokens and component states.',
        due: 'Due in 4 days',
        milestone: 'Milestone 2',
        tags: [{ label: 'In Scope', cls: 'scope-approved' }, { label: 'Figma', cls: 'design' }]
      },
      {
        id: 'task-2',
        col: 'backlog',
        title: 'User Flow Prototype: KYC',
        desc: 'Interactive click-through prototype for Aadhaar and PAN verification.',
        due: 'Due in 6 days',
        milestone: 'Milestone 2',
        tags: [{ label: 'In Scope', cls: 'scope-approved' }, { label: 'UX Flow', cls: 'design' }]
      },
      {
        id: 'task-3',
        col: 'progress',
        title: 'Interactive 3D Coin Animation',
        desc: 'Client requested 3D Spline interactive asset. Exceeds standard 2D vector scope.',
        due: 'Action Required',
        milestone: 'Amendment Pending',
        tags: [{ label: 'Scope Review', cls: 'scope-warning' }, { label: '+₹6,500', style: 'background:var(--warning-bg); color:var(--warning);' }]
      },
      {
        id: 'task-4',
        col: 'progress', // Moves to 'completed' when MS-102 is approved!
        milestoneId: 'MS-102',
        title: 'Design System Handoff (Milestone 2)',
        desc: 'Typography, micro-spacing scale, and icon library tokens.',
        due: 'Under Review',
        milestone: 'Milestone 2',
        tags: [{ label: 'In Scope', cls: 'scope-approved' }, { label: 'Revision 1/2', style: 'background:var(--primary-light); color:var(--primary);' }]
      },
      {
        id: 'task-5',
        col: 'completed',
        title: 'Wireframe Architecture & Information Map',
        desc: 'Formally signed off by Rahul Verma on Oct 14.',
        due: 'Delivered',
        milestone: '₹25,000 Settled',
        tags: [{ label: 'Approved', cls: 'scope-approved' }, { label: 'Milestone 1', style: 'background:var(--success-bg); color:var(--success);' }]
      },
      {
        id: 'task-6',
        col: 'completed',
        title: 'Competitor UX Research Report',
        desc: 'Benchmarking against Jupiter, Fi Money, and Zerodha.',
        due: 'Archived',
        milestone: 'Verified',
        tags: [{ label: 'Approved', cls: 'scope-approved' }, { label: 'Research', style: 'background:var(--success-bg); color:var(--success);' }]
      }
    ],

    // Job opportunities
    jobs: [
      {
        id: 'JOB-201',
        title: 'Senior Product Designer for Crypto Trading Dashboard',
        client: 'Kuber Exchange',
        category: 'Design',
        budget: '₹85,000 - ₹1,20,000',
        timeline: '4 Weeks',
        matchScore: 98,
        source: 'Bharosa Direct',
        skills: ['Figma', 'Web3', 'Design Systems', 'Micro-interactions'],
        description: 'Looking for a senior product designer to revamp our spot & futures order execution screens.'
      },
      {
        id: 'JOB-202',
        title: 'Full-Stack Next.js 15 & Supabase Engineer',
        client: 'SaaS Launchpad Inc',
        category: 'Engineering',
        budget: '₹95,000 INR',
        timeline: '3 Weeks',
        matchScore: 94,
        source: 'Imported from LinkedIn',
        skills: ['Next.js', 'React', 'Tailwind', 'PostgreSQL'],
        description: 'Build user authentication, billing dashboard, and analytics widgets for a modern B2B SaaS.'
      },
      {
        id: 'JOB-203',
        title: '15 High-Retention Short-Form Reels for AI Tool',
        client: 'AgenticFlow AI',
        category: 'Video',
        budget: '₹28,000 INR',
        timeline: '2 Weeks',
        matchScore: 96,
        source: 'Bharosa Verified',
        skills: ['Premiere Pro', 'After Effects', 'Storyboarding', 'Sound Design'],
        description: 'Need fast-paced, high retention tech explainers with motion graphics and kinetic typography.'
      },
      {
        id: 'JOB-204',
        title: 'Complete Visual Identity & Mobile Guidelines',
        client: 'Pulse Health Technologies',
        category: 'Design',
        budget: '₹55,000 INR',
        timeline: '3 Weeks',
        matchScore: 91,
        source: 'Imported from Upwork',
        skills: ['Branding', 'Typography', 'Figma', 'UI Kit'],
        description: 'Design comprehensive brand guidelines, color harmony, typography tokens, and mobile component kit.'
      }
    ]
  };
}

// Global Shared Store Instance
let store = loadSharedStore();

function loadSharedStore() {
  try {
    const raw = localStorage.getItem(SHARED_STORE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse shared store from localStorage', e);
  }
  const defaultStore = getDefaultSharedStore();
  saveSharedStore(defaultStore);
  return defaultStore;
}

function saveSharedStore(data = store) {
  try {
    localStorage.setItem(SHARED_STORE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save store to localStorage', e);
  }
}

// Reset Demo Data handler
function resetDemoStore() {
  if (confirm('Reset prototype demo state to initial baseline? This resets escrow balances, invoices, and milestones.')) {
    store = getDefaultSharedStore();
    saveSharedStore(store);
    renderAllViews();
    showToast('Demo dataset reset to initial baseline.', 'info');
  }
}

// Multi-Tab Synchronization via 'storage' event
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SHARED_STORE_KEY) {
      store = loadSharedStore();
      renderAllViews();
      showToast('Live update received from other session!', 'info');
    }
    if (e.key === ROLE_STORAGE_KEY) {
      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);
      if (savedRole && savedRole !== state.currentRole) {
        onRoleChange(savedRole, false);
      }
    }
  });
}

// Helper to generate a realistic SHA256 snippet
function generateSha256Hash() {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 16; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${hash.substring(0, 4)}...${hash.substring(12, 16)}`;
}

// Format current timestamp
function formatCurrentTime() {
  const d = new Date();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Today, ${time} IST`;
}

// Application Session State (Local UI state)
const state = {
  theme: (typeof localStorage !== 'undefined' && localStorage.getItem('bharosa_theme')) || 'dark',
  language: 'en',
  currentRole: (typeof localStorage !== 'undefined' && localStorage.getItem(ROLE_STORAGE_KEY)) || 'freelancer',
  currentUser: {
    name: 'Priya Sharma',
    email: 'priya.sharma@bharosa.design',
    title: 'Senior Product Designer',
    avatar: 'PS'
  },
  activeTab: 'dashboard'
};

// ==============================================================================
// 1. THEME & LOCALIZATION MANAGEMENT
// ==============================================================================
function initTheme() {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeUI();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('bharosa_theme', state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeUI();
  showToast(`Switched to ${state.theme.toUpperCase()} Theme`, 'info');
}

function updateThemeUI() {
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (state.theme === 'dark') {
    if (icon) icon.innerHTML = '<i data-lucide="moon" style="width:16px;height:16px;"></i>';
    if (label) label.textContent = 'Dark';
  } else {
    if (icon) icon.innerHTML = '<i data-lucide="sun" style="width:16px;height:16px;"></i>';
    if (label) label.textContent = 'Light';
  }
  if (typeof window !== 'undefined' && window.lucide) window.lucide.createIcons();
}

function toggleLanguage() {
  state.language = state.language === 'en' ? 'hi' : 'en';
  const btn = document.getElementById('btn-lang-toggle');
  const subtitle = document.getElementById('dashboard-welcome-subtitle');
  if (state.language === 'hi') {
    if (btn) btn.textContent = 'EN';
    if (subtitle) subtitle.textContent = 'भरोसा ऑपरेटिंग सिस्टम: अपने प्रोजेक्ट माइलस्टोन, एस्क्रो फंड और टाइमलाइन को सुरक्षित रखें।';
    showToast('हिंदी मोड सक्रिय (Bilingual Mode)', 'info');
  } else {
    if (btn) btn.textContent = 'हिन्दी';
    updateRoleSubtitle();
    showToast('Switched to English', 'info');
  }
}

// ==============================================================================
// 2. AUTHENTICATION & PERSONA SELECTION
// ==============================================================================
function selectPersona(role, name, subtitle) {
  state.currentRole = role;
  state.currentUser.name = name;
  state.currentUser.title = subtitle;
  state.currentUser.avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const emailInput = document.getElementById('user-email');
  if (emailInput) {
    if (role === 'freelancer') emailInput.value = 'priya.sharma@bharosa.design';
    if (role === 'client') emailInput.value = 'rahul.verma@growthnest.media';
    if (role === 'agency') emailInput.value = 'director@apexstudio.agency';
  }
}

function quickLoginAs(role) {
  if (role === 'freelancer') {
    selectPersona('freelancer', 'Priya Sharma', 'Senior Product Designer');
  } else if (role === 'client') {
    selectPersona('client', 'Rahul Verma', 'Client (GrowthNest Media)');
  } else if (role === 'agency') {
    selectPersona('agency', 'Apex Creative', 'Agency Director (8 Members)');
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }
  handleLogin();
}

function toggleCustomLoginForm() {
  const form = document.getElementById('custom-login-form-container');
  if (form) {
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
  }
}

function handleLogin(e) {
  if (e) e.preventDefault();

  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');

  if (authScreen) authScreen.style.display = 'none';
  if (appShell) appShell.classList.add('active');

  updateHeaderProfile();
  renderAllViews();
  showToast(`Welcome back, ${state.currentUser.name}! Bharosa Shield active.`, 'success');
}

function updateHeaderProfile() {
  const nameEl = document.getElementById('nav-user-name');
  const roleEl = document.getElementById('nav-user-role');
  const avatarEl = document.getElementById('nav-user-avatar');
  const unifiedSelector = document.getElementById('unified-role-select');

  if (nameEl) nameEl.textContent = state.currentUser.name;
  if (roleEl) roleEl.textContent = state.currentUser.title;
  if (avatarEl) avatarEl.textContent = state.currentUser.avatar;
  if (unifiedSelector) unifiedSelector.value = state.currentRole;

  updateRoleBanner();
  updateRoleSubtitle();
}

function updateRoleBanner() {
  const banner = document.getElementById('role-perspective-banner');
  if (!banner) return;

  if (state.currentRole === 'client') {
    banner.className = 'role-perspective-banner client';
    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <i data-lucide="briefcase" style="width:16px;height:16px;"></i>
        <span><strong>Client Mode (Rahul Verma — GrowthNest Media)</strong>: Review contractor deliverables and release payments from secure escrow.</span>
      </div>
      <button class="btn-tag" style="background:var(--info); color:white;" onclick="switchTab('client-portal')">View Client Hub →</button>
    `;
  } else if (state.currentRole === 'agency') {
    banner.className = 'role-perspective-banner agency';
    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <i data-lucide="building-2" style="width:16px;height:16px;"></i>
        <span><strong>Agency Mode (Apex Creative)</strong>: Managing 8 team members across 3 active client engagements and aggregated payouts.</span>
      </div>
      <button class="btn-tag" style="background:#a855f7; color:white;" onclick="switchTab('client-portal')">Agency Portal →</button>
    `;
  } else {
    banner.className = 'role-perspective-banner freelancer';
    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <i data-lucide="shield-check" style="width:16px;height:16px;"></i>
        <span><strong>Freelancer Mode (Priya Sharma)</strong>: Bharosa Shield is actively monitoring 72-hour review windows and revision quotas.</span>
      </div>
      <button class="btn-tag" style="background:var(--success); color:white;" onclick="switchTab('protection')">Evidence Vault →</button>
    `;
  }
  if (typeof window !== 'undefined' && window.lucide) window.lucide.createIcons();
}

function updateRoleSubtitle() {
  const subtitle = document.getElementById('dashboard-welcome-subtitle');
  if (!subtitle) return;
  if (state.currentRole === 'client') {
    subtitle.textContent = 'Review contractor deliverables, approve milestone sign-offs, and release escrow funds.';
  } else if (state.currentRole === 'agency') {
    subtitle.textContent = 'Monitor team capacity, distribute milestones, and review unified billing records.';
  } else {
    subtitle.textContent = 'Manage client milestones, monitor scope change alerts, and track verified payouts.';
  }
}

function onRoleChange(newRole, saveToStorage = true) {
  state.currentRole = newRole;
  if (saveToStorage && typeof localStorage !== 'undefined') {
    localStorage.setItem(ROLE_STORAGE_KEY, newRole);
  }

  if (newRole === 'client') {
    state.currentUser.name = 'Rahul Verma';
    state.currentUser.title = 'Client (GrowthNest Media)';
    state.currentUser.avatar = 'RV';
  } else if (newRole === 'agency') {
    state.currentUser.name = 'Apex Creative';
    state.currentUser.title = 'Agency Director (8 Members)';
    state.currentUser.avatar = 'AC';
  } else {
    state.currentUser.name = 'Priya Sharma';
    state.currentUser.title = 'Senior Product Designer';
    state.currentUser.avatar = 'PS';
  }

  updateHeaderProfile();
  renderAllViews();
  showToast(`Switched perspective to ${newRole.toUpperCase()} Mode`, 'info');
}

function confirmLogout() {
  if (confirm('Do you want to log out from this Bharosa workspace?')) {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell');
    if (appShell) appShell.classList.remove('active');
    if (authScreen) authScreen.style.display = 'flex';
    showToast('Logged out securely.', 'info');
  }
}

// ==============================================================================
// 3. TAB NAVIGATION
// ==============================================================================
function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(`view-${tabId}`);
  if (target) {
    target.classList.add('active');
  }

  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ==============================================================================
// 4. ESCROW STEPPER & DASHBOARD RENDERING
// ==============================================================================
function getEscrowStepperHtml(escrowState) {
  const steps = [
    { id: 'funded', label: 'Funded' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'released', label: 'Released' }
  ];

  let currentIndex = 1;
  if (escrowState === 'funded') currentIndex = 0;
  if (escrowState === 'in_progress') currentIndex = 1;
  if (escrowState === 'review') currentIndex = 2;
  if (escrowState === 'released') currentIndex = 3;

  return `
    <div class="escrow-stepper">
      ${steps.map((s, idx) => {
        let cls = '';
        if (idx < currentIndex) cls = 'done';
        else if (idx === currentIndex) cls = 'active';
        return `
          <span class="escrow-step ${cls}">
            <span class="escrow-step-dot"></span>
            <span>${s.label}</span>
          </span>
          ${idx < steps.length - 1 ? '<span class="escrow-step-sep">›</span>' : ''}
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render Active Project Pipeline & Milestones Table
 * Dual role behavior:
 * - Freelancer: Shows all milestones with their status, "Submit for Review" on Pending, "Paid" badge on Released
 * - Client: Shows ONLY the milestones waiting for approval with "Approve & Release Payment" button
 */
function renderDashboardProjects() {
  const tbody = document.getElementById('dashboard-projects-body');
  const tableTitle = document.getElementById('dashboard-projects-title');
  const theadTr = document.getElementById('dashboard-projects-thead-tr');
  if (!tbody) return;

  const isClient = state.currentRole === 'client';

  if (tableTitle) {
    tableTitle.textContent = isClient 
      ? 'Milestones Awaiting Approval (Action Required)' 
      : 'Active Project Pipeline & Milestones';
  }

  if (theadTr) {
    if (isClient) {
      theadTr.innerHTML = `
        <th>Project Name</th>
        <th>Contractor</th>
        <th>Milestone Deliverable</th>
        <th>Review Deadline</th>
        <th>Escrow Amount</th>
        <th>Escrow Status</th>
        <th>Action</th>
      `;
    } else {
      theadTr.innerHTML = `
        <th>Project Name</th>
        <th>Client</th>
        <th>Next Milestone & Escrow Status</th>
        <th>Review Deadline</th>
        <th>Amount</th>
        <th>Trust Protection</th>
        <th>Action</th>
      `;
    }
  }

  if (isClient) {
    // Client view: ONLY milestones waiting for approval (status === 'In Review')
    const waitingMilestones = store.milestones.filter(m => m.status === 'In Review');

    if (waitingMilestones.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="table-empty-state">
              <div class="table-empty-icon">✓</div>
              <div class="table-empty-title">All Milestones Reviewed</div>
              <div class="table-empty-desc">No milestones are currently awaiting your approval. You will be notified as soon as Priya Sharma submits deliverables for review.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = waitingMilestones.map(m => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${m.projectTitle}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${m.projectId} • ${m.category}</div>
        </td>
        <td>
          <div style="font-weight: 600;">Priya Sharma (Senior Product Designer)</div>
        </td>
        <td>
          <div style="font-size: 0.82rem; font-weight: 600;">${m.title}</div>
          ${getEscrowStepperHtml('review')}
        </td>
        <td>
          <div style="font-size: 0.82rem; font-weight: 600; color: var(--warning);">
            ${m.deadline} ⚠️ (Review Pending)
          </div>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--primary);">₹${m.amount.toLocaleString('en-IN')}</div>
        </td>
        <td>
          <span class="status-pill pending">
            In Review • Funds Secured
          </span>
        </td>
        <td>
          <button class="btn-tag" style="background:var(--success); color:white; font-weight:700; padding:6px 14px;" onclick="approveMilestone('${m.id}')">
            Approve & Release Payment
          </button>
        </td>
      </tr>
    `).join('');

  } else {
    // Freelancer view (Priya Sharma): Shows all milestones with their status
    if (store.milestones.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="table-empty-state">
              <div class="table-empty-icon">📁</div>
              <div class="table-empty-title">No Active Milestones in Pipeline</div>
              <div class="table-empty-desc">Create your first milestone agreement or import an opportunity.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = store.milestones.map(m => {
      let statusPillHtml = '';
      let actionBtnHtml = '';
      let stepperState = 'in_progress';

      if (m.status === 'Released') {
        stepperState = 'released';
        statusPillHtml = `
          <span class="status-pill paid" title="Funds released to bank account">
            Paid • ${m.releasedAt || 'Oct 14, 17:45'}
          </span>
        `;
        actionBtnHtml = `<span style="font-size:0.75rem; color:var(--success); font-weight:700;">✓ Settled</span>`;
      } else if (m.status === 'In Review') {
        stepperState = 'review';
        statusPillHtml = `
          <span class="status-pill pending" style="background:var(--warning-bg); color:var(--warning); border:1px solid var(--warning-border);">
            In Review
          </span>
        `;
        actionBtnHtml = `<span style="font-size:0.75rem; color:var(--warning); font-weight:600;">Waiting for Client Approval</span>`;
      } else {
        // Pending
        stepperState = 'funded';
        statusPillHtml = `
          <span class="status-pill draft">
            Pending
          </span>
        `;
        actionBtnHtml = `
          <button class="btn-tag" style="background:var(--primary); color:white; font-weight:700;" onclick="submitMilestoneForReview('${m.id}')">
            Submit for Review
          </button>
        `;
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-primary);">${m.projectTitle}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${m.projectId} • ${m.category}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${m.client}</div>
          </td>
          <td>
            <div style="font-size: 0.82rem; font-weight: 600;">${m.title}</div>
            ${getEscrowStepperHtml(stepperState)}
          </td>
          <td>
            <div style="font-size: 0.82rem; font-weight: 600; color: ${m.silenceAlert && m.status !== 'Released' ? 'var(--warning)' : 'var(--text-secondary)'};">
              ${m.deadline} ${m.silenceAlert && m.status !== 'Released' ? '⚠️ (Paused at 72h)' : ''}
            </div>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--primary);">₹${m.amount.toLocaleString('en-IN')}</div>
          </td>
          <td>
            ${statusPillHtml}
          </td>
          <td>
            ${actionBtnHtml}
          </td>
        </tr>
      `;
    }).join('');
  }

  if (typeof window !== 'undefined' && window.lucide) window.lucide.createIcons();
}

/**
 * Render Dashboard Metric Cards from Shared Store
 */
function renderDashboardStats() {
  const statSettled = document.getElementById('stat-settled-earnings');
  const statEscrow = document.getElementById('stat-escrow-payouts');
  const statTrust = document.getElementById('stat-trust-index');
  const statTrustFooter = document.getElementById('stat-trust-footer');
  const invoicesTotalDisp = document.getElementById('invoices-total-display');

  const statTitleSettled = document.getElementById('stat-title-settled');
  const statTitleEscrow = document.getElementById('stat-title-escrow');

  const isClient = state.currentRole === 'client';

  if (statTitleSettled) {
    statTitleSettled.textContent = isClient ? 'Total Released to Contractors' : 'Monthly Settled Earnings';
  }
  if (statTitleEscrow) {
    statTitleEscrow.textContent = isClient ? 'Escrow Deposited' : 'Protected in Escrow (Pending)';
  }

  if (statSettled) statSettled.textContent = `₹${store.stats.monthlyEarnings.toLocaleString('en-IN')}`;
  if (statEscrow) statEscrow.textContent = `₹${store.stats.escrowBalance.toLocaleString('en-IN')}`;
  if (statTrust) statTrust.textContent = `${store.stats.trustIndex}%`;
  if (statTrustFooter) statTrustFooter.textContent = store.stats.milestonesDelivered;

  if (invoicesTotalDisp) {
    invoicesTotalDisp.textContent = `Total Settled: ₹${store.stats.monthlyEarnings.toLocaleString('en-IN')} | In Escrow: ₹${store.stats.escrowBalance.toLocaleString('en-IN')}`;
  }
}

/**
 * Render Kanban Board from Shared Store
 */
function renderKanban() {
  const colBacklog = document.getElementById('kanban-backlog');
  const colProgress = document.getElementById('kanban-progress');
  const colCompleted = document.getElementById('kanban-completed');
  const countBacklog = document.getElementById('col-count-backlog');
  const countProgress = document.getElementById('col-count-progress');
  const countCompleted = document.getElementById('col-count-completed');

  if (!colBacklog || !colProgress || !colCompleted) return;

  const tasks = store.kanbanTasks || [];

  const backlogTasks = tasks.filter(t => t.col === 'backlog');
  const progressTasks = tasks.filter(t => t.col === 'progress');
  const completedTasks = tasks.filter(t => t.col === 'completed');

  if (countBacklog) countBacklog.textContent = backlogTasks.length;
  if (countProgress) countProgress.textContent = progressTasks.length;
  if (countCompleted) countCompleted.textContent = completedTasks.length;

  const renderTaskCard = (t) => `
    <div class="task-card" onclick="inspectTask('${t.title}')">
      <div class="task-tags">
        ${(t.tags || []).map(tag => `<span class="tag-badge ${tag.cls || ''}" style="${tag.style || ''}">${tag.label}</span>`).join('')}
      </div>
      <div class="task-title">${t.title}</div>
      <div class="task-desc">${t.desc}</div>
      <div class="task-meta">
        <span class="task-due">${t.due}</span>
        <span style="font-weight: 700;">${t.milestone}</span>
      </div>
    </div>
  `;

  colBacklog.innerHTML = backlogTasks.map(renderTaskCard).join('');
  colProgress.innerHTML = progressTasks.map(renderTaskCard).join('');
  colCompleted.innerHTML = completedTasks.map(renderTaskCard).join('');
}

/**
 * Render Evidence Vault Audit Trail from Shared Store
 */
function renderEvidenceVault() {
  const container = document.getElementById('vault-timeline-container');
  if (!container) return;

  const logs = store.evidenceVault || [];
  container.innerHTML = logs.map(ev => `
    <div class="vault-event-card">
      <div class="vault-event-dot" style="background: ${ev.dotColor || 'var(--primary)'};"></div>
      <div class="vault-event-header">
        <span>${ev.timestamp}</span>
        <span class="vault-hash-badge">SHA256: ${ev.hash}</span>
      </div>
      <div class="vault-event-title">${ev.title}</div>
      <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">
        ${ev.desc}
      </p>
    </div>
  `).join('');
}

/**
 * Render Client Portal Preview from Shared Store
 */
function renderClientPortalPreview() {
  const escrowDisp = document.getElementById('portal-escrow-disp');
  const approvedDisp = document.getElementById('portal-approved-disp');
  const stepperDisp = document.getElementById('portal-stepper-disp');
  const btnApproval = document.getElementById('btn-portal-approval');

  const m2 = store.milestones.find(m => m.id === 'MS-102');
  const isM2Released = m2 && m2.status === 'Released';

  if (escrowDisp) {
    escrowDisp.textContent = `₹${store.stats.escrowBalance.toLocaleString('en-IN')} Held`;
  }

  if (approvedDisp) {
    approvedDisp.textContent = isM2Released ? '8 / 8 Items' : '4 / 8 Items';
  }

  if (stepperDisp) {
    if (isM2Released) {
      stepperDisp.innerHTML = `
        <span class="escrow-step done"><span class="escrow-step-dot"></span><span>1. Funded (₹20,000)</span></span>
        <span class="escrow-step-sep">───</span>
        <span class="escrow-step done"><span class="escrow-step-dot"></span><span>2. In Progress</span></span>
        <span class="escrow-step-sep">───</span>
        <span class="escrow-step done"><span class="escrow-step-dot"></span><span>3. Client Review</span></span>
        <span class="escrow-step-sep">───</span>
        <span class="escrow-step active"><span class="escrow-step-dot"></span><span>4. Released</span></span>
      `;
    } else {
      stepperDisp.innerHTML = `
        <span class="escrow-step done"><span class="escrow-step-dot"></span><span>1. Funded (₹20,000)</span></span>
        <span class="escrow-step-sep">───</span>
        <span class="escrow-step done"><span class="escrow-step-dot"></span><span>2. In Progress</span></span>
        <span class="escrow-step-sep">───</span>
        <span class="escrow-step active"><span class="escrow-step-dot"></span><span>3. Client Review</span></span>
        <span class="escrow-step-sep">───</span>
        <span class="escrow-step"><span class="escrow-step-dot"></span><span>4. Released</span></span>
      `;
    }
  }

  if (btnApproval) {
    if (isM2Released) {
      btnApproval.textContent = 'Milestone 2 Released & Settled ✓';
      btnApproval.className = 'btn-secondary';
      btnApproval.style.opacity = '0.7';
      btnApproval.style.cursor = 'default';
      btnApproval.disabled = true;
    } else {
      btnApproval.textContent = 'Approve & Release Payment (₹20,000)';
      btnApproval.className = 'btn-primary';
      btnApproval.style.opacity = '1';
      btnApproval.style.cursor = 'pointer';
      btnApproval.disabled = false;
    }
  }
}

/**
 * Render Invoices Table from Shared Store
 */
function renderInvoices() {
  const tbody = document.getElementById('invoices-table-body');
  if (!tbody) return;

  const invoices = store.invoices || [];

  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="table-empty-state">
            <div class="table-empty-icon">💳</div>
            <div class="table-empty-title">No Invoices Issued Yet</div>
            <div class="table-empty-desc">Generate your first milestone invoice with 18% GST calculation and escrow protection.</div>
            <button class="btn-primary" style="margin: 0 auto; width: auto;" onclick="openCreateInvoiceModal()">+ Create Milestone Invoice</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = invoices.map(inv => `
    <tr>
      <td>
        <strong style="color: var(--primary);">${inv.id}</strong>
      </td>
      <td>${inv.client}</td>
      <td>
        <div style="font-size: 0.82rem; font-weight: 600;">${inv.project}</div>
      </td>
      <td>₹${inv.baseAmount.toLocaleString('en-IN')}</td>
      <td style="color: var(--text-muted);">₹${inv.gst.toLocaleString('en-IN')}</td>
      <td style="font-weight: 800;">₹${inv.total.toLocaleString('en-IN')}</td>
      <td>${inv.dueDate}</td>
      <td>
        <span class="status-pill ${inv.status}">
          ${inv.status === 'paid' ? 'Settled' : (inv.status === 'secured' ? 'In Escrow' : 'Awaiting')}
        </span>
      </td>
      <td>
        <button class="btn-tag" onclick="showToast('Invoice ${inv.id} PDF downloaded.', 'info')">PDF</button>
      </td>
    </tr>
  `).join('');
}

// Master View Render
function renderAllViews() {
  renderDashboardStats();
  renderDashboardProjects();
  renderKanban();
  renderEvidenceVault();
  renderClientPortalPreview();
  renderJobsList(store.jobs || []);
  renderInvoices();
  if (typeof window !== 'undefined' && window.lucide) window.lucide.createIcons();
}

// ==============================================================================
// 5. CORE ESCROW ACTIONS (APPROVE & RELEASE, SUBMIT FOR REVIEW)
// ==============================================================================

/**
 * Client Approves & Releases Milestone
 * Executed when:
 * 1. Client taps "Approve & Release Payment" on dashboard
 * 2. Client taps "Simulate Client Approval" in client portal view
 * 3. Guided demo step 4 executes
 */
function approveMilestone(milestoneId) {
  const m = store.milestones.find(item => item.id === milestoneId);
  if (!m) return;

  if (m.status === 'Released') {
    showToast(`Milestone ${m.title} is already released and settled.`, 'info');
    return;
  }

  // 1. Status becomes Released with timestamp
  m.status = 'Released';
  m.releasedAt = formatCurrentTime();
  m.silenceAlert = false;

  // 2. Escrow balance goes down
  store.stats.escrowBalance = Math.max(0, store.stats.escrowBalance - m.amount);

  // 3. Freelancer earnings go up
  store.stats.monthlyEarnings += m.amount;

  // 4. Corresponding invoice moves from Pending/Secured to Paid
  const inv = store.invoices.find(i => i.milestoneId === milestoneId || i.id === 'INV-2026-004');
  if (inv) {
    inv.status = 'paid';
  }

  // 5. New entry added to Evidence Vault trail with timestamp and hash
  const newHash = generateSha256Hash();
  store.evidenceVault.unshift({
    id: 'ev-' + Date.now(),
    timestamp: formatCurrentTime(),
    hash: newHash,
    title: `${m.title} Approved & Released`,
    desc: `Deliverables verified & accepted by client Rahul Verma. ₹${m.amount.toLocaleString('en-IN')} escrow payout released to freelancer Priya Sharma.`,
    dotColor: 'var(--success)'
  });

  // 6. Kanban card moves to "Approved & Completed"
  const task = store.kanbanTasks.find(t => t.milestoneId === milestoneId || t.id === 'task-4');
  if (task) {
    task.col = 'completed';
    task.due = 'Delivered';
    task.milestone = `₹${m.amount.toLocaleString('en-IN')} Settled`;
    task.tags = [
      { label: 'Approved', cls: 'scope-approved' },
      { label: 'Milestone 2', style: 'background:var(--success-bg); color:var(--success);' }
    ];
  }

  // 7. Save to shared localStorage and notify other tabs
  saveSharedStore();

  // 8. Re-render UI
  renderAllViews();

  showToast(`✓ Payment approved! ₹${m.amount.toLocaleString('en-IN')} escrow released to Priya Sharma.`, 'success');
}

/**
 * Freelancer Submits Milestone for Client Review
 */
function submitMilestoneForReview(milestoneId) {
  const m = store.milestones.find(item => item.id === milestoneId);
  if (!m) return;

  m.status = 'In Review';
  m.submittedAt = formatCurrentTime();

  // Add Evidence Vault entry
  const newHash = generateSha256Hash();
  store.evidenceVault.unshift({
    id: 'ev-' + Date.now(),
    timestamp: formatCurrentTime(),
    hash: newHash,
    title: `Deliverables Submitted: ${m.title}`,
    desc: `Priya Sharma uploaded deliverable assets for ${m.projectTitle}. 72-hour review window initiated for client Rahul Verma.`,
    dotColor: 'var(--warning)'
  });

  // Save to shared localStorage and notify other tabs
  saveSharedStore();

  // Re-render UI
  renderAllViews();

  showToast(`Deliverables for ${m.title} submitted for review!`, 'success');
}

// ==============================================================================
// 6. GUIDED INTERACTIVE 4-STEP DEMO
// ==============================================================================
function runGuidedDemo(step = 1) {
  document.querySelectorAll('.guided-step-item').forEach((item, idx) => {
    if (idx + 1 === step) item.classList.add('current');
    else item.classList.remove('current');
  });

  if (step === 1) {
    showToast('Step 1: Client sent an out-of-scope request ("3D Spline interactive coin")', 'warning');
    switchTab('projects');
    const taskCard = document.querySelector('#kanban-progress .task-card');
    if (taskCard) {
      taskCard.style.outline = '2px solid var(--warning)';
      taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => taskCard.style.outline = 'none', 3000);
    }
  } else if (step === 2) {
    showToast('Step 2: AI Scope Amendment generated (+₹6,500 & +2 Days)', 'info');
    openScopeChangeModal();
  } else if (step === 3) {
    closeModal('modal-scope-change');
    store.stats.escrowBalance += 6500;
    saveSharedStore();
    renderAllViews();
    showToast('Step 3: Client Rahul Verma deposited ₹6,500 into secure escrow!', 'success');
  } else if (step === 4) {
    approveMilestone('MS-102');
  }
}

// ==============================================================================
// 7. AI PROJECT ASSISTANT & SCOPE SCRIBING
// ==============================================================================
const promptTemplates = {
  reels: "I need 12 Instagram reels, each under 30 seconds, delivered over three weeks. My budget is ₹18,000.",
  fintech: "We need a complete UX audit and Figma prototype for our mobile fintech app, including biometric authentication and KYC flows. Total budget is ₹65,000 with milestone payments.",
  branding: "Brand identity package for a cloud developer tooling startup. We need logo marks, color tokens, typography guide, and social media presentation kit. Budget ₹40,000."
};

function applyPromptChip(key) {
  const input = document.getElementById('ai-prompt-input');
  if (input && promptTemplates[key]) {
    input.value = promptTemplates[key];
    input.focus();
  }
}

function clearAiInput() {
  const input = document.getElementById('ai-prompt-input');
  if (input) input.value = '';
}

function runAiScoper() {
  const input = document.getElementById('ai-prompt-input');
  const text = input ? input.value.trim() : '';

  if (!text) {
    showToast('Please type or select a client prompt first.', 'warning');
    return;
  }

  showToast('AI Analyzing requirements & structuring milestones...', 'info');

  const badge = document.getElementById('sow-status-badge');
  if (badge) badge.textContent = 'Generating...';

  setTimeout(() => {
    if (badge) badge.textContent = 'Contract Ready';

    let title = 'Custom Freelance Project Brief';
    let budget = 25000;
    let deliverables = [];

    if (text.toLowerCase().includes('reels') || text.toLowerCase().includes('video')) {
      title = '12 Instagram Short-Form Reels Campaign';
      budget = 18000;
      deliverables = [
        { name: 'Batch 1: First 4 Reels (Concept & Hook Strategy)', price: '₹6,000 (33%)' },
        { name: 'Batch 2: Mid-Campaign 4 Reels (Revisions Applied)', price: '₹6,000 (33%)' },
        { name: 'Batch 3: Final 4 Reels & Source File Handover', price: '₹6,000 (33%)' }
      ];
    } else if (text.toLowerCase().includes('fintech') || text.toLowerCase().includes('app')) {
      title = 'Fintech Mobile UI & Interactive KYC Prototype';
      budget = 65000;
      deliverables = [
        { name: 'Milestone 1: Wireframes & Information Architecture Map', price: '₹25,000 (38%)' },
        { name: 'Milestone 2: Design System & Interactive KYC Figma Prototype', price: '₹25,000 (38%)' },
        { name: 'Milestone 3: Developer Handoff Tokens & Asset Export', price: '₹15,000 (24%)' }
      ];
    } else {
      title = 'Branding & Design System Architecture';
      budget = 40000;
      deliverables = [
        { name: 'Milestone 1: Brand Discovery & 3 Core Visual Directions', price: '₹15,000 (37.5%)' },
        { name: 'Milestone 2: Final Vector Assets & Typography Guide', price: '₹15,000 (37.5%)' },
        { name: 'Milestone 3: Social & Marketing Presentation Collateral', price: '₹10,000 (25%)' }
      ];
    }

    const titleEl = document.getElementById('out-project-title');
    if (titleEl) titleEl.textContent = title;

    const outBody = document.getElementById('ai-sow-output');
    if (outBody) {
      outBody.innerHTML = `
        <div class="sow-section">
          <h5>1. Project Identification</h5>
          <p style="font-size: 0.88rem; font-weight: 600;">${title}</p>
          <p style="font-size: 0.78rem; color: var(--text-muted);">Total Value: ₹${budget.toLocaleString('en-IN')} INR • Est. Delivery: 2-3 Weeks</p>
        </div>

        <div class="sow-section">
          <h5>2. Proposed Milestones & Payment Schedule</h5>
          ${deliverables.map(d => `
            <div class="sow-deliverable-item">
              <span>${d.name}</span>
              <strong style="color: var(--primary);">${d.price}</strong>
            </div>
          `).join('')}
        </div>

        <div class="sow-section">
          <h5>3. Scope Protection Guardrails</h5>
          <ul style="font-size: 0.8rem; color: var(--text-secondary); padding-left: 1.25rem; line-height: 1.5;">
            <li>Includes up to <strong>2 rounds of revisions</strong> per milestone.</li>
            <li>Out-of-scope requests trigger automatic Bharosa Scope Amendment.</li>
            <li>Client review turnaround: 72 hours before silence protection triggers.</li>
          </ul>
        </div>
      `;
    }

    showToast('SOW and Milestone breakdown created!', 'success');
  }, 600);
}

function createProjectFromAi() {
  const title = document.getElementById('out-project-title')?.textContent || 'New Project';
  const newMs = {
    id: `MS-${Math.floor(100 + Math.random() * 900)}`,
    projectId: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
    projectTitle: title,
    client: 'Direct Client (Via Bharosa Brief)',
    category: 'Design & Content',
    title: 'Milestone 1: Kickoff & Initial Assets',
    amount: 18000,
    status: 'Pending',
    deadline: 'Nov 10, 2026',
    submittedAt: null,
    releasedAt: null,
    protection: 'Escrow Secured (₹18,000)'
  };

  store.milestones.unshift(newMs);
  saveSharedStore();
  renderAllViews();
  showToast(`Contract created: ${title}! Added to workspace.`, 'success');
  switchTab('dashboard');
}

// ==============================================================================
// 8. JOB DISCOVERY & URL IMPORTER
// ==============================================================================
function renderJobsList(jobsToRender) {
  const container = document.getElementById('jobs-container');
  if (!container) return;

  container.innerHTML = jobsToRender.map(j => `
    <div class="card-section" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span class="brand-badge" style="background: var(--primary-light); color: var(--primary);">${j.source}</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--success);">${j.matchScore}% Match</span>
        </div>
        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--text-primary);">${j.title}</h4>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          Client: <strong>${j.client}</strong> • Duration: ${j.timeline}
        </div>
        <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 1rem;">
          ${j.description}
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1.25rem;">
          ${j.skills.map(s => `<span class="btn-tag" style="padding: 2px 8px; font-size: 0.7rem;">${s}</span>`).join('')}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Agreed Range</div>
          <div style="font-size: 1rem; font-weight: 800; color: var(--primary);">${j.budget}</div>
        </div>
        <button class="btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.82rem;" onclick="applyForJob('${j.title}')">
          Apply with Bharosa
        </button>
      </div>
    </div>
  `).join('');
}

function filterJobs(query) {
  const q = query.toLowerCase();
  const filtered = (store.jobs || []).filter(j => 
    j.title.toLowerCase().includes(q) ||
    j.description.toLowerCase().includes(q) ||
    j.skills.some(s => s.toLowerCase().includes(q))
  );
  renderJobsList(filtered);
}

function filterJobCategory(cat, btn) {
  document.querySelectorAll('.tab-pills .tab-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (cat === 'all') {
    renderJobsList(store.jobs || []);
  } else {
    const filtered = (store.jobs || []).filter(j => j.category === cat);
    renderJobsList(filtered);
  }
}

function applyForJob(jobTitle) {
  showToast(`Application proposal sent with Bharosa Protection for: ${jobTitle}`, 'success');
}

// Modal Handlers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function openUrlImportModal() {
  openModal('modal-url-importer');
}

function setDemoUrl(source) {
  const input = document.getElementById('import-url-input');
  if (source === 'upwork') {
    input.value = 'https://upwork.com/jobs/senior-ui-ux-mobile-reels-creator-fintech';
  } else {
    input.value = 'https://linkedin.com/jobs/view/lead-brand-designer-series-a-394819';
  }
}

function processUrlImport() {
  const input = document.getElementById('import-url-input');
  const resCard = document.getElementById('url-parsing-result');
  const btn = document.getElementById('btn-run-url-parse');

  if (!input.value) {
    showToast('Please provide a URL to import.', 'warning');
    return;
  }

  btn.textContent = 'Extracting...';

  setTimeout(() => {
    btn.textContent = 'Create Bharosa Opportunity';
    if (resCard) resCard.style.display = 'block';

    btn.onclick = () => {
      showToast('External job imported into Bharosa Workspace! Draft proposal ready.', 'success');
      closeModal('modal-url-importer');
      switchTab('job-discovery');
    };
  }, 700);
}

// ==============================================================================
// 9. SCOPE AMENDMENT & MODALS
// ==============================================================================
function openScopeChangeModal() {
  openModal('modal-scope-change');
}

function submitScopeAmendment() {
  showToast('Formal Scope Change Request (+₹6,500) sent to client Rahul Verma.', 'success');
  closeModal('modal-scope-change');
}

function openDisputeModal() {
  openModal('modal-dispute-assistant');
}

function inspectTask(taskTitle) {
  showToast(`Inspecting deliverable: ${taskTitle}. Evidence hash verified.`, 'info');
}

function openAddTaskModal() {
  const title = prompt('Enter deliverable task name:');
  if (title) {
    store.kanbanTasks.unshift({
      id: 'task-' + Date.now(),
      col: 'backlog',
      title: title,
      desc: 'Added to active project milestone deliverables.',
      due: 'Due in 5 days',
      milestone: 'Milestone 2',
      tags: [{ label: 'In Scope', cls: 'scope-approved' }]
    });
    saveSharedStore();
    renderKanban();
    showToast(`Task "${title}" added to Scope & Backlog!`, 'success');
  }
}

function openCreateInvoiceModal() {
  openModal('modal-create-invoice');
  calculateInvoiceTotal();
}

function calculateInvoiceTotal() {
  const base = parseFloat(document.getElementById('inv-base-amount')?.value || 0);
  const rate = parseFloat(document.getElementById('inv-gst-rate')?.value || 0.18);
  const gst = base * rate;
  const total = base + gst;

  const subEl = document.getElementById('inv-subtotal-disp');
  const gstEl = document.getElementById('inv-gst-disp');
  const totEl = document.getElementById('inv-total-disp');

  if (subEl) subEl.textContent = `₹${base.toLocaleString('en-IN')}`;
  if (gstEl) gstEl.textContent = `₹${gst.toLocaleString('en-IN')}`;
  if (totEl) totEl.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function saveGeneratedInvoice() {
  const project = document.getElementById('inv-project-select')?.value || 'Client Project';
  const milestone = document.getElementById('inv-milestone-title')?.value || 'Milestone';
  const base = parseFloat(document.getElementById('inv-base-amount')?.value || 20000);
  const rate = parseFloat(document.getElementById('inv-gst-rate')?.value || 0.18);
  const gst = base * rate;
  const total = base + gst;

  const newInv = {
    id: `INV-2026-00${store.invoices.length + 1}`,
    client: project.includes('GrowthNest') ? 'GrowthNest Media' : (project.includes('UrbanBazaar') ? 'UrbanBazaar' : 'Pulse Health'),
    project: milestone,
    baseAmount: base,
    gst: gst,
    total: total,
    dueDate: 'Nov 05, 2026',
    status: 'pending'
  };

  store.invoices.unshift(newInv);
  saveSharedStore();
  renderInvoices();
  closeModal('modal-create-invoice');
  showToast(`Invoice ${newInv.id} generated and issued with GST compliance!`, 'success');
}

// Global Search
function handleGlobalSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderAllViews();
    return;
  }

  const filteredMilestones = store.milestones.filter(m =>
    m.projectTitle.toLowerCase().includes(query) ||
    m.client.toLowerCase().includes(query) ||
    m.title.toLowerCase().includes(query)
  );

  const tbody = document.getElementById('dashboard-projects-body');
  if (tbody) {
    if (filteredMilestones.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No matching projects found for "${query}"</td></tr>`;
    } else {
      tbody.innerHTML = filteredMilestones.map(m => `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-primary);">${m.projectTitle}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${m.projectId}</div>
          </td>
          <td>${m.client}</td>
          <td>${m.title}</td>
          <td>${m.deadline}</td>
          <td>₹${m.amount.toLocaleString('en-IN')}</td>
          <td><span class="status-pill secured">${m.protection}</span></td>
          <td><button class="btn-tag" onclick="switchTab('projects')">Workspace</button></td>
        </tr>
      `).join('');
    }
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'warning') icon = '⚠️';
  if (type === 'danger') icon = '🚨';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  if (type === 'success') toast.style.borderLeftColor = 'var(--success)';
  if (type === 'warning') toast.style.borderLeftColor = 'var(--warning)';
  if (type === 'danger') toast.style.borderLeftColor = 'var(--danger)';

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Global click & key listeners
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });
}

// Document Ready Initialization
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    // Initialize role based on saved state or default
    const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) || 'freelancer';
    state.currentRole = savedRole;
    if (savedRole === 'client') {
      selectPersona('client', 'Rahul Verma', 'Client (GrowthNest Media)');
    } else if (savedRole === 'agency') {
      selectPersona('agency', 'Apex Creative', 'Agency Director (8 Members)');
    } else {
      selectPersona('freelancer', 'Priya Sharma', 'Senior Product Designer');
    }

    renderAllViews();
    updateHeaderProfile();
    if (window.lucide) window.lucide.createIcons();
  });
}

// Export for Node/testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    store,
    state,
    getDefaultSharedStore,
    approveMilestone,
    submitMilestoneForReview,
    resetDemoStore
  };
}
