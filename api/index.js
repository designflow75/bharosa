require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabaseAdapter = require('../lib/supabase.js');

const app = express();
app.use(cors());
app.use(express.json());

// ==============================================================================
// 1. IN-MEMORY SEED DATABASE
// ==============================================================================

function getInitialSeed() {
  return {
    users: [
      {
        id: 'USR-101',
        name: 'Priya Sharma',
        email: 'priya@bharosa.design',
        role: 'freelancer',
        title: 'Senior Product Designer',
        avatar: 'PS',
        demoLogin: true
      },
      {
        id: 'USR-102',
        name: 'Rahul Verma',
        email: 'rahul@growthnest.media',
        role: 'client',
        title: 'Head of Product, GrowthNest Media',
        organization: 'GrowthNest Media',
        avatar: 'RV',
        demoLogin: true
      },
      {
        id: 'USR-ADMIN',
        name: 'Platform Moderator',
        email: 'admin@bharosa.design',
        role: 'admin',
        title: 'Bharosa Super Admin',
        avatar: 'AD',
        demoLogin: true
      }
    ],

    projects: [
      {
        id: 'PRJ-101',
        title: 'Fintech Mobile App Redesign',
        description: 'Complete UI/UX overhaul of mobile banking app with biometric onboarding flow.',
        clientId: 'USR-102',
        clientName: 'Rahul Verma',
        clientOrg: 'GrowthNest Media',
        freelancerId: 'USR-101',
        freelancerName: 'Priya Sharma',
        totalBudget: 65000,
        spentBudget: 25000,
        status: 'active',
        startDate: '2026-10-01',
        freelancerPrivateNotes: 'Client prefers Figma prototype links over raw MP4s. High attention to detail on KYC.',
        milestones: [
          {
            id: 'MS-101',
            title: 'Milestone 1: Wireframes & Architecture Map',
            amount: 25000,
            status: 'Invoiced', // Draft -> Agreed -> Funded -> In progress -> Submitted -> In review -> Approved -> Released -> Invoiced
            deadline: '2026-10-14T18:00:00Z',
            completedAt: '2026-10-14T17:45:00Z',
            deliverables: [
              { name: 'Wireframes_v2.fig', hash: '8f9b4c2e1a341b5d', size: '14.2 MB', submittedAt: '2026-10-12T11:30:00Z' },
              { name: 'IA_Flow_Map.pdf', hash: '4e1cb892a091d33f', size: '2.1 MB', submittedAt: '2026-10-12T11:30:00Z' }
            ],
            revisionsAllowed: 2,
            revisionsUsed: 0,
            invoiceId: 'INV-2026-001'
          },
          {
            id: 'MS-102',
            title: 'Milestone 2: Design System & Interactive Prototypes',
            amount: 20000,
            status: 'In review',
            deadline: '2026-10-24T18:00:00Z',
            completedAt: null,
            deliverables: [
              { name: 'Design_System_Tokens.json', hash: 'd22a901e67bf3c88', size: '1.4 MB', submittedAt: '2026-10-16T11:30:00Z' },
              { name: 'Interactive_Prototype.fig', hash: 'b11f7c3a99e034ab', size: '38.5 MB', submittedAt: '2026-10-16T11:30:00Z' }
            ],
            revisionsAllowed: 2,
            revisionsUsed: 1,
            silenceTriggered: false,
            silenceWindowHours: 72,
            lastActivityAt: '2026-10-16T11:30:00Z',
            possibleScopeChange: null
          },
          {
            id: 'MS-103',
            title: 'Milestone 3: Developer Handoff Tokens & Asset Export',
            amount: 20000,
            status: 'Agreed',
            deadline: '2026-11-05T18:00:00Z',
            completedAt: null,
            deliverables: [],
            revisionsAllowed: 2,
            revisionsUsed: 0
          }
        ]
      },
      {
        id: 'PRJ-102',
        title: 'E-commerce Marketplace Branding',
        description: 'Brand identity, typography guidelines, and social asset kit.',
        clientId: 'USR-102',
        clientName: 'Rahul Verma',
        clientOrg: 'GrowthNest Media',
        freelancerId: 'USR-101',
        freelancerName: 'Priya Sharma',
        totalBudget: 45000,
        spentBudget: 0,
        status: 'active',
        startDate: '2026-10-10',
        freelancerPrivateNotes: 'Client wants vibrant color accents and minimalist iconography.',
        milestones: [
          {
            id: 'MS-201',
            title: 'Milestone 1: Identity Guide & Logos',
            amount: 20000,
            status: 'In progress',
            deadline: '2026-11-02T18:00:00Z',
            completedAt: null,
            deliverables: [],
            revisionsAllowed: 2,
            revisionsUsed: 0
          },
          {
            id: 'MS-202',
            title: 'Milestone 2: Social Media Marketing Templates',
            amount: 25000,
            status: 'Draft',
            deadline: '2026-11-20T18:00:00Z',
            completedAt: null,
            deliverables: [],
            revisionsAllowed: 2,
            revisionsUsed: 0
          }
        ]
      },
      {
        id: 'PRJ-103',
        title: 'AI Copilot Web Platform & Design Tokens',
        description: 'Complete UI component library, dark mode design tokens, and real-time streaming chat workspace.',
        clientId: 'USR-102',
        clientName: 'Rahul Verma',
        clientOrg: 'GrowthNest Media',
        freelancerId: 'USR-101',
        freelancerName: 'Priya Sharma',
        totalBudget: 75000,
        spentBudget: 0,
        status: 'active',
        startDate: '2026-10-15',
        freelancerPrivateNotes: 'Client wants clean modern aesthetics with dark glassmorphism and WCAG AA contrast compliance.',
        milestones: [
          {
            id: 'MS-301',
            title: 'Milestone 1: Design Tokens & Component Matrix',
            amount: 35000,
            status: 'Funded',
            deadline: '2026-11-10T18:00:00Z',
            completedAt: null,
            deliverables: [],
            revisionsAllowed: 2,
            revisionsUsed: 0
          },
          {
            id: 'MS-302',
            title: 'Milestone 2: Streaming Chat UI & Handoff Kit',
            amount: 40000,
            status: 'Draft',
            deadline: '2026-11-28T18:00:00Z',
            completedAt: null,
            deliverables: [],
            revisionsAllowed: 2,
            revisionsUsed: 0
          }
        ]
      }
    ],

    auditLogs: [
      {
        id: 'AUD-001',
        timestamp: '2026-10-14T17:45:00Z',
        actorId: 'USR-102',
        actorName: 'Rahul Verma',
        actorRole: 'client',
        projectId: 'PRJ-101',
        milestoneId: 'MS-101',
        action: 'MILESTONE_APPROVED',
        reason: 'All wireframe deliverables match agreed SOW specifications.',
        evidenceHash: '4e1cb892a091d33f'
      },
      {
        id: 'AUD-002',
        timestamp: '2026-10-16T11:30:00Z',
        actorId: 'USR-101',
        actorName: 'Priya Sharma',
        actorRole: 'freelancer',
        projectId: 'PRJ-101',
        milestoneId: 'MS-102',
        action: 'DELIVERABLES_SUBMITTED',
        reason: 'Delivered design system components and interactive flow.',
        evidenceHash: 'd22a901e67bf3c88'
      }
    ],

    invoices: [
      {
        id: 'INV-2026-001',
        projectId: 'PRJ-101',
        milestoneId: 'MS-101',
        milestoneTitle: 'Milestone 1: Wireframes & Architecture Map',
        clientId: 'USR-102',
        clientName: 'Rahul Verma',
        freelancerId: 'USR-101',
        freelancerName: 'Priya Sharma',
        baseAmount: 25000,
        gstRate: 0.18,
        gstAmount: 4500,
        totalAmount: 29500,
        taxType: 'standard_gst', // standard_gst | zero_rated_export
        status: 'paid', // draft | issued | paid
        issuedAt: '2026-10-14T17:45:00Z',
        simulatedPaymentProvider: 'Razorpay Sandbox (Simulated)'
      }
    ],

    scopeAmendments: [
      {
        id: 'AMD-101',
        projectId: 'PRJ-101',
        milestoneId: 'MS-102',
        requestedBy: 'USR-101',
        requesterName: 'Priya Sharma',
        title: '3D Spline Interactive Coin Animation',
        description: 'Out-of-scope request for interactive 3D WebGL asset. Original SOW specifies 2D vector UI.',
        additionalCost: 6500,
        additionalDays: 2,
        status: 'pending_client_approval', // pending_client_approval | approved | rejected
        createdAt: '2026-10-16T14:20:00Z'
      }
    ],

    disputes: [
      {
        id: 'DSP-101',
        projectId: 'PRJ-101',
        milestoneId: 'MS-102',
        projectTitle: 'Fintech Mobile App Redesign',
        milestoneTitle: 'Milestone 2: Design System & Interactive Prototypes',
        claimantId: 'USR-101',
        claimantName: 'Priya Sharma',
        claimantRole: 'freelancer',
        category: 'Scope & Revisions',
        reason: 'Client requested out-of-scope 3D WebGL assets beyond agreed 2D UI SOW.',
        claimDetails: 'Milestone was agreed for 2D UI vector screens. Client requested full interactive 3D WebGL scene with multiple revisions exceeding revision limit.',
        status: 'under_neutral_review',
        evidenceHash: 'sha256-4e1cb892a091d33f',
        createdAt: '2026-10-18T10:30:00Z'
      }
    ],

    opportunities: [
      {
        id: 'OPP-101',
        title: 'SaaS Billing Dashboard & Analytics Portal',
        clientName: 'Rahul Verma',
        clientOrg: 'GrowthNest Media',
        clientId: 'USR-102',
        totalBudget: 85000,
        timeline: '14 Days',
        category: 'Product Design & Frontend Tokens',
        description: 'Complete redesign of enterprise subscription management, invoice breakdown views, and responsive charts.',
        milestonesCount: 3,
        milestonesPreview: [
          { title: 'Information Architecture & Wireframes', amount: 30000 },
          { title: 'Interactive Prototype & Component Library', amount: 30000 },
          { title: 'Production Token Export & QA Handoff', amount: 25000 }
        ],
        protection: 'Payment via provider (simulated in demo) • File hashes recorded for integrity'
      },
      {
        id: 'OPP-102',
        title: 'Mobile Wallet Biometric Checkout Flow',
        clientName: 'Ananya Deshmukh',
        clientOrg: 'PayZen Global',
        clientId: 'USR-103',
        totalBudget: 60000,
        timeline: '10 Days',
        category: 'Fintech Mobile UX',
        description: 'Native iOS & Android payment authorization screens with biometric confirmation and fallback PIN authentication.',
        milestonesCount: 2,
        milestonesPreview: [
          { title: 'User Flow Diagrams & Low-Fi Prototyping', amount: 25000 },
          { title: 'High-Fi Interactive Prototypes with Micro-interactions', amount: 35000 }
        ],
        protection: 'Payment via provider (simulated in demo) • Revision Quota: 2 Rounds'
      },
      {
        id: 'OPP-103',
        title: 'D2C Brand Identity & Packaging Guidelines',
        clientName: 'Karan Mehra',
        clientOrg: 'Artisan Botanics',
        clientId: 'USR-104',
        totalBudget: 45000,
        timeline: '7 Days',
        category: 'Brand Strategy & Visual Assets',
        description: 'Minimalist sustainable packaging layout, typography scale, logo vector assets, and social template library.',
        milestonesCount: 2,
        milestonesPreview: [
          { title: 'Brand Guidelines & Logo Variations', amount: 20000 },
          { title: 'Packaging Dielines & Social Kit', amount: 25000 }
        ],
        protection: 'Payment via provider (simulated in demo) • SOW Protected'
      }
    ],

    messages: [
      {
        id: 'MSG-001',
        projectId: 'PRJ-101',
        senderId: 'USR-102',
        senderName: 'Rahul Verma',
        senderRole: 'client',
        text: 'Hi Priya, reviewed Milestone 1 wireframes — architecture looks solid. Looking forward to the interactive prototype on Milestone 2.',
        timestamp: '2026-10-15T10:15:00Z'
      },
      {
        id: 'MSG-002',
        projectId: 'PRJ-101',
        senderId: 'USR-101',
        senderName: 'Priya Sharma',
        senderRole: 'freelancer',
        text: 'Thanks Rahul! The interactive prototype has been uploaded to Milestone 2 with cryptographic SHA-256 integrity hashes.',
        timestamp: '2026-10-16T11:35:00Z'
      }
    ],

    wallets: {
      'USR-102': {
        userId: 'USR-102',
        role: 'client',
        availableBalance: 85000,
        lockedInEscrow: 60000,
        totalFundedLifetime: 170000,
        totalDisbursedLifetime: 25000,
        transactions: [
          {
            id: 'TXN-CL-901',
            type: 'credit',
            amount: 100000,
            method: 'UPI Auto-Collect (HDFC Bank •••• 9214)',
            referenceId: 'UPI-REF-9842109281',
            description: 'Pre-funded Project Escrow Deposit',
            timestamp: '2026-10-01T09:30:00Z',
            status: 'completed'
          },
          {
            id: 'TXN-CL-902',
            type: 'escrow_lock',
            amount: 40000,
            projectId: 'PRJ-101',
            projectTitle: 'Fintech Mobile App Redesign',
            description: 'Escrow Lock: Milestone 2 & 3',
            timestamp: '2026-10-05T14:15:00Z',
            status: 'locked'
          },
          {
            id: 'TXN-CL-903',
            type: 'disbursement',
            amount: 25000,
            projectId: 'PRJ-101',
            projectTitle: 'Fintech Mobile App Redesign',
            description: 'Payment Released to Priya Sharma for Milestone 1',
            timestamp: '2026-10-15T18:40:00Z',
            status: 'settled'
          },
          {
            id: 'TXN-CL-904',
            type: 'credit',
            amount: 70000,
            method: 'NetBanking IMPS (ICICI Corporate •••• 1108)',
            referenceId: 'IMPS-REF-4421088712',
            description: 'Top-up for Enterprise Landing System Escrow',
            timestamp: '2026-10-18T11:20:00Z',
            status: 'completed'
          }
        ]
      },
      'USR-101': {
        userId: 'USR-101',
        role: 'freelancer',
        availableBalance: 25000,
        pendingInEscrow: 40000,
        totalEarnedLifetime: 25000,
        totalWithdrawnLifetime: 0,
        bankAccounts: [
          { id: 'BANK-01', bankName: 'HDFC Bank Ltd.', accountType: 'Savings Account', accountNumber: '•••• •••• •••• 4092', ifsc: 'HDFC0001824', isDefault: true },
          { id: 'UPI-01', bankName: 'BHIM UPI', accountType: 'Virtual Payment Address', accountNumber: 'priya.sharma@okhdfcbank', ifsc: 'UPI-VPA', isDefault: false }
        ],
        transactions: [
          {
            id: 'TXN-FL-801',
            type: 'milestone_payout',
            amount: 25000,
            projectId: 'PRJ-101',
            projectTitle: 'Fintech Mobile App Redesign',
            description: 'Milestone 1 Deliverables Approved by Rahul Verma',
            timestamp: '2026-10-15T18:40:00Z',
            status: 'cleared'
          }
        ]
      }
    }
  };
}

let DB = getInitialSeed();

// Asynchronous background hydration from Supabase if configured
async function initDatabase() {
  if (supabaseAdapter.isConfigured) {
    try {
      const status = await supabaseAdapter.getStatus();
      if (status.connected) {
        console.log('[Supabase] Initializing state from Supabase...');
        await supabaseAdapter.autoSeedIfEmpty(getInitialSeed());
        const loaded = await supabaseAdapter.loadAllFromSupabase();
        if (loaded && loaded.projects && loaded.projects.length > 0) {
          DB = loaded;
          console.log(`[Supabase] Synchronized ${DB.projects.length} projects, ${DB.users.length} users from Supabase.`);
        }
      } else {
        console.log('[Supabase] Configured but status:', status.message);
      }
    } catch (e) {
      console.warn('[Supabase] Init error:', e.message);
    }
  }
}
initDatabase();

app.post('/api/reset-demo', async (req, res) => {
  const seed = getInitialSeed();
  DB = seed;
  let supabaseReset = false;
  if (supabaseAdapter.isConfigured) {
    try {
      supabaseReset = await supabaseAdapter.forceResetAndSeed(seed);
      const loaded = await supabaseAdapter.loadAllFromSupabase();
      if (loaded && loaded.projects && loaded.projects.length > 0) {
        DB = loaded;
      }
    } catch (e) {
      console.error('[Reset Demo] Supabase reset error:', e.message);
    }
  }
  res.json({
    success: true,
    message: 'Demo database reset to pristine test state.',
    supabaseReset,
    counts: {
      projects: DB.projects ? DB.projects.length : 0,
      users: DB.users ? DB.users.length : 0,
      opportunities: DB.opportunities ? DB.opportunities.length : 0,
      disputes: DB.disputes ? DB.disputes.length : 0
    }
  });
});

app.get('/api/supabase/status', async (req, res) => {
  const status = await supabaseAdapter.getStatus();
  res.json({
    ...status,
    activeCounts: {
      users: DB.users ? DB.users.length : 0,
      projects: DB.projects ? DB.projects.length : 0,
      invoices: DB.invoices ? DB.invoices.length : 0,
      opportunities: DB.opportunities ? DB.opportunities.length : 0,
      disputes: DB.disputes ? DB.disputes.length : 0
    }
  });
});

app.post('/api/supabase/seed', async (req, res) => {
  if (!supabaseAdapter.isConfigured) {
    return res.status(400).json({ error: 'Supabase credentials not configured in .env' });
  }
  const seeded = await supabaseAdapter.autoSeedIfEmpty(getInitialSeed());
  const loaded = await supabaseAdapter.loadAllFromSupabase();
  if (loaded && loaded.projects) DB = loaded;
  res.json({ success: true, seeded, count: DB.projects ? DB.projects.length : 0 });
});

// ==============================================================================
// 2. AUTHENTICATION & PERMISSIONS MIDDLEWARE
// ==============================================================================

function authenticateUser(req, res, next) {
  // Support Authorization header or x-user-id / x-user-role headers
  const userId = req.headers['x-user-id'] || 'USR-101';
  const user = DB.users.find(u => u.id === userId);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  req.user = user;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role '${req.user ? req.user.role : 'none'}' does not have access to this resource. Allowed: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

// ==============================================================================
// 3. AUTH ROUTES
// ==============================================================================

app.post('/api/auth/login', (req, res) => {
  const { role, email } = req.body;
  let user = null;

  if (role) {
    user = DB.users.find(u => u.role === role);
  } else if (email) {
    user = DB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      organization: user.organization || null,
      avatar: user.avatar
    },
    redirectTo: user.role === 'freelancer' ? '/freelancer/dashboard' : (user.role === 'client' ? '/client/dashboard' : '/admin')
  });
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

// ==============================================================================
// 4. FREELANCER DASHBOARD API (/api/freelancer/dashboard)
// ==============================================================================

app.get('/api/freelancer/dashboard', authenticateUser, requireRole('freelancer', 'admin'), (req, res) => {
  const myProjects = DB.projects.filter(p => p.freelancerId === req.user.id);

  // Financial calculations strictly segregated
  let receivedIncome = 0;
  let pendingPayouts = 0;
  let projectedIncome = 0;

  myProjects.forEach(p => {
    p.milestones.forEach(m => {
      if (m.status === 'Released' || m.status === 'Invoiced') {
        receivedIncome += m.amount;
      } else if (m.status === 'Submitted' || m.status === 'In review' || m.status === 'Approved') {
        pendingPayouts += m.amount;
      } else if (m.status === 'In progress' || m.status === 'Funded' || m.status === 'Agreed') {
        projectedIncome += m.amount;
      }
    });
  });

  // Action Items ("Needs your action")
  const actionItems = [];
  myProjects.forEach(p => {
    p.milestones.forEach(m => {
      if (m.status === 'In progress') {
        actionItems.push({
          type: 'submit_deliverable',
          projectId: p.id,
          projectTitle: p.title,
          milestoneId: m.id,
          milestoneTitle: m.title,
          deadline: m.deadline,
          message: `Submit deliverable for "${m.title}"`
        });
      }
      if (m.status === 'Revision requested') {
        actionItems.push({
          type: 'answer_revision',
          projectId: p.id,
          projectTitle: p.title,
          milestoneId: m.id,
          milestoneTitle: m.title,
          deadline: m.deadline,
          message: `Client requested revisions for "${m.title}". Review client notes and resubmit.`
        });
      }
    });
  });

  // Next deadline
  let nextDeadline = null;
  myProjects.forEach(p => {
    p.milestones.forEach(m => {
      if (['In progress', 'In review', 'Submitted'].includes(m.status)) {
        if (!nextDeadline || new Date(m.deadline) < new Date(nextDeadline.deadline)) {
          nextDeadline = {
            projectTitle: p.title,
            milestoneTitle: m.title,
            deadline: m.deadline
          };
        }
      }
    });
  });

  // Scope Alerts & Client Silence
  const alerts = [];
  myProjects.forEach(p => {
    p.milestones.forEach(m => {
      if (m.status === 'In review') {
        alerts.push({
          type: 'client_silence_watch',
          projectId: p.id,
          projectTitle: p.title,
          milestoneId: m.id,
          milestoneTitle: m.title,
          silenceWindowHours: 72,
          message: `Client review active. 72-hour protection active. Reminder & schedule proposal available if unanswered.`
        });
      }
      if (m.possibleScopeChange) {
        alerts.push({
          type: 'possible_scope_change',
          projectId: p.id,
          projectTitle: p.title,
          milestoneId: m.id,
          milestoneTitle: m.title,
          message: m.possibleScopeChange.note,
          isDraftAmendmentAvailable: true
        });
      }
    });
  });

  // Pending Scope Amendments
  const pendingAmendments = DB.scopeAmendments.filter(a => a.requestedBy === req.user.id);

  res.json({
    overview: {
      activeProjectsCount: myProjects.filter(p => p.status === 'active').length,
      nextDeadline,
      financials: {
        receivedIncome,
        pendingPayouts,
        projectedIncome,
        currency: 'INR',
        paymentNote: 'Payment via provider (simulated in demo)'
      }
    },
    actionItems,
    alerts,
    projects: myProjects.map(p => ({
      id: p.id,
      title: p.title,
      clientName: p.clientName,
      clientOrg: p.clientOrg,
      activeMilestone: p.milestones.find(m => m.status !== 'Invoiced') || p.milestones[p.milestones.length - 1],
      totalBudget: p.totalBudget
    })),
    pendingAmendments
  });
});

// ==============================================================================
// 5. CLIENT DASHBOARD API (/api/client/dashboard)
// ==============================================================================

app.get('/api/client/dashboard', authenticateUser, requireRole('client', 'admin'), (req, res) => {
  const myProjects = DB.projects.filter(p => p.clientId === req.user.id);

  let budgetCommitted = 0;
  let budgetSpent = 0;

  myProjects.forEach(p => {
    budgetCommitted += p.totalBudget;
    budgetSpent += p.spentBudget;
  });

  // Items needing client approval
  const needsApproval = [];
  myProjects.forEach(p => {
    p.milestones.forEach(m => {
      if (m.status === 'In review' || m.status === 'Submitted') {
        needsApproval.push({
          type: 'deliverable_approval',
          projectId: p.id,
          projectTitle: p.title,
          milestoneId: m.id,
          milestoneTitle: m.title,
          amount: m.amount,
          deliverables: m.deliverables,
          deadline: m.deadline,
          revisionsUsed: m.revisionsUsed,
          revisionsAllowed: m.revisionsAllowed
        });
      }
      if (m.status === 'Agreed') {
        needsApproval.push({
          type: 'fund_milestone',
          projectId: p.id,
          projectTitle: p.title,
          milestoneId: m.id,
          milestoneTitle: m.title,
          amount: m.amount,
          message: `Ready for funding before work starts.`
        });
      }
    });
  });

  // Pending Scope Amendments requiring approval
  const amendmentsRequiringApproval = DB.scopeAmendments.filter(a => {
    const project = myProjects.find(p => p.id === a.projectId);
    return project && a.status === 'pending_client_approval';
  });

  // Project cards for Client (progress bar, milestone status, payment status)
  const projectSummaries = myProjects.map(p => {
    const completedCount = p.milestones.filter(m => m.status === 'Released' || m.status === 'Invoiced').length;
    const progressPct = Math.round((completedCount / p.milestones.length) * 100);
    const currentMilestone = p.milestones.find(m => !['Released', 'Invoiced'].includes(m.status)) || p.milestones[p.milestones.length - 1];

    return {
      id: p.id,
      title: p.title,
      freelancerName: p.freelancerName,
      progressPct,
      currentMilestone: {
        id: currentMilestone.id,
        title: currentMilestone.title,
        amount: currentMilestone.amount,
        status: currentMilestone.status,
        responsibleParty: ['In progress', 'Revision requested'].includes(currentMilestone.status) ? 'Freelancer' : 'Client',
        paymentStatus: currentMilestone.status === 'Invoiced' || currentMilestone.status === 'Released' ? 'Released' : (currentMilestone.status === 'Draft' ? 'Unfunded' : 'Funded via provider (simulated)')
      },
      spentBudget: p.spentBudget,
      totalBudget: p.totalBudget
    };
  });

  // Client invoices
  const clientInvoices = DB.invoices.filter(i => i.clientId === req.user.id);

  // Recent activity timeline
  const recentActivity = DB.auditLogs
    .filter(l => myProjects.some(p => p.id === l.projectId))
    .slice(0, 10);

  res.json({
    overview: {
      budgetCommitted,
      budgetSpent,
      activeProjectsCount: myProjects.filter(p => p.status === 'active').length,
      pendingApprovalsCount: needsApproval.length + amendmentsRequiringApproval.length,
      paymentNote: 'Payment via provider (simulated in demo)'
    },
    needsApproval,
    amendmentsRequiringApproval,
    projects: projectSummaries,
    invoices: clientInvoices,
    recentActivity
    // NOTE: Freelancer earnings, other clients, private notes are STRICTLY EXCLUDED.
  });
});

// ==============================================================================
// 6. SHARED PROJECTS API (/api/projects, /api/projects/:id)
// ==============================================================================

app.get('/api/projects', authenticateUser, (req, res) => {
  let list = [];
  if (req.user.role === 'freelancer') {
    list = DB.projects.filter(p => p.freelancerId === req.user.id);
  } else if (req.user.role === 'client') {
    list = DB.projects.filter(p => p.clientId === req.user.id);
  } else if (req.user.role === 'admin') {
    list = DB.projects;
  }

  // Sanitize: client must NEVER see freelancerPrivateNotes
  const sanitized = list.map(p => {
    const copy = { ...p };
    if (req.user.role === 'client') {
      delete copy.freelancerPrivateNotes;
    }
    return copy;
  });

  res.json({ projects: sanitized });
});

app.get('/api/projects/:id', authenticateUser, (req, res) => {
  const project = DB.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Permission check
  const isFreelancer = project.freelancerId === req.user.id;
  const isClient = project.clientId === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isFreelancer && !isClient && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden', message: 'You are not a participant in this project.' });
  }

  const copy = { ...project };
  if (!isFreelancer && !isAdmin) {
    delete copy.freelancerPrivateNotes;
  }

  const projectAmendments = DB.scopeAmendments.filter(a => a.projectId === project.id);
  const projectAudit = DB.auditLogs.filter(a => a.projectId === project.id);
  const projectInvoices = DB.invoices.filter(i => i.projectId === project.id);

  res.json({
    project: copy,
    scopeAmendments: projectAmendments,
    auditLogs: projectAudit,
    invoices: projectInvoices,
    userRoleInProject: isFreelancer ? 'freelancer' : (isClient ? 'client' : 'admin')
  });
});

// ==============================================================================
// 7. BACKEND WORKFLOW STATE MACHINE (/api/milestones/:id/transition)
// ==============================================================================

app.post('/api/milestones/:id/transition', authenticateUser, (req, res) => {
  const { action, reason, proposedSchedule, deliverableFiles } = req.body;
  const milestoneId = req.params.id;

  let targetProject = null;
  let targetMilestone = null;

  for (const p of DB.projects) {
    const m = p.milestones.find(item => item.id === milestoneId);
    if (m) {
      targetProject = p;
      targetMilestone = m;
      break;
    }
  }

  if (!targetProject || !targetMilestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const isFreelancer = targetProject.freelancerId === req.user.id;
  const isClient = targetProject.clientId === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isFreelancer && !isClient && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not belong to this project' });
  }

  const prevStatus = targetMilestone.status;

  // State Machine Rules
  switch (action) {
    case 'FUND_MILESTONE': {
      // ONLY Client can fund
      if (!isClient && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only the client can fund a milestone.' });
      }
      if (targetMilestone.status !== 'Agreed' && targetMilestone.status !== 'Draft') {
        return res.status(400).json({ error: `Cannot fund milestone from state ${targetMilestone.status}` });
      }
      targetMilestone.status = 'Funded';
      break;
    }

    case 'START_WORK': {
      // ONLY Freelancer can start work
      if (!isFreelancer && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only the assigned freelancer can start work.' });
      }
      if (targetMilestone.status !== 'Funded') {
        return res.status(400).json({ error: 'Milestone must be Funded before starting work.' });
      }
      targetMilestone.status = 'In progress';
      break;
    }

    case 'SUBMIT_DELIVERABLES': {
      // ONLY Freelancer can submit deliverables
      if (!isFreelancer && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only the assigned freelancer can submit deliverables.' });
      }
      if (!['In progress', 'Revision requested'].includes(targetMilestone.status)) {
        return res.status(400).json({ error: `Cannot submit deliverables from status ${targetMilestone.status}` });
      }

      if (deliverableFiles && Array.isArray(deliverableFiles)) {
        targetMilestone.deliverables = deliverableFiles.map(f => ({
          name: f.name || 'Deliverable_File.zip',
          hash: f.hash || Math.random().toString(36).substring(2, 18),
          size: f.size || '3.5 MB',
          submittedAt: new Date().toISOString()
        }));
      }

      targetMilestone.status = 'In review';
      targetMilestone.lastActivityAt = new Date().toISOString();
      break;
    }

    case 'APPROVE_MILESTONE': {
      // ONLY Client can approve deliverable
      if (!isClient && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only the client can approve deliverables and release milestone funds.' });
      }
      if (targetMilestone.status !== 'In review' && targetMilestone.status !== 'Submitted') {
        return res.status(400).json({ error: `Cannot approve milestone in status ${targetMilestone.status}` });
      }

      targetMilestone.status = 'Released';
      targetMilestone.completedAt = new Date().toISOString();
      targetProject.spentBudget += targetMilestone.amount;

      // Auto-create editable DRAFT invoice with GST fields
      const draftInvoiceId = `INV-${Date.now().toString().slice(-4)}`;
      const gstRate = 0.18;
      const gstAmount = Math.round(targetMilestone.amount * gstRate);
      const draftInvoice = {
        id: draftInvoiceId,
        projectId: targetProject.id,
        milestoneId: targetMilestone.id,
        milestoneTitle: targetMilestone.title,
        clientId: targetProject.clientId,
        clientName: targetProject.clientName,
        freelancerId: targetProject.freelancerId,
        freelancerName: targetProject.freelancerName,
        baseAmount: targetMilestone.amount,
        gstRate,
        gstAmount,
        totalAmount: targetMilestone.amount + gstAmount,
        taxType: 'standard_gst', // or zero_rated_export
        status: 'draft',
        issuedAt: new Date().toISOString(),
        simulatedPaymentProvider: 'Payment via provider (simulated in demo)'
      };
      DB.invoices.push(draftInvoice);
      targetMilestone.invoiceId = draftInvoiceId;
      targetMilestone.status = 'Invoiced';
      break;
    }

    case 'REQUEST_REVISION': {
      // ONLY Client can request revision
      if (!isClient && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only the client can request revisions.' });
      }
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: 'A specific reason is mandatory when requesting revisions.' });
      }
      if (targetMilestone.status !== 'In review' && targetMilestone.status !== 'Submitted') {
        return res.status(400).json({ error: `Cannot request revisions from status ${targetMilestone.status}` });
      }

      targetMilestone.revisionsUsed = (targetMilestone.revisionsUsed || 0) + 1;
      targetMilestone.status = 'Revision requested';

      // Check revision quota vs limit
      if (targetMilestone.revisionsUsed > targetMilestone.revisionsAllowed) {
        targetMilestone.possibleScopeChange = {
          flaggedAt: new Date().toISOString(),
          note: `Requested revisions (${targetMilestone.revisionsUsed}) exceed agreed quota (${targetMilestone.revisionsAllowed}). Possible scope expansion. Either party can clarify or agree an amendment.`,
          status: 'possible'
        };
      }
      break;
    }

    case 'SEND_SILENCE_REMINDER': {
      // Sends reminder and PROPOSES schedule (Never silently extends deadlines)
      if (!proposedSchedule) {
        return res.status(400).json({ error: 'A proposed schedule must be included with the silence reminder.' });
      }
      targetMilestone.silenceReminderSent = {
        sentAt: new Date().toISOString(),
        proposedSchedule,
        message: 'Formal reminder sent. Schedule extension proposed for client agreement.'
      };
      break;
    }

    default:
      return res.status(400).json({ error: `Unknown transition action: ${action}` });
  }

  // Append-only tamper-evident audit log entry
  const logEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: targetProject.id,
    milestoneId: targetMilestone.id,
    action,
    reason: reason || `Transitioned milestone from ${prevStatus} to ${targetMilestone.status}`,
    evidenceHash: targetMilestone.deliverables?.[0]?.hash || Math.random().toString(36).substring(2, 18)
  };
  DB.auditLogs.unshift(logEntry);

  // Sync to Supabase
  supabaseAdapter.syncProject(targetProject);
  supabaseAdapter.syncAuditLog(logEntry);
  if (targetMilestone.invoiceId) {
    const inv = DB.invoices.find(i => i.id === targetMilestone.invoiceId);
    if (inv) supabaseAdapter.syncInvoice(inv);
  }

  res.json({
    success: true,
    milestone: targetMilestone,
    auditEntry: logEntry
  });
});

app.post('/api/milestones/:id/submit', authenticateUser, (req, res) => {
  const milestoneId = req.params.id;
  let targetProject = null;
  let targetMilestone = null;

  for (const p of DB.projects) {
    const m = p.milestones.find(item => item.id === milestoneId);
    if (m) {
      targetProject = p;
      targetMilestone = m;
      break;
    }
  }

  if (!targetProject || !targetMilestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  if (targetProject.freelancerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only the assigned freelancer can submit work.' });
  }

  const { deliverables, notes } = req.body;
  if (deliverables && Array.isArray(deliverables)) {
    targetMilestone.deliverables = deliverables.map(f => ({
      name: f.name || 'Deliverable_File.zip',
      hash: f.hash || ('sha256-' + Math.random().toString(36).substring(2, 18)),
      size: f.size || '3.5 MB',
      type: f.type || 'FILE',
      submittedAt: new Date().toISOString()
    }));
  }

  targetMilestone.status = 'In review';
  targetMilestone.lastActivityAt = new Date().toISOString();
  if (notes) targetMilestone.submissionNotes = notes;

  const logEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: targetProject.id,
    milestoneId: targetMilestone.id,
    action: 'SUBMIT_DELIVERABLES',
    reason: notes ? `Deliverables submitted: ${notes}` : `Freelancer submitted ${targetMilestone.deliverables.length} deliverable file(s) for review.`,
    evidenceHash: targetMilestone.deliverables?.[0]?.hash || ('sha256-' + Math.random().toString(36).substring(2, 18))
  };
  DB.auditLogs.unshift(logEntry);

  // Sync to Supabase
  supabaseAdapter.syncProject(targetProject);
  supabaseAdapter.syncAuditLog(logEntry);

  res.json({
    success: true,
    milestone: targetMilestone,
    auditEntry: logEntry
  });
});

// ==============================================================================
// 8. SCOPE CHANGE DRAFTS & APPROVALS (/api/milestones/:id/scope-change)
// ==============================================================================

app.post('/api/milestones/:id/scope-change', authenticateUser, (req, res) => {
  const { title, description, additionalCost, additionalDays } = req.body;
  const milestoneId = req.params.id;

  const project = DB.projects.find(p => p.milestones.some(m => m.id === milestoneId));
  if (!project) return res.status(404).json({ error: 'Milestone not found' });

  // Freelancer drafts the amendment
  if (req.user.role !== 'freelancer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the freelancer can draft a scope amendment.' });
  }

  const amendment = {
    id: `AMD-${Date.now().toString().slice(-3)}`,
    projectId: project.id,
    milestoneId,
    requestedBy: req.user.id,
    requesterName: req.user.name,
    title: title || 'Scope Change Amendment',
    description: description || 'Additional requested work exceeding original SOW.',
    additionalCost: Number(additionalCost) || 0,
    additionalDays: Number(additionalDays) || 0,
    status: 'pending_client_approval',
    createdAt: new Date().toISOString()
  };

  DB.scopeAmendments.push(amendment);

  const auditLogDraft = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: project.id,
    milestoneId,
    action: 'SCOPE_AMENDMENT_DRAFTED',
    reason: `Drafted scope amendment for ₹${amendment.additionalCost} INR and +${amendment.additionalDays} days. Pending client approval.`
  };
  DB.auditLogs.unshift(auditLogDraft);

  // Sync to Supabase
  supabaseAdapter.syncScopeAmendment(amendment);
  supabaseAdapter.syncAuditLog(auditLogDraft);

  res.json({ success: true, amendment });
});

app.post('/api/scope-amendments/:id/approve', authenticateUser, (req, res) => {
  const amendment = DB.scopeAmendments.find(a => a.id === req.params.id);
  if (!amendment) return res.status(404).json({ error: 'Amendment not found' });

  const project = DB.projects.find(p => p.id === amendment.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // ONLY client can approve amendment
  if (project.clientId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only the client can approve scope amendments.' });
  }

  amendment.status = 'approved';
  amendment.approvedAt = new Date().toISOString();

  // CONTRACT AND MILESTONE UPDATE ONLY UPON CLIENT APPROVAL
  const milestone = project.milestones.find(m => m.id === amendment.milestoneId);
  if (milestone) {
    milestone.amount += amendment.additionalCost;
    project.totalBudget += amendment.additionalCost;
    milestone.possibleScopeChange = null;
  }

  const auditLogApprove = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: project.id,
    milestoneId: amendment.milestoneId,
    action: 'SCOPE_AMENDMENT_APPROVED',
    reason: `Client approved amendment "${amendment.title}". Contract updated: +₹${amendment.additionalCost} INR.`
  };
  DB.auditLogs.unshift(auditLogApprove);

  // Sync to Supabase
  supabaseAdapter.syncScopeAmendment(amendment);
  supabaseAdapter.syncProject(project);
  supabaseAdapter.syncAuditLog(auditLogApprove);

  res.json({ success: true, amendment, project });
});

// ==============================================================================
// 9. AUDIT LOGS & INVOICES
// ==============================================================================

app.get('/api/audit-logs', authenticateUser, (req, res) => {
  let logs = DB.auditLogs;
  if (req.user.role === 'freelancer') {
    const myProjects = DB.projects.filter(p => p.freelancerId === req.user.id).map(p => p.id);
    logs = logs.filter(l => myProjects.includes(l.projectId));
  } else if (req.user.role === 'client') {
    const myProjects = DB.projects.filter(p => p.clientId === req.user.id).map(p => p.id);
    logs = logs.filter(l => myProjects.includes(l.projectId));
  }
  res.json({ auditLogs: logs });
});

app.get('/api/invoices', authenticateUser, (req, res) => {
  let invs = DB.invoices;
  if (req.user.role === 'freelancer') {
    invs = invs.filter(i => i.freelancerId === req.user.id);
  } else if (req.user.role === 'client') {
    invs = invs.filter(i => i.clientId === req.user.id);
  }
  res.json({ invoices: invs });
});

app.post('/api/invoices', authenticateUser, (req, res) => {
  const { invoiceNumber, projectId, milestoneTitle, baseAmount, gstRate, gstAmount, totalAmount, clientName, clientOrg, freelancerName, lineItems, taxType, notes } = req.body;
  
  const newInvoice = {
    id: invoiceNumber || `INV-${new Date().getFullYear()}-${String(DB.invoices.length + 1).padStart(3, '0')}`,
    projectId: projectId || 'PRJ-101',
    milestoneTitle: milestoneTitle || 'Custom Milestone Services',
    clientId: req.user.role === 'client' ? req.user.id : 'USR-102',
    clientName: clientName || 'Rahul Verma',
    clientOrg: clientOrg || 'GrowthNest Media Pvt Ltd',
    freelancerId: req.user.role === 'freelancer' ? req.user.id : 'USR-101',
    freelancerName: freelancerName || 'Priya Sharma',
    baseAmount: Number(baseAmount) || 25000,
    gstRate: Number(gstRate) || 0.18,
    gstAmount: Number(gstAmount) || Math.round((Number(baseAmount) || 25000) * 0.18),
    totalAmount: Number(totalAmount) || Math.round((Number(baseAmount) || 25000) * 1.18),
    status: 'pending',
    taxType: taxType || 'standard_gst',
    lineItems: lineItems || [],
    notes: notes || 'Bharosa Escrow Guaranteed Milestone Release.',
    issuedAt: new Date().toISOString(),
    simulatedPaymentProvider: 'Bharosa Vault v2.4 (Simulated)'
  };

  DB.invoices.unshift(newInvoice);
  supabaseAdapter.syncInvoice(newInvoice);

  const logEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: newInvoice.projectId,
    action: 'INVOICE_CREATED',
    reason: `Generated tax invoice ${newInvoice.id} for ₹${newInvoice.totalAmount.toLocaleString('en-IN')} (SAC 998314).`,
    evidenceHash: 'sha256-' + Math.random().toString(36).substring(2, 18)
  };
  DB.auditLogs.unshift(logEntry);
  supabaseAdapter.syncAuditLog(logEntry);

  res.status(201).json({ success: true, invoice: newInvoice });
});

// ==============================================================================
// 10. OPPORTUNITIES (FIND WORK)
// ==============================================================================

app.get('/api/opportunities', authenticateUser, requireRole('freelancer', 'admin'), (req, res) => {
  res.json({ opportunities: DB.opportunities || [] });
});

app.post('/api/opportunities/:id/accept', authenticateUser, requireRole('freelancer', 'admin'), (req, res) => {
  const opp = (DB.opportunities || []).find(o => o.id === req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  // Create a new project from the opportunity
  const newProjectId = `PRJ-${Date.now().toString().slice(-5)}`;
  const newProject = {
    id: newProjectId,
    title: opp.title,
    description: opp.description,
    clientId: opp.clientId || 'USR-102',
    clientName: opp.clientName,
    clientOrg: opp.clientOrg,
    freelancerId: req.user.id,
    freelancerName: req.user.name,
    totalBudget: opp.totalBudget,
    spentBudget: 0,
    status: 'active',
    startDate: new Date().toISOString().slice(0, 10),
    freelancerPrivateNotes: '',
    milestones: (opp.milestonesPreview || []).map((m, i) => ({
      id: `MS-${newProjectId}-${i + 1}`,
      title: `Milestone ${i + 1}: ${m.title}`,
      amount: m.amount,
      status: 'Agreed',
      deadline: new Date(Date.now() + (i + 1) * 7 * 86400000).toISOString(),
      completedAt: null,
      deliverables: [],
      revisionsAllowed: 2,
      revisionsUsed: 0
    }))
  };

  DB.projects.push(newProject);

  // Remove from opportunities
  DB.opportunities = DB.opportunities.filter(o => o.id !== req.params.id);

  const auditLogOpp = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: newProjectId,
    milestoneId: null,
    action: 'PROJECT_CREATED_FROM_OPPORTUNITY',
    reason: `Accepted opportunity "${opp.title}". New project created with ₹${opp.totalBudget} budget.`
  };
  DB.auditLogs.unshift(auditLogOpp);

  // Sync to Supabase
  supabaseAdapter.syncProject(newProject);
  supabaseAdapter.deleteOpportunity(req.params.id);
  supabaseAdapter.syncAuditLog(auditLogOpp);

  res.json({ success: true, project: newProject });
});

// ==============================================================================
// 11. MESSAGES (PER PROJECT)
// ==============================================================================

app.get('/api/projects/:id/messages', authenticateUser, (req, res) => {
  const project = DB.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isParticipant = project.freelancerId === req.user.id || project.clientId === req.user.id || req.user.role === 'admin';
  if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

  const msgs = (DB.messages || []).filter(m => m.projectId === req.params.id);
  res.json({ messages: msgs });
});

app.post('/api/projects/:id/messages', authenticateUser, (req, res) => {
  const project = DB.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isParticipant = project.freelancerId === req.user.id || project.clientId === req.user.id || req.user.role === 'admin';
  if (!isParticipant) return res.status(403).json({ error: 'Forbidden' });

  const msg = {
    id: `MSG-${Date.now().toString().slice(-5)}`,
    projectId: req.params.id,
    senderId: req.user.id,
    senderName: req.user.name,
    senderRole: req.user.role,
    text: req.body.text || '',
    timestamp: new Date().toISOString()
  };
  if (!DB.messages) DB.messages = [];
  DB.messages.push(msg);

  // Sync to Supabase
  supabaseAdapter.syncMessage(msg);

  res.json({ success: true, message: msg });
});

// ==============================================================================
// 12. PROJECT CREATION, DISPUTE MEDIATION & REFUND ENDPOINTS
// ==============================================================================

app.post('/api/projects', authenticateUser, requireRole('client', 'admin'), (req, res) => {
  const { title, description, totalBudget, freelancerEmail, milestones } = req.body;
  if (!title || !totalBudget) {
    return res.status(400).json({ error: 'Title and totalBudget are required.' });
  }

  const budget = Number(totalBudget);
  const newId = 'PRJ-' + Math.floor(1000 + Math.random() * 9000);

  const flUser = (freelancerEmail && DB.users.find(u => u.email === freelancerEmail)) || DB.users.find(u => u.role === 'freelancer');

  const formattedMilestones = (milestones && milestones.length > 0) ? milestones.map((m, idx) => ({
    id: `MS-${Math.floor(100 + Math.random() * 900)}`,
    title: m.title || `Milestone ${idx + 1}`,
    amount: Number(m.amount) || Math.round(budget / (milestones.length || 1)),
    status: idx === 0 ? 'Agreed' : 'Draft',
    deadline: m.deadline || new Date(Date.now() + (idx + 1) * 7 * 86400000).toISOString(),
    completedAt: null,
    deliverables: [],
    revisionsAllowed: 2,
    revisionsUsed: 0
  })) : [
    {
      id: `MS-${Math.floor(100 + Math.random() * 900)}`,
      title: 'Milestone 1: Wireframes & Architecture Scope',
      amount: Math.round(budget * 0.4),
      status: 'Agreed',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      completedAt: null,
      deliverables: [],
      revisionsAllowed: 2,
      revisionsUsed: 0
    },
    {
      id: `MS-${Math.floor(100 + Math.random() * 900)}`,
      title: 'Milestone 2: High-Fidelity Execution & Prototypes',
      amount: Math.round(budget * 0.6),
      status: 'Draft',
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      completedAt: null,
      deliverables: [],
      revisionsAllowed: 2,
      revisionsUsed: 0
    }
  ];

  const newProject = {
    id: newId,
    title,
    description: description || 'New milestone-protected escrow project initiated on Bharosa.',
    clientId: req.user.id,
    clientName: req.user.name,
    clientOrg: req.user.organization || 'Client Workspace',
    freelancerId: flUser ? flUser.id : 'USR-101',
    freelancerName: flUser ? flUser.name : 'Priya Sharma',
    totalBudget: budget,
    spentBudget: 0,
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    milestones: formattedMilestones
  };

  DB.projects.unshift(newProject);

  const auditProject = {
    id: 'AUD-' + Date.now().toString().slice(-4),
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: newId,
    action: 'PROJECT_CREATED',
    reason: `Project "${title}" created with ₹${budget.toLocaleString('en-IN')} escrow allocation`,
    evidenceHash: 'verified-contract-hash'
  };
  DB.auditLogs.unshift(auditProject);

  // Sync to Supabase
  supabaseAdapter.syncProject(newProject);
  supabaseAdapter.syncAuditLog(auditProject);

  res.json({ success: true, project: newProject });
});

app.post('/api/disputes', authenticateUser, (req, res) => {
  const { projectId, reason, category, claimDetails } = req.body;
  const project = DB.projects.find(p => p.id === projectId) || DB.projects[0];

  const disputeId = 'DSP-' + Math.floor(100 + Math.random() * 900);
  const newDispute = {
    id: disputeId,
    projectId: project ? project.id : 'PRJ-101',
    projectTitle: project ? project.title : 'Fintech Mobile App Redesign',
    claimantId: req.user.id,
    claimantName: req.user.name,
    claimantRole: req.user.role,
    category: category || 'Scope & Quality',
    reason: reason || 'Review timeline discrepancy',
    claimDetails: claimDetails || '',
    status: 'under_neutral_review',
    evidenceHash: 'sha256-' + Math.random().toString(36).substring(2, 10),
    createdAt: new Date().toISOString()
  };

  if (!DB.disputes) DB.disputes = [];
  DB.disputes.unshift(newDispute);

  const auditDispute = {
    id: 'AUD-' + Date.now().toString().slice(-4),
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: project ? project.id : 'PRJ-101',
    action: 'DISPUTE_RAISED',
    reason: `Dispute ${disputeId} logged: ${reason || category}. Neutral mediation dossier assembled.`,
    evidenceHash: newDispute.evidenceHash
  };
  DB.auditLogs.unshift(auditDispute);

  // Sync to Supabase
  supabaseAdapter.syncDispute(newDispute);
  supabaseAdapter.syncAuditLog(auditDispute);

  res.json({ success: true, dispute: newDispute });
});

app.get('/api/disputes', authenticateUser, (req, res) => {
  res.json({ disputes: DB.disputes || [] });
});

app.post('/api/refunds', authenticateUser, requireRole('client', 'admin'), (req, res) => {
  const { projectId, milestoneId, reason } = req.body;
  const refundId = 'REF-' + Math.floor(100 + Math.random() * 900);

  const auditRefund = {
    id: 'AUD-' + Date.now().toString().slice(-4),
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: projectId || 'PRJ-101',
    milestoneId: milestoneId,
    action: 'REFUND_REQUESTED',
    reason: `Refund requested for ${milestoneId || 'escrow milestone'}: ${reason}`,
    evidenceHash: 'verified-refund-request'
  };
  DB.auditLogs.unshift(auditRefund);

  // Sync to Supabase
  supabaseAdapter.syncRefund({ id: refundId, projectId, reason });
  supabaseAdapter.syncAuditLog(auditRefund);

  res.json({ success: true, refundId, status: 'logged_for_escrow_review' });
});

// ==============================================================================
// 12. ESCROW & PAYOUT WALLET HUB API (/api/wallet)
// ==============================================================================

app.get('/api/wallet', authenticateUser, (req, res) => {
  if (!DB.wallets) {
    DB.wallets = getInitialSeed().wallets;
  }
  let wallet = DB.wallets[req.user.id];
  if (!wallet) {
    wallet = {
      userId: req.user.id,
      role: req.user.role,
      availableBalance: req.user.role === 'client' ? 50000 : 15000,
      lockedInEscrow: req.user.role === 'client' ? 30000 : 0,
      pendingInEscrow: req.user.role === 'freelancer' ? 20000 : 0,
      totalFundedLifetime: req.user.role === 'client' ? 80000 : 0,
      totalEarnedLifetime: req.user.role === 'freelancer' ? 15000 : 0,
      totalWithdrawnLifetime: 0,
      totalDisbursedLifetime: req.user.role === 'client' ? 15000 : 0,
      bankAccounts: req.user.role === 'freelancer' ? [
        { id: 'BANK-01', bankName: 'HDFC Bank Ltd.', accountType: 'Savings Account', accountNumber: '•••• •••• •••• 4092', ifsc: 'HDFC0001824', isDefault: true },
        { id: 'UPI-01', bankName: 'BHIM UPI', accountType: 'Virtual Payment Address', accountNumber: `${req.user.name.toLowerCase().replace(/\s+/g, '.')}@okhdfcbank`, ifsc: 'UPI-VPA', isDefault: false }
      ] : [],
      transactions: []
    };
    DB.wallets[req.user.id] = wallet;
  }
  res.json({ success: true, wallet });
});

// Client credits / pre-funds their Escrow Vault Balance
app.post('/api/wallet/credit', authenticateUser, requireRole('client'), (req, res) => {
  const { amount, method = 'UPI Instant', referenceNote = 'Pre-funded Escrow Deposit' } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount. Must be greater than 0.' });
  }

  if (!DB.wallets) DB.wallets = getInitialSeed().wallets;
  let wallet = DB.wallets[req.user.id];
  if (!wallet) {
    wallet = {
      userId: req.user.id,
      role: 'client',
      availableBalance: 0,
      lockedInEscrow: 0,
      totalFundedLifetime: 0,
      totalDisbursedLifetime: 0,
      transactions: []
    };
    DB.wallets[req.user.id] = wallet;
  }

  wallet.availableBalance += numAmount;
  wallet.totalFundedLifetime = (wallet.totalFundedLifetime || 0) + numAmount;

  const txnId = `TXN-CR-${Date.now().toString().slice(-6)}`;
  const refId = `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const transaction = {
    id: txnId,
    type: 'credit',
    amount: numAmount,
    method,
    referenceId: refId,
    description: referenceNote,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };

  if (!wallet.transactions) wallet.transactions = [];
  wallet.transactions.unshift(transaction);

  if (DB.auditLogs) {
    DB.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-6)}`,
      action: 'ESCROW_WALLET_CREDITED',
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      reason: `Client deposited ₹${numAmount.toLocaleString('en-IN')} into Escrow Pre-Funding Vault via ${method}`,
      evidenceHash: `sha256-${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    message: `Successfully credited ₹${numAmount.toLocaleString('en-IN')} to Escrow Vault`,
    wallet,
    transaction
  });
});

// Freelancer debits / withdraws their cleared earnings to their bank account
app.post('/api/wallet/withdraw', authenticateUser, requireRole('freelancer'), (req, res) => {
  const { amount, destinationAccountId = 'BANK-01', payoutMethod = 'IMPS Instant' } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount.' });
  }

  if (!DB.wallets) DB.wallets = getInitialSeed().wallets;
  let wallet = DB.wallets[req.user.id];
  if (!wallet) {
    wallet = {
      userId: req.user.id,
      role: 'freelancer',
      availableBalance: 25000,
      pendingInEscrow: 40000,
      totalEarnedLifetime: 25000,
      totalWithdrawnLifetime: 0,
      bankAccounts: [
        { id: 'BANK-01', bankName: 'HDFC Bank Ltd.', accountType: 'Savings Account', accountNumber: '•••• •••• •••• 4092', ifsc: 'HDFC0001824', isDefault: true },
        { id: 'UPI-01', bankName: 'BHIM UPI', accountType: 'Virtual Payment Address', accountNumber: 'priya.sharma@okhdfcbank', ifsc: 'UPI-VPA', isDefault: false }
      ],
      transactions: []
    };
    DB.wallets[req.user.id] = wallet;
  }

  if (numAmount > wallet.availableBalance) {
    return res.status(400).json({
      error: 'Insufficient funds',
      message: `Requested ₹${numAmount.toLocaleString('en-IN')} exceeds available withdrawable balance of ₹${wallet.availableBalance.toLocaleString('en-IN')}`
    });
  }

  wallet.availableBalance -= numAmount;
  wallet.totalWithdrawnLifetime = (wallet.totalWithdrawnLifetime || 0) + numAmount;

  const destAccount = (wallet.bankAccounts || []).find(b => b.id === destinationAccountId) || {
    bankName: 'Verified Bank',
    accountNumber: '•••• 4092'
  };

  const txnId = `TXN-WDR-${Date.now().toString().slice(-6)}`;
  const utr = `UTR-${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const transaction = {
    id: txnId,
    type: 'withdrawal_debit',
    amount: numAmount,
    method: `${payoutMethod} (${destAccount.bankName} ${destAccount.accountNumber})`,
    referenceId: utr,
    description: `Payout debit transfer to ${destAccount.bankName} ${destAccount.accountNumber}`,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };

  if (!wallet.transactions) wallet.transactions = [];
  wallet.transactions.unshift(transaction);

  if (DB.auditLogs) {
    DB.auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-6)}`,
      action: 'FREELANCER_EARNINGS_DEBITED',
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      reason: `Freelancer debited ₹${numAmount.toLocaleString('en-IN')} to ${destAccount.bankName} (UTR: ${utr})`,
      evidenceHash: `sha256-${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    message: `Successfully initiated debit payout of ₹${numAmount.toLocaleString('en-IN')} to ${destAccount.bankName}`,
    wallet,
    transaction
  });
});

module.exports = app;

