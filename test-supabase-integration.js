// test-supabase-integration.js
// Verification for Supabase adapter, API endpoints, and fallback behavior

const app = require('./server.js');
const http = require('http');
const assert = require('assert');

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

async function run() {
  const server = app.listen(3099, async () => {
    console.log('Test server running on port 3099');

    try {
      console.log('\n--- 1. Testing /api/supabase/status ---');
      const statusRes = await request({
        hostname: 'localhost',
        port: 3099,
        path: '/api/supabase/status',
        method: 'GET'
      });
      console.log('Status code:', statusRes.status);
      console.log('Response:', statusRes.body);
      assert.strictEqual(statusRes.status, 200);
      assert.ok('connected' in statusRes.body);
      assert.ok('activeCounts' in statusRes.body);

      console.log('\n--- 2. Testing /api/auth/login ---');
      const loginRes = await request({
        hostname: 'localhost',
        port: 3099,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { role: 'freelancer' });
      assert.strictEqual(loginRes.status, 200);
      assert.strictEqual(loginRes.body.user.role, 'freelancer');
      console.log('✓ Login successful for:', loginRes.body.user.name);

      console.log('\n--- 3. Testing /api/projects ---');
      const projRes = await request({
        hostname: 'localhost',
        port: 3099,
        path: '/api/projects',
        method: 'GET',
        headers: { 'x-user-id': 'USR-101' }
      });
      assert.strictEqual(projRes.status, 200);
      console.log('✓ Loaded projects count:', projRes.body.projects.length);

      console.log('\n--- 4. Testing /api/milestones/:id/transition ---');
      const transitionRes = await request({
        hostname: 'localhost',
        port: 3099,
        path: '/api/milestones/MS-103/transition',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'USR-102' // Client
        }
      }, { action: 'FUND_MILESTONE' });
      assert.strictEqual(transitionRes.status, 200);
      assert.strictEqual(transitionRes.body.milestone.status, 'Funded');
      console.log('✓ Milestone funded successfully!');

      console.log('\n=======================================');
      console.log('ALL SUPABASE INTEGRATION TESTS PASSED!');
      console.log('=======================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('Test failed:', err);
      server.close(() => process.exit(1));
    }
  });
}

run();
