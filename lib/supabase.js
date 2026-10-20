// lib/supabase.js
// Supabase Data Layer & Adapter for Bharosa OS

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isPlaceholderKey = !SUPABASE_KEY || 
  SUPABASE_KEY.includes('your-') || 
  SUPABASE_KEY.includes('placeholder') || 
  SUPABASE_KEY.includes('CHANGEME') || 
  SUPABASE_KEY.trim().length < 20;

let supabase = null;
let isConfigured = false;

if (SUPABASE_URL && !isPlaceholderKey) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    isConfigured = true;
    console.log(`[Supabase] Initialized client with endpoint: ${SUPABASE_URL}`);
  } catch (err) {
    console.error('[Supabase] Initialization error:', err.message);
  }
} else if (SUPABASE_URL && isPlaceholderKey) {
  console.log(`[Supabase] URL detected (${SUPABASE_URL}), but SUPABASE_KEY is a placeholder. Running in in-memory fallback mode.`);
} else {
  console.log('[Supabase] No credentials configured. Running in in-memory fallback mode.');
}

/**
 * Check connectivity and table status
 */
async function getStatus() {
  if (isPlaceholderKey || !SUPABASE_URL) {
    return {
      connected: false,
      configured: false,
      url: SUPABASE_URL || null,
      message: SUPABASE_URL
        ? 'SUPABASE_URL is configured, but SUPABASE_KEY is using a placeholder. Please paste your anon public API key in .env'
        : 'Supabase credentials missing. Add SUPABASE_URL and SUPABASE_KEY to your .env file.'
    };
  }

  if (!isConfigured || !supabase) {
    return {
      connected: false,
      configured: false,
      url: SUPABASE_URL ? SUPABASE_URL.replace(/:\/\/([^@]+@)?/, '://') : null,
      message: 'Supabase credentials missing. Add SUPABASE_URL and SUPABASE_KEY to your .env file.'
    };
  }

  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      return {
        connected: false,
        configured: true,
        url: SUPABASE_URL,
        error: error.message,
        hint: error.hint || 'Make sure the database tables are created using supabase-schema.sql',
        message: `Connected to Supabase endpoint, but table query failed: ${error.message}`
      };
    }

    return {
      connected: true,
      configured: true,
      url: SUPABASE_URL,
      message: 'Supabase is live and connected!'
    };
  } catch (err) {
    const causeCode = err.cause?.code || '';
    const isDnsError = causeCode === 'ENOTFOUND' || String(err.cause).includes('ENOTFOUND') || err.message.includes('ENOTFOUND');
    let hostname = 'supabase.co';
    try { hostname = new URL(SUPABASE_URL).hostname; } catch (e) {}

    return {
      connected: false,
      configured: true,
      url: SUPABASE_URL,
      error: causeCode ? `${err.message} (${causeCode})` : err.message,
      hint: isDnsError
        ? `Host "${hostname}" does not exist in DNS. Please verify your Project URL in Supabase Dashboard -> Project Settings -> API.`
        : 'Ensure your Supabase project is active and tables are created.',
      message: isDnsError
        ? `DNS lookup failed for ${hostname}. Check your Supabase project reference URL.`
        : 'Failed to communicate with Supabase: ' + err.message
    };
  }
}

/**
 * Seed Supabase tables with initial dataset if tables are empty
 */
async function autoSeedIfEmpty(initialSeed) {
  if (!isConfigured || !supabase) return false;

  try {
    const { data: existingUsers, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.warn('[Supabase] Cannot check users table for seeding:', error.message);
      return false;
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('[Supabase] Database already contains records. Skipping auto-seed.');
      return true;
    }

    console.log('[Supabase] Database is empty. Seeding initial Bharosa dataset...');

    // 1. Users
    const usersRows = (initialSeed.users || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      title: u.title || null,
      organization: u.organization || null,
      avatar: u.avatar || null,
      demo_login: !!u.demoLogin
    }));
    if (usersRows.length) await supabase.from('users').upsert(usersRows);

    // 2. Projects
    const projectsRows = (initialSeed.projects || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      client_id: p.clientId,
      client_name: p.clientName,
      client_org: p.clientOrg,
      freelancer_id: p.freelancerId,
      freelancer_name: p.freelancerName,
      total_budget: p.totalBudget,
      spent_budget: p.spentBudget,
      status: p.status,
      start_date: p.startDate,
      freelancer_private_notes: p.freelancerPrivateNotes,
      milestones: p.milestones || []
    }));
    if (projectsRows.length) await supabase.from('projects').upsert(projectsRows);

    // 3. Opportunities
    const oppRows = (initialSeed.opportunities || []).map(o => ({
      id: o.id,
      title: o.title,
      client_name: o.clientName,
      client_org: o.clientOrg,
      client_id: o.clientId,
      total_budget: o.totalBudget,
      timeline: o.timeline,
      category: o.category,
      description: o.description,
      milestones_count: o.milestonesCount,
      milestones_preview: o.milestonesPreview || [],
      protection: o.protection,
      status: 'open'
    }));
    if (oppRows.length) await supabase.from('opportunities').upsert(oppRows);

    // 4. Invoices
    const invRows = (initialSeed.invoices || []).map(i => ({
      id: i.id,
      project_id: i.projectId,
      milestone_id: i.milestoneId,
      milestone_title: i.milestoneTitle,
      client_id: i.clientId,
      client_name: i.clientName,
      freelancer_id: i.freelancerId,
      freelancer_name: i.freelancerName,
      base_amount: i.baseAmount,
      gst_rate: i.gstRate,
      gst_amount: i.gstAmount,
      total_amount: i.totalAmount,
      tax_type: i.taxType,
      status: i.status,
      issued_at: i.issuedAt,
      simulated_payment_provider: i.simulatedPaymentProvider
    }));
    if (invRows.length) await supabase.from('invoices').upsert(invRows);

    // 5. Scope Amendments
    const amdRows = (initialSeed.scopeAmendments || []).map(a => ({
      id: a.id,
      project_id: a.projectId,
      milestone_id: a.milestoneId,
      requested_by: a.requestedBy,
      requester_name: a.requesterName,
      title: a.title,
      description: a.description,
      additional_cost: a.additionalCost,
      additional_days: a.additionalDays,
      status: a.status,
      created_at: a.createdAt
    }));
    if (amdRows.length) await supabase.from('scope_amendments').upsert(amdRows);

    // 6. Audit Logs
    const logRows = (initialSeed.auditLogs || []).map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      actor_id: l.actorId,
      actor_name: l.actorName,
      actor_role: l.actorRole,
      project_id: l.projectId,
      milestone_id: l.milestoneId,
      action: l.action,
      reason: l.reason,
      evidence_hash: l.evidenceHash
    }));
    if (logRows.length) await supabase.from('audit_logs').upsert(logRows);

    // 7. Messages
    const msgRows = (initialSeed.messages || []).map(m => ({
      id: m.id,
      project_id: m.projectId,
      sender_id: m.senderId,
      sender_name: m.senderName,
      sender_role: m.senderRole,
      text: m.text,
      timestamp: m.timestamp
    }));
    if (msgRows.length) await supabase.from('messages').upsert(msgRows);

    console.log('[Supabase] Initial dataset seeded successfully into Supabase!');
    return true;
  } catch (err) {
    console.error('[Supabase] Error during auto-seeding:', err.message);
    return false;
  }
}

/**
 * Fetch entire state from Supabase to synchronize in-memory cache
 */
async function loadAllFromSupabase() {
  if (!isConfigured || !supabase) return null;

  try {
    const [
      { data: users, error: errUsers },
      { data: projects, error: errProjects },
      { data: opportunities, error: errOpps },
      { data: invoices, error: errInvs },
      { data: scopeAmendments, error: errAmds },
      { data: auditLogs, error: errLogs },
      { data: messages, error: errMsgs },
      { data: disputes, error: errDisps },
      { data: refunds, error: errRefs }
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('opportunities').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('scope_amendments').select('*'),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }),
      supabase.from('messages').select('*').order('timestamp', { ascending: true }),
      supabase.from('disputes').select('*'),
      supabase.from('refunds').select('*')
    ]);

    if (errUsers || errProjects) {
      console.warn('[Supabase] Failed to load core tables:', errUsers || errProjects);
      return null;
    }

    return {
      users: (users || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        title: u.title,
        organization: u.organization,
        avatar: u.avatar,
        demoLogin: u.demo_login
      })),
      projects: (projects || []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        clientId: p.client_id,
        clientName: p.client_name,
        clientOrg: p.client_org,
        freelancerId: p.freelancer_id,
        freelancerName: p.freelancer_name,
        totalBudget: Number(p.total_budget),
        spentBudget: Number(p.spent_budget),
        status: p.status,
        startDate: p.start_date,
        freelancerPrivateNotes: p.freelancer_private_notes,
        milestones: p.milestones || []
      })),
      opportunities: (opportunities || []).map(o => ({
        id: o.id,
        title: o.title,
        clientName: o.client_name,
        clientOrg: o.client_org,
        clientId: o.client_id,
        totalBudget: Number(o.total_budget),
        timeline: o.timeline,
        category: o.category,
        description: o.description,
        milestonesCount: o.milestones_count,
        milestonesPreview: o.milestones_preview || [],
        protection: o.protection,
        status: o.status
      })),
      invoices: (invoices || []).map(i => ({
        id: i.id,
        projectId: i.project_id,
        milestoneId: i.milestone_id,
        milestoneTitle: i.milestone_title,
        clientId: i.client_id,
        clientName: i.client_name,
        freelancerId: i.freelancer_id,
        freelancerName: i.freelancer_name,
        baseAmount: Number(i.base_amount),
        gstRate: Number(i.gst_rate),
        gstAmount: Number(i.gst_amount),
        totalAmount: Number(i.total_amount),
        taxType: i.tax_type,
        status: i.status,
        issuedAt: i.issued_at,
        simulatedPaymentProvider: i.simulated_payment_provider
      })),
      scopeAmendments: (scopeAmendments || []).map(a => ({
        id: a.id,
        projectId: a.project_id,
        milestoneId: a.milestone_id,
        requestedBy: a.requested_by,
        requesterName: a.requester_name,
        title: a.title,
        description: a.description,
        additionalCost: Number(a.additional_cost),
        additionalDays: Number(a.additional_days),
        status: a.status,
        createdAt: a.created_at
      })),
      auditLogs: (auditLogs || []).map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        actorId: l.actor_id,
        actorName: l.actor_name,
        actorRole: l.actor_role,
        projectId: l.project_id,
        milestoneId: l.milestone_id,
        action: l.action,
        reason: l.reason,
        evidenceHash: l.evidence_hash,
        details: l.details
      })),
      messages: (messages || []).map(m => ({
        id: m.id,
        projectId: m.project_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        text: m.text,
        timestamp: m.timestamp
      })),
      disputes: (disputes || []).map(d => ({
        id: d.id,
        projectId: d.project_id,
        milestoneId: d.milestone_id,
        projectTitle: d.project_title,
        milestoneTitle: d.milestone_title,
        raisedBy: d.raised_by,
        raisedByName: d.raised_by_name,
        reason: d.reason,
        status: d.status,
        timestamp: d.timestamp,
        resolution: d.resolution
      })),
      refunds: (refunds || []).map(r => ({
        id: r.id,
        projectId: r.project_id,
        amount: Number(r.amount),
        reason: r.reason,
        timestamp: r.timestamp,
        status: r.status
      }))
    };
  } catch (err) {
    console.error('[Supabase] Error loading all data from Supabase:', err.message);
    return null;
  }
}

/**
 * Persist helpers for each entity
 */
async function syncProject(project) {
  if (!isConfigured || !supabase || !project) return;
  try {
    await supabase.from('projects').upsert({
      id: project.id,
      title: project.title,
      description: project.description,
      client_id: project.clientId,
      client_name: project.clientName,
      client_org: project.clientOrg,
      freelancer_id: project.freelancerId,
      freelancer_name: project.freelancerName,
      total_budget: project.totalBudget,
      spent_budget: project.spentBudget,
      status: project.status,
      start_date: project.startDate,
      freelancer_private_notes: project.freelancerPrivateNotes,
      milestones: project.milestones || []
    });
  } catch (e) {
    console.error('[Supabase] Error syncing project:', e.message);
  }
}

async function syncInvoice(invoice) {
  if (!isConfigured || !supabase || !invoice) return;
  try {
    await supabase.from('invoices').upsert({
      id: invoice.id,
      project_id: invoice.projectId,
      milestone_id: invoice.milestoneId,
      milestone_title: invoice.milestoneTitle,
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      freelancer_id: invoice.freelancerId,
      freelancer_name: invoice.freelancerName,
      base_amount: invoice.baseAmount,
      gst_rate: invoice.gstRate,
      gst_amount: invoice.gstAmount,
      total_amount: invoice.totalAmount,
      tax_type: invoice.taxType,
      status: invoice.status,
      issued_at: invoice.issuedAt,
      simulated_payment_provider: invoice.simulatedPaymentProvider
    });
  } catch (e) {
    console.error('[Supabase] Error syncing invoice:', e.message);
  }
}

async function syncAuditLog(log) {
  if (!isConfigured || !supabase || !log) return;
  try {
    await supabase.from('audit_logs').insert({
      id: log.id,
      timestamp: log.timestamp || new Date().toISOString(),
      actor_id: log.actorId,
      actor_name: log.actorName,
      actor_role: log.actorRole,
      project_id: log.projectId,
      milestone_id: log.milestoneId,
      action: log.action,
      reason: log.reason,
      evidence_hash: log.evidenceHash,
      details: log.details
    });
  } catch (e) {
    console.error('[Supabase] Error syncing audit log:', e.message);
  }
}

async function syncMessage(msg) {
  if (!isConfigured || !supabase || !msg) return;
  try {
    await supabase.from('messages').insert({
      id: msg.id,
      project_id: msg.projectId,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_role: msg.senderRole,
      text: msg.text,
      timestamp: msg.timestamp || new Date().toISOString()
    });
  } catch (e) {
    console.error('[Supabase] Error syncing message:', e.message);
  }
}

async function syncScopeAmendment(amd) {
  if (!isConfigured || !supabase || !amd) return;
  try {
    await supabase.from('scope_amendments').upsert({
      id: amd.id,
      project_id: amd.projectId,
      milestone_id: amd.milestoneId,
      requested_by: amd.requestedBy,
      requester_name: amd.requesterName,
      title: amd.title,
      description: amd.description,
      additional_cost: amd.additionalCost,
      additional_days: amd.additionalDays,
      status: amd.status,
      created_at: amd.createdAt
    });
  } catch (e) {
    console.error('[Supabase] Error syncing scope amendment:', e.message);
  }
}

async function syncDispute(dispute) {
  if (!isConfigured || !supabase || !dispute) return;
  try {
    await supabase.from('disputes').upsert({
      id: dispute.id,
      project_id: dispute.projectId,
      milestone_id: dispute.milestoneId,
      project_title: dispute.projectTitle,
      milestone_title: dispute.milestoneTitle,
      raised_by: dispute.raisedBy,
      raised_by_name: dispute.raisedByName,
      reason: dispute.reason,
      status: dispute.status,
      timestamp: dispute.timestamp,
      resolution: dispute.resolution
    });
  } catch (e) {
    console.error('[Supabase] Error syncing dispute:', e.message);
  }
}

async function syncRefund(refund) {
  if (!isConfigured || !supabase || !refund) return;
  try {
    await supabase.from('refunds').upsert({
      id: refund.id,
      project_id: refund.projectId,
      amount: refund.amount,
      reason: refund.reason,
      timestamp: refund.timestamp,
      status: refund.status
    });
  } catch (e) {
    console.error('[Supabase] Error syncing refund:', e.message);
  }
}

async function deleteOpportunity(id) {
  if (!isConfigured || !supabase || !id) return;
  try {
    await supabase.from('opportunities').delete().eq('id', id);
  } catch (e) {
    console.error('[Supabase] Error deleting opportunity:', e.message);
  }
}

module.exports = {
  supabase,
  isConfigured,
  getStatus,
  autoSeedIfEmpty,
  loadAllFromSupabase,
  syncProject,
  syncInvoice,
  syncAuditLog,
  syncMessage,
  syncScopeAmendment,
  syncDispute,
  syncRefund,
  deleteOpportunity
};
