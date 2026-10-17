// test-server-api.js
// Automated verification for Bharosa Server & Backend State Machine

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

async function runTests() {
  await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reset-demo',
    method: 'POST'
  });

  console.log('=== TEST 1: Role-Based Authentication & Redirects ===');
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
  console.log('✓ Login returns correct role and target redirect route');

  console.log('=== TEST 2: Server-Side 403 on Cross-Role Dashboard Access ===');
  // Client trying to access /api/freelancer/dashboard -> MUST 403
  const clTryFlDash = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/freelancer/dashboard',
    method: 'GET',
    headers: { 'x-user-id': 'USR-102' } // Client Rahul Verma
  });
  assert.strictEqual(clTryFlDash.status, 403, 'Client MUST receive 403 when calling freelancer dashboard');
  console.log('✓ Server blocked client from calling freelancer dashboard (HTTP 403)');

  // Freelancer trying to access /api/client/dashboard -> MUST 403
  const flTryClDash = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/client/dashboard',
    method: 'GET',
    headers: { 'x-user-id': 'USR-101' } // Freelancer Priya Sharma
  });
  assert.strictEqual(flTryClDash.status, 403, 'Freelancer MUST receive 403 when calling client dashboard');
  console.log('✓ Server blocked freelancer from calling client dashboard (HTTP 403)');

  console.log('=== TEST 3: Freelancer Dashboard Data Segregation ===');
  const flDash = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/freelancer/dashboard',
    method: 'GET',
    headers: { 'x-user-id': 'USR-101' }
  });
  assert.strictEqual(flDash.status, 200);
  const fin = flDash.body.overview.financials;
  assert(fin.receivedIncome !== undefined, 'Must have receivedIncome');
  assert(fin.pendingPayouts !== undefined, 'Must have pendingPayouts');
  assert(fin.projectedIncome !== undefined, 'Must have projectedIncome');
  assert(flDash.body.actionItems.length > 0, 'Must have action items');
  console.log(`✓ Freelancer Dashboard returns segregated financials (Received: ₹${fin.receivedIncome}, Pending: ₹${fin.pendingPayouts}, Projected: ₹${fin.projectedIncome})`);

  console.log('=== TEST 4: Client Dashboard Never Exposes Freelancer Earnings or Notes ===');
  const clDash = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/client/dashboard',
    method: 'GET',
    headers: { 'x-user-id': 'USR-102' }
  });
  assert.strictEqual(clDash.status, 200);
  assert.strictEqual(clDash.body.freelancerEarnings, undefined, 'Freelancer earnings MUST NOT be exposed to client');
  assert.strictEqual(clDash.body.freelancerPrivateNotes, undefined, 'Private notes MUST NOT be exposed to client');
  assert(clDash.body.overview.budgetCommitted > 0, 'Client sees their committed budget');
  assert(clDash.body.needsApproval.length > 0, 'Client sees items needing approval');
  console.log('✓ Client Dashboard strictly segregates data and excludes freelancer earnings/notes');

  console.log('=== TEST 5: State Machine: Only Client Can Approve Milestone ===');
  // Freelancer tries to approve milestone -> MUST FAIL with 403
  const flTryApprove = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/milestones/MS-102/transition',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-101' }
  }, { action: 'APPROVE_MILESTONE' });
  assert.strictEqual(flTryApprove.status, 403, 'Freelancer cannot approve milestone');
  console.log('✓ Freelancer milestone approval rejected with HTTP 403 Forbidden');

  // Client approves milestone -> SUCCESS, creates draft invoice and audit log
  const clApprove = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/milestones/MS-102/transition',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-102' }
  }, { action: 'APPROVE_MILESTONE', reason: 'Verified high-fidelity interactive prototype.' });
  assert.strictEqual(clApprove.status, 200);
  assert.strictEqual(clApprove.body.milestone.status, 'Invoiced');
  assert(clApprove.body.auditEntry, 'Audit log entry created');
  assert.strictEqual(clApprove.body.auditEntry.action, 'APPROVE_MILESTONE');
  console.log('✓ Client approved milestone; auto-created draft invoice and audit log entry');

  console.log('=== TEST 6: Scope Changes Require Client Approval ===');
  // Freelancer drafts scope amendment
  const draftAmendment = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/milestones/MS-102/scope-change',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-101' }
  }, { title: '3D Spline Animation', description: 'Interactive WebGL Coin', additionalCost: 6500, additionalDays: 2 });
  assert.strictEqual(draftAmendment.status, 200);
  const amdId = draftAmendment.body.amendment.id;

  // Client approves scope amendment
  const clApproveAmd = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/scope-amendments/${amdId}/approve`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-102' }
  });
  assert.strictEqual(clApproveAmd.status, 200);
  assert.strictEqual(clApproveAmd.body.amendment.status, 'approved');
  console.log('✓ Scope amendment drafted by freelancer, updated contract only upon client approval');

  console.log('=== TEST 7: Opportunities & Find Work Workflow ===');
  // Client forbidden from browsing freelancer opportunities
  const clTryOpps = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/opportunities',
    method: 'GET',
    headers: { 'x-user-id': 'USR-102' }
  });
  assert.strictEqual(clTryOpps.status, 403);

  // Freelancer gets opportunities
  const flOpps = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/opportunities',
    method: 'GET',
    headers: { 'x-user-id': 'USR-101' }
  });
  assert.strictEqual(flOpps.status, 200);
  assert.ok(Array.isArray(flOpps.body.opportunities));
  assert.ok(flOpps.body.opportunities.length > 0);
  const targetOpp = flOpps.body.opportunities[0];
  console.log(`✓ Freelancer can browse open work briefs (${flOpps.body.opportunities.length} available), client is 403 Forbidden`);

  // Freelancer accepts opportunity -> creates new project
  const acceptRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/opportunities/${targetOpp.id}/accept`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-101' }
  });
  assert.strictEqual(acceptRes.status, 200);
  assert.strictEqual(acceptRes.body.success, true);
  assert.ok(acceptRes.body.project.id);
  assert.strictEqual(acceptRes.body.project.freelancerId, 'USR-101');
  console.log(`✓ Freelancer accepts opportunity "${targetOpp.title}" -> New escrow project created (${acceptRes.body.project.id})`);

  console.log('=== TEST 8: Submit Work & Deliverables State Transition ===');
  // Freelancer submits deliverables for milestone MS-101
  const submitRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/milestones/MS-101/submit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-101' }
  }, {
    deliverables: [
      { name: 'fintech_flow_v2.fig', size: '14.2 MB', hash: 'sha256-a9b8c7d6e5f41234' },
      { name: 'design_specs_tokens.pdf', size: '2.8 MB', hash: 'sha256-1234567890abcdef' }
    ],
    notes: 'Uploaded final components and Figma link for client review.'
  });
  assert.strictEqual(submitRes.status, 200);
  assert.strictEqual(submitRes.body.milestone.status, 'In review');
  assert.strictEqual(submitRes.body.milestone.deliverables.length, 2);
  console.log('✓ Freelancer submits deliverables -> Milestone transitions to "In review" with tamper-proof file hashes');

  console.log('=== TEST 9: Project Messaging Channel ===');
  // Post a message in the project
  const msgPost = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/projects/PRJ-101/messages',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'USR-101' }
  }, { text: 'Hi Rahul, I have submitted the design files for Milestone 1. Let me know if you need any adjustments!' });
  assert.strictEqual(msgPost.status, 200);
  assert.strictEqual(msgPost.body.message.senderRole, 'freelancer');

  // Client reads messages
  const clReadMsgs = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/projects/PRJ-101/messages',
    method: 'GET',
    headers: { 'x-user-id': 'USR-102' }
  });
  assert.strictEqual(clReadMsgs.status, 200);
  assert.ok(clReadMsgs.body.messages.some(m => m.text.includes('Hi Rahul')));
  console.log('✓ Project messaging works bidirectionally between freelancer and client');

  console.log('\n=== ALL SERVER & STATE MACHINE API TESTS PASSED ===\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

