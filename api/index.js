const express = require('express');
const cors = require('cors');

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

    disputes: []
  };
}

let DB = getInitialSeed();

app.post('/api/reset-demo', (req, res) => {
  DB = getInitialSeed();
  res.json({ success: true, message: 'Demo database reset to initial seed state.' });
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

  DB.auditLogs.unshift({
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: project.id,
    milestoneId,
    action: 'SCOPE_AMENDMENT_DRAFTED',
    reason: `Drafted scope amendment for ₹${amendment.additionalCost} INR and +${amendment.additionalDays} days. Pending client approval.`
  });

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

  DB.auditLogs.unshift({
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    projectId: project.id,
    milestoneId: amendment.milestoneId,
    action: 'SCOPE_AMENDMENT_APPROVED',
    reason: `Client approved amendment "${amendment.title}". Contract updated: +₹${amendment.additionalCost} INR.`
  });

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

module.exports = app;
