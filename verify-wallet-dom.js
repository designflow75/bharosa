// verify-wallet-dom.js
// Verification of static DOM, IDs, modal attributes, and onclick handlers for Wallet Hub

const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('js/app.js', 'utf8');

console.log('=== VERIFYING DOM FOR WALLET HUB ===');

// 1. Verify view-wallet section and core elements
const requiredIds = [
  'view-wallet',
  'wallet-view-title',
  'wallet-view-subtitle',
  'wallet-header-actions',
  'wallet-hero-banner',
  'wallet-hero-badge',
  'wallet-hero-badge-text',
  'wallet-hero-amount',
  'wallet-hero-desc',
  'wallet-quick-chips-container',
  'wallet-hero-action-slot',
  'wallet-custody-pill',
  'wallet-stat-title-1', 'wallet-stat-val-1',
  'wallet-stat-title-2', 'wallet-stat-val-2',
  'wallet-stat-title-3', 'wallet-stat-val-3',
  'wallet-stat-title-4', 'wallet-stat-val-4',
  'btn-wallet-filter-all',
  'btn-wallet-filter-credits',
  'btn-wallet-filter-debits',
  'wallet-ledger-tbody',
  'wallet-sidecard-title',
  'wallet-sidecard-body',
  // Modals
  'modal-wallet-credit',
  'credit-amount-input',
  'credit-method-select',
  'credit-note-input',
  'btn-submit-wallet-credit',
  'modal-wallet-withdraw',
  'modal-withdraw-avail-bal',
  'withdraw-amount-input',
  'withdraw-account-select',
  'withdraw-payout-speed',
  'btn-submit-wallet-withdraw'
];

requiredIds.forEach(id => {
  assert(html.includes(`id="${id}"`), `Missing ID in index.html: ${id}`);
});
console.log(`✓ All ${requiredIds.length} required Wallet DOM element IDs verified in index.html`);

// 2. Verify onclick attributes in HTML match functions exported in JS
const onclickPatterns = [
  'filterWalletLedger(\'all\')',
  'filterWalletLedger(\'credit\')',
  'filterWalletLedger(\'withdrawal_debit\')',
  'submitWalletCredit(event)',
  'submitWalletWithdraw(event)',
  'quickFillCreditAmount(25000)',
  'quickFillWithdrawMax()',
  'closeModal(\'modal-wallet-credit\')',
  'closeModal(\'modal-wallet-withdraw\')'
];

onclickPatterns.forEach(pattern => {
  assert(html.includes(pattern), `Missing onclick in HTML: ${pattern}`);
});
console.log(`✓ All ${onclickPatterns.length} HTML onclick handlers verified`);

// 3. Verify JS Controller functions and Window exports
const exportedFunctions = [
  'loadWalletHub',
  'renderWalletUI',
  'renderWalletLedger',
  'filterWalletLedger',
  'openWalletCreditModal',
  'quickOpenCredit',
  'quickFillCreditAmount',
  'submitWalletCredit',
  'openWalletWithdrawModal',
  'quickOpenWithdraw',
  'quickFillWithdrawMax',
  'submitWalletWithdraw'
];

exportedFunctions.forEach(fn => {
  assert(js.includes(`function ${fn}`), `Missing function declaration in js/app.js: ${fn}`);
  assert(js.includes(`window.${fn} = ${fn}`), `Missing window export in js/app.js: ${fn}`);
});
console.log(`✓ All ${exportedFunctions.length} wallet controller functions and window exports verified in js/app.js`);

// 4. Verify Router integration
assert(js.includes("pathname === '/freelancer/wallet' || pathname === '/client/wallet' || pathname === '/wallet'"), 'Wallet route dispatch missing');
assert(js.includes("loadWalletHub()"), 'loadWalletHub call missing in router');
assert(js.includes("navigateTo('/freelancer/wallet')"), 'freelancer sidebar link missing');
assert(js.includes("navigateTo('/client/wallet')"), 'client sidebar link missing');
console.log('✓ Router, sidebar menus, and dashboard card links verified');

console.log('\n=== ALL DOM & JAVASCRIPT WALLET AUDITS PASSED ===\n');
