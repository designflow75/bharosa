// test-e2e.js
// Automated verification for Bharosa shared store, dual-perspective controller, and escrow flow.

const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

// Mock document & window
global.window = {
  addEventListener: () => {},
  scrollTo: () => {}
};
global.document = {
  documentElement: { setAttribute: () => {} },
  getElementById: (id) => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Import app logic
const app = require('./js/app.js');

console.log('--- TEST 1: Default Shared Store Initialization ---');
const defaultStore = app.getDefaultSharedStore();
assert(defaultStore.stats.escrowBalance === 20000, 'Default escrow should be 20,000');
assert(defaultStore.stats.monthlyEarnings === 51000, 'Default earnings should be 51,000');
assert(defaultStore.milestones.length === 5, 'Should have 5 milestones');

const ms102 = defaultStore.milestones.find(m => m.id === 'MS-102');
assert(ms102 && ms102.status === 'In Review', 'MS-102 must be In Review initially');

const inv102 = defaultStore.invoices.find(i => i.milestoneId === 'MS-102');
assert(inv102 && inv102.status === 'secured', 'Invoice for MS-102 must be secured initially');

console.log('✓ Test 1 passed: Default store verified');

console.log('--- TEST 2: Approve Milestone MS-102 ---');
// Set store to default
app.store.stats = JSON.parse(JSON.stringify(defaultStore.stats));
app.store.milestones = JSON.parse(JSON.stringify(defaultStore.milestones));
app.store.invoices = JSON.parse(JSON.stringify(defaultStore.invoices));
app.store.evidenceVault = JSON.parse(JSON.stringify(defaultStore.evidenceVault));
app.store.kanbanTasks = JSON.parse(JSON.stringify(defaultStore.kanbanTasks));

app.approveMilestone('MS-102');

// Verify milestone status
const approvedM = app.store.milestones.find(m => m.id === 'MS-102');
assert.strictEqual(approvedM.status, 'Released', 'Status must be Released');
assert(approvedM.releasedAt !== null, 'releasedAt must have timestamp');

// Verify stats
assert.strictEqual(app.store.stats.escrowBalance, 0, 'Escrow balance should decrease by 20,000 to 0');
assert.strictEqual(app.store.stats.monthlyEarnings, 71000, 'Monthly earnings should increase from 51,000 to 71,000');

// Verify invoice status
const approvedInv = app.store.invoices.find(i => i.milestoneId === 'MS-102');
assert.strictEqual(approvedInv.status, 'paid', 'Invoice status must be paid');

// Verify Evidence Vault entry
const latestAudit = app.store.evidenceVault[0];
assert(latestAudit.title.includes('Approved & Released'), 'Evidence vault must log approved milestone');
assert(latestAudit.hash && latestAudit.hash.length > 5, 'Evidence vault entry must include hash');

// Verify Kanban task
const kanbanTask4 = app.store.kanbanTasks.find(t => t.id === 'task-4');
assert.strictEqual(kanbanTask4.col, 'completed', 'Kanban task-4 must move to completed column');

console.log('✓ Test 2 passed: Approve milestone correctly updates escrow, earnings, invoice, audit log, and kanban');

console.log('--- TEST 3: Submit Milestone for Review ---');
const ms103Before = app.store.milestones.find(m => m.id === 'MS-103');
assert.strictEqual(ms103Before.status, 'Pending', 'MS-103 must be Pending initially');

app.submitMilestoneForReview('MS-103');

const ms103After = app.store.milestones.find(m => m.id === 'MS-103');
assert.strictEqual(ms103After.status, 'In Review', 'MS-103 status must be In Review after submission');
assert(ms103After.submittedAt !== null, 'submittedAt must be set');

const auditSubmit = app.store.evidenceVault[0];
assert(auditSubmit.title.includes('Deliverables Submitted'), 'Evidence vault must log submitted deliverables');

console.log('✓ Test 3 passed: Freelancer submit milestone works');

console.log('--- TEST 4: Role Differentiated Perspectives ---');
// Mock DOM elements for test 4
const elements = {};
function getMockElement(id) {
  if (!elements[id]) {
    elements[id] = { textContent: '', innerHTML: '', style: {}, classList: { add: ()=>{}, remove: ()=>{} } };
  }
  return elements[id];
}
global.document.getElementById = (id) => getMockElement(id);

// Switch to Client mode
app.state.currentRole = 'client';
app.renderAllViews();

assert.strictEqual(getMockElement('dashboard-main-heading').textContent, 'Client Escrow & Approvals Portal');
assert.strictEqual(getMockElement('stat-title-projects').textContent, 'Active Engagements');
assert.strictEqual(getMockElement('stat-projects-count').textContent, '1 Active');
assert.strictEqual(getMockElement('stat-title-settled').textContent, 'Total Released to Contractors');
assert.strictEqual(getMockElement('nav-text-dashboard').textContent, 'Approvals & Escrow');
assert(getMockElement('dashboard-alerts-row').innerHTML.includes('Deliverable Review Pending'), 'Client alert must show pending review');
assert(getMockElement('dashboard-projects-body').innerHTML.includes('Priya Sharma'), 'Client table must show contractor deliverables');

// Switch to Freelancer mode
app.state.currentRole = 'freelancer';
app.renderAllViews();

assert.strictEqual(getMockElement('dashboard-main-heading').textContent, 'Freelancer Workspace Overview');
assert.strictEqual(getMockElement('stat-title-projects').textContent, 'Active Projects');
assert.strictEqual(getMockElement('stat-projects-count').textContent, '3 Active');
assert.strictEqual(getMockElement('stat-title-settled').textContent, 'Monthly Settled Earnings');
assert.strictEqual(getMockElement('nav-text-dashboard').textContent, 'Dashboard');
assert(getMockElement('dashboard-alerts-row').innerHTML.includes('72-Hour Client Silence Protocol'), 'Freelancer alert must show silence protocol');

console.log('✓ Test 4 passed: Client and Freelancer dashboards are completely differentiated');

console.log('--- ALL AUTOMATED LOGIC TESTS PASSED ---');

