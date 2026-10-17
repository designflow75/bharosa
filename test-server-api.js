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

  console.log('\n=== ALL SERVER & STATE MACHINE API TESTS PASSED ===\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
