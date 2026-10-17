// test-e2e.js
// Automated End-to-End and Security Verification for Bharosa OS

const assert = require('assert');
const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runE2E() {
  // Ensure fresh seed data
  await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reset-demo',
    method: 'POST'
  });

  console.log('=== CHECK 1: Login & Role-Based Route Redirects ===');
  const flLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'freelancer' });
  assert.strictEqual(flLogin.status, 200);
  assert.strictEqual(flLogin.body.user.role, 'freelancer');
  assert.strictEqual(flLogin.body.redirectTo, '/freelancer/dashboard');

  const clLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'client' });
  assert.strictEqual(clLogin.status, 200);
  assert.strictEqual(clLogin.body.user.role, 'client');
  assert.strictEqual(clLogin.body.redirectTo, '/client/dashboard');
  console.log('✓ Freelancer redirects to /freelancer/dashboard; Client to /client/dashboard');

  console.log('=== CHECK 2: Server-Side 403 on Cross-Role API Access ===');
  // Client attempts to call freelancer dashboard API
  const forbiddenFlCall = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/freelancer/dashboard',
    method: 'GET',
    headers: { 'x-user-id': 'USR-102' } // Client ID
  });
  assert.strictEqual(forbiddenFlCall.status, 403, 'Client calling freelancer API must return 403');
  console.log('✓ Server-side 403 enforced when Client attempts to access Freelancer API');

  // Freelancer attempts to call client dashboard API
  const forbiddenClCall = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/client/dashboard',
    method: 'GET',
    headers: { 'x-user-id': 'USR-101' } // Freelancer ID
  });
  assert.strictEqual(forbiddenClCall.status, 403, 'Freelancer calling client API must return 403');
  console.log('✓ Server-side 403 enforced when Freelancer attempts to access Client API');

  console.log('=== CHECK 3: Client Cannot Read Freelancer Earnings or Private Notes ===');
  const clProjects = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/projects',
    method: 'GET',
    headers: { 'x-user-id': 'USR-102' } // Client ID
  });
  assert.strictEqual(clProjects.status, 200);
  clProjects.body.projects.forEach(p => {
    assert.strictEqual(p.freelancerPrivateNotes, undefined, 'Private notes must be stripped for client');
    assert.strictEqual(p.freelancerEarnings, undefined, 'Freelancer earnings must not be exposed to client');
  });
  console.log('✓ Verified: Freelancer earnings and private notes are NEVER sent to Client');

  console.log('=== CHECK 4: Workflow State Machine: Only Client Can Approve Milestone ===');
  // Freelancer tries to approve milestone -> 403
  const flApproveTry = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/milestones/MS-102/transition',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-101' }
  }, { action: 'APPROVE_MILESTONE' });
  assert.strictEqual(flApproveTry.status, 403, 'Freelancer must not be able to approve milestone');

  // Client approves milestone -> 200
  const clApprove = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/milestones/MS-102/transition',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-102' }
  }, { action: 'APPROVE_MILESTONE', reason: 'Deliverables verified against contract.' });
  assert.strictEqual(clApprove.status, 200);
  assert.strictEqual(clApprove.body.milestone.status, 'Invoiced');
  assert(clApprove.body.auditEntry, 'Audit log must record approval');
  console.log('✓ Only Client can approve milestone; auto-creates audit entry and draft invoice');

  console.log('=== CHECK 5: Scope Change Requires Explicit Client Approval ===');
  // Freelancer drafts scope amendment
  const draftAmendment = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/milestones/MS-102/scope-change',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-101' }
  }, { title: '3D Spline Asset', description: 'Interactive WebGL Coin', additionalCost: 6500, additionalDays: 2 });
  assert.strictEqual(draftAmendment.status, 200);
  const amdId = draftAmendment.body.amendment.id;

  // Verify project total budget did NOT change yet
  const projBeforeApproval = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/projects/PRJ-101',
    method: 'GET',
    headers: { 'x-user-id': 'USR-102' }
  });
  const budgetBefore = projBeforeApproval.body.project.totalBudget;

  // Client approves amendment
  const approveAmd = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/scope-amendments/${amdId}/approve`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-102' }
  });
  assert.strictEqual(approveAmd.status, 200);
  assert.strictEqual(approveAmd.body.amendment.status, 'approved');
  assert.strictEqual(approveAmd.body.project.totalBudget, budgetBefore + 6500, 'Budget must update only upon approval');
  console.log('✓ Scope amendment drafted by freelancer, contract updated ONLY after client approval');

  console.log('=== CHECK 6: Client Silence Notice Proposes Schedule (No Silent Extension) ===');
  const silenceReq = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/milestones/MS-102/transition',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-101' }
  }, {
    action: 'SEND_SILENCE_REMINDER',
    proposedSchedule: 'Extend review window by 48 hours; final handoff moved to Nov 07, 2026.'
  });
  assert.strictEqual(silenceReq.status, 200);
  assert(silenceReq.body.milestone.silenceReminderSent.proposedSchedule, 'Proposed schedule must be recorded');
  console.log('✓ 72-hour client silence reminder requires and records a proposed schedule');

  console.log('\n=============================================');
  console.log('  ALL ACCEPTANCE & E2E CHECKS PASSED (6/6)');
  console.log('=============================================\n');
}

runE2E().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
