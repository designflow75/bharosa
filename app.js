/**
 * ==============================================================================
 * BHAROSA — AI-Powered Freelance OS & Trust Platform
 * Application Core Logic, State Management, and Interactive Handlers
 * ==============================================================================
 */

// Application State
const state = {
  theme: localStorage.getItem('bharosa_theme') || 'dark',
  currentRole: 'freelancer', // 'freelancer' | 'client' | 'agency'
  currentUser: {
    name: 'Priya Sharma',
    email: 'priya.sharma@bharosa.design',
    title: 'Senior Product & Motion Designer',
    avatar: 'PS'
  },
  activeTab: 'dashboard',
  projects: [
    {
      id: 'PRJ-101',
      title: 'Fintech Mobile App Redesign',
      client: 'GrowthNest Media (Rahul Verma)',
      category: 'Design',
      budget: 65000,
      nextMilestone: 'Milestone 2: Design System & 3D Assets',
      deadline: 'Oct 24, 2026',
      status: 'In Progress',
      protection: 'Escrow Secured',
      silenceAlert: true
    },
    {
      id: 'PRJ-102',
      title: 'E-commerce Marketplace Branding',
      client: 'UrbanBazaar Pvt Ltd',
      category: 'Branding',
      budget: 42000,
      nextMilestone: 'Milestone 1: Identity Guide & Logos',
      deadline: 'Nov 02, 2026',
      status: 'Review Pending',
      protection: 'Revision Guard (1/2 used)',
      silenceAlert: false
    },
    {
      id: 'PRJ-103',
      title: '12 Instagram Short-Form Reels Campaign',
      client: 'CreatorSpark Studios',
      category: 'Video',
      budget: 18000,
      nextMilestone: 'Batch 1: First 4 Reels Handover',
      deadline: 'Oct 28, 2026',
      status: 'In Progress',
      protection: 'Milestone Escrow',
      silenceAlert: false
    }
  ],
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
  ],
  invoices: [
    {
      id: 'INV-2026-001',
      client: 'GrowthNest Media',
      project: 'Fintech Mobile Redesign — Milestone 1',
      baseAmount: 25000,
      gst: 4500,
      total: 29500,
      dueDate: 'Oct 14, 2026',
      status: 'paid'
    },
    {
      id: 'INV-2026-002',
      client: 'UrbanBazaar Pvt Ltd',
      project: 'Marketplace Brand Identity — Advance',
      baseAmount: 20000,
      gst: 3600,
      total: 23600,
      dueDate: 'Oct 22, 2026',
      status: 'pending'
    },
    {
      id: 'INV-2026-003',
      client: 'CreatorSpark Studios',
      project: '12 Instagram Reels — Batch 1 Escrow',
      baseAmount: 6000,
      gst: 1080,
      total: 7080,
      dueDate: 'Oct 28, 2026',
      status: 'secured'
    }
  ]
};

// ==============================================================================
// 1. THEME MANAGEMENT (LIGHT & DARK THEMES)
// ==============================================================================
function initTheme() {
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
    if (icon) icon.textContent = '🌙';
    if (label) label.textContent = 'Dark Mode';
  } else {
    if (icon) icon.textContent = '☀️';
    if (label) label.textContent = 'Light Mode';
  }
}

// ==============================================================================
// 2. AUTHENTICATION & PERSONA SWITCHING
// ==============================================================================
function selectPersona(role, name, subtitle) {
  state.currentRole = role;
  state.currentUser.name = name;
  state.currentUser.title = subtitle;
  state.currentUser.avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Highlight selected card
  document.querySelectorAll('.persona-card').forEach(card => card.classList.remove('active'));
  const clickedCard = event?.currentTarget;
  if (clickedCard) clickedCard.classList.add('active');

  // Pre-fill email
  const emailInput = document.getElementById('user-email');
  if (emailInput) {
    if (role === 'freelancer') emailInput.value = 'priya.sharma@bharosa.design';
    if (role === 'client') emailInput.value = 'rahul.verma@growthnest.media';
    if (role === 'agency') emailInput.value = 'director@apexstudio.agency';
  }
}

function handleLogin(e) {
  if (e) e.preventDefault();

  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');

  if (authScreen) authScreen.style.display = 'none';
  if (appShell) appShell.classList.add('active');

  // Update header profile
  document.getElementById('nav-user-name').textContent = state.currentUser.name;
  document.getElementById('nav-user-role').textContent = state.currentUser.title;
  document.getElementById('nav-user-avatar').textContent = state.currentUser.avatar;

  const roleSelect = document.getElementById('role-select');
  if (roleSelect) roleSelect.value = state.currentRole;

  // Render initial dashboard data
  renderDashboardProjects();
  renderJobsList(state.jobs);
  renderInvoices();

  showToast(`Welcome back, ${state.currentUser.name}! Bharosa Shield active.`, 'success');
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

function onRoleChange(newRole) {
  state.currentRole = newRole;
  const subtitle = document.getElementById('dashboard-welcome-subtitle');

  if (newRole === 'client') {
    state.currentUser.name = 'Rahul Verma';
    state.currentUser.title = 'Client (GrowthNest Media)';
    state.currentUser.avatar = 'RV';
    if (subtitle) subtitle.textContent = 'Review active contractor deliverables, approve milestones, and manage escrow deposits.';
  } else if (newRole === 'agency') {
    state.currentUser.name = 'Apex Creative';
    state.currentUser.title = 'Agency Director (8 Members)';
    state.currentUser.avatar = 'AC';
    if (subtitle) subtitle.textContent = 'Team workload allocation, client portal access, and agency billing reports.';
  } else {
    state.currentUser.name = 'Priya Sharma';
    state.currentUser.title = 'Senior Product & Motion Designer';
    state.currentUser.avatar = 'PS';
    if (subtitle) subtitle.textContent = 'Manage client milestones, scope change protections, and pending payouts.';
  }

  document.getElementById('nav-user-name').textContent = state.currentUser.name;
  document.getElementById('nav-user-role').textContent = state.currentUser.title;
  document.getElementById('nav-user-avatar').textContent = state.currentUser.avatar;

  showToast(`Switched perspective to ${newRole.toUpperCase()} Mode`, 'info');
}

// ==============================================================================
// 3. TAB NAVIGATION
// ==============================================================================
function switchTab(tabId) {
  state.activeTab = tabId;

  // Update sidebar links
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch visible section
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(`view-${tabId}`);
  if (target) {
    target.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==============================================================================
// 4. DASHBOARD & PROJECT RENDERING
// ==============================================================================
function renderDashboardProjects() {
  const tbody = document.getElementById('dashboard-projects-body');
  if (!tbody) return;

  tbody.innerHTML = state.projects.map(p => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--text-primary);">${p.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${p.id} • ${p.category}</div>
      </td>
      <td>
        <div style="font-weight: 600;">${p.client}</div>
      </td>
      <td>
        <div style="font-size: 0.82rem;">${p.nextMilestone}</div>
      </td>
      <td>
        <div style="font-size: 0.82rem; font-weight: 600; color: ${p.silenceAlert ? 'var(--warning)' : 'var(--text-secondary)'};">
          ${p.deadline} ${p.silenceAlert ? '⚠️ (Paused)' : ''}
        </div>
      </td>
      <td>
        <div style="font-weight: 700; color: var(--primary);">₹${p.budget.toLocaleString('en-IN')}</div>
      </td>
      <td>
        <span class="status-pill ${p.silenceAlert ? 'pending' : 'secured'}">
          ${p.protection}
        </span>
      </td>
      <td>
        <button class="btn-tag" onclick="switchTab('projects')">Workspace →</button>
      </td>
    </tr>
  `).join('');
}

// ==============================================================================
// 5. AI PROJECT ASSISTANT & SCOPE SCRIBING
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

    // Parse keywords dynamically
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
            <li>Client review turnaround: 48 hours before silence protection triggers.</li>
          </ul>
        </div>
      `;
    }

    showToast('SOW and Milestone breakdown created!', 'success');
  }, 600);
}

function createProjectFromAi() {
  const title = document.getElementById('out-project-title')?.textContent || 'New Project';
  const newPrj = {
    id: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
    title: title,
    client: 'Direct Client (Via Bharosa Brief)',
    category: 'Design & Content',
    budget: 18000,
    nextMilestone: 'Milestone 1: Kickoff & Initial Assets',
    deadline: 'Nov 10, 2026',
    status: 'In Progress',
    protection: 'Escrow Secured',
    silenceAlert: false
  };

  state.projects.unshift(newPrj);
  renderDashboardProjects();
  showToast(`Contract created: ${title}! Added to workspace.`, 'success');
  switchTab('projects');
}

// ==============================================================================
// 6. JOB DISCOVERY & URL IMPORTER
// ==============================================================================
function renderJobsList(jobsToRender) {
  const container = document.getElementById('jobs-container');
  if (!container) return;

  container.innerHTML = jobsToRender.map(j => `
    <div class="card-section" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span class="brand-badge" style="background: var(--primary-light); color: var(--primary);">${j.source}</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--success);">${j.matchScore}% Profile Match</span>
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
  const filtered = state.jobs.filter(j => 
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
    renderJobsList(state.jobs);
  } else {
    const filtered = state.jobs.filter(j => j.category === cat);
    renderJobsList(filtered);
  }
}

function applyForJob(jobTitle) {
  showToast(`Application proposal sent with Bharosa Protection for: ${jobTitle}`, 'success');
}

// Modal Handling
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
// 7. SCOPE CHANGE DETECTOR & FAIRNESS METER
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
    const list = document.getElementById('kanban-backlog');
    if (list) {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.innerHTML = `
        <div class="task-tags">
          <span class="tag-badge scope-approved">In Scope</span>
        </div>
        <div class="task-title">${title}</div>
        <div class="task-desc">Added to active project milestone deliverables.</div>
        <div class="task-meta">
          <span class="task-due">📅 Just now</span>
          <span style="font-weight: 700;">Milestone 2</span>
        </div>
      `;
      list.prepend(card);
      showToast(`Task "${title}" added to Scope & Backlog!`, 'success');
    }
  }
}

// ==============================================================================
// 8. INVOICING & PAYMENT RECORDS
// ==============================================================================
function renderInvoices() {
  const tbody = document.getElementById('invoices-table-body');
  if (!tbody) return;

  tbody.innerHTML = state.invoices.map(inv => `
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
          ${inv.status === 'paid' ? '✓ Paid' : (inv.status === 'secured' ? '🛡️ In Escrow' : '⏳ Awaiting')}
        </span>
      </td>
      <td>
        <button class="btn-tag" onclick="showToast('Invoice ${inv.id} PDF downloaded.', 'info')">PDF</button>
      </td>
    </tr>
  `).join('');
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

  document.getElementById('inv-subtotal-disp').textContent = `₹${base.toLocaleString('en-IN')}`;
  document.getElementById('inv-gst-disp').textContent = `₹${gst.toLocaleString('en-IN')}`;
  document.getElementById('inv-total-disp').textContent = `₹${total.toLocaleString('en-IN')}`;
}

function saveGeneratedInvoice() {
  const project = document.getElementById('inv-project-select')?.value || 'Client Project';
  const milestone = document.getElementById('inv-milestone-title')?.value || 'Milestone';
  const base = parseFloat(document.getElementById('inv-base-amount')?.value || 20000);
  const rate = parseFloat(document.getElementById('inv-gst-rate')?.value || 0.18);
  const gst = base * rate;
  const total = base + gst;

  const newInv = {
    id: `INV-2026-00${state.invoices.length + 1}`,
    client: project.includes('GrowthNest') ? 'GrowthNest Media' : (project.includes('UrbanBazaar') ? 'UrbanBazaar' : 'Pulse Health'),
    project: milestone,
    baseAmount: base,
    gst: gst,
    total: total,
    dueDate: 'Nov 05, 2026',
    status: 'pending'
  };

  state.invoices.unshift(newInv);
  renderInvoices();
  closeModal('modal-create-invoice');
  showToast(`Invoice ${newInv.id} generated and issued with GST compliance!`, 'success');
}

// ==============================================================================
// 9. GLOBAL SEARCH
// ==============================================================================
function handleGlobalSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderDashboardProjects();
    renderJobsList(state.jobs);
    return;
  }

  // Filter projects
  const filteredProjects = state.projects.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.client.toLowerCase().includes(query) ||
    p.nextMilestone.toLowerCase().includes(query)
  );

  const tbody = document.getElementById('dashboard-projects-body');
  if (tbody) {
    if (filteredProjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No matching projects found for "${query}"</td></tr>`;
    } else {
      tbody.innerHTML = filteredProjects.map(p => `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-primary);">${p.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.id}</div>
          </td>
          <td>${p.client}</td>
          <td>${p.nextMilestone}</td>
          <td>${p.deadline}</td>
          <td>₹${p.budget.toLocaleString('en-IN')}</td>
          <td><span class="status-pill secured">${p.protection}</span></td>
          <td><button class="btn-tag" onclick="switchTab('projects')">Workspace</button></td>
        </tr>
      `).join('');
    }
  }
}

// ==============================================================================
// 10. TOAST NOTIFICATION SYSTEM
// ==============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
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

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  // Auto-load preset default
  selectPersona('freelancer', 'Priya Sharma', 'Design & Video Pro');
});
