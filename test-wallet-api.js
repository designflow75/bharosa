// test-wallet-api.js
// Automated verification for Bharosa Escrow Pre-Funding Vault & Freelancer Payout Wallet

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

async function runWalletTests() {
  console.log('=== TEST 1: Client Escrow Wallet Retrieval ===');
  const clientWalletRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/wallet',
    method: 'GET',
    headers: { 'x-user-id': 'USR-102' }
  });
  assert.strictEqual(clientWalletRes.status, 200, 'Client wallet should return 200');
  assert.strictEqual(clientWalletRes.body.success, true);
  assert.strictEqual(clientWalletRes.body.wallet.role, 'client');
  const initialClientBal = clientWalletRes.body.wallet.availableBalance;
  console.log(`✓ Client wallet retrieved: Balance = ₹${initialClientBal}`);

  console.log('=== TEST 2: Client Credit / Pre-Fund Escrow Vault ===');
  const depositAmount = 15000;
  const creditRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/wallet/credit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'USR-102'
    }
  }, {
    amount: depositAmount,
    method: 'UPI Instant (Google Pay)',
    referenceNote: 'Q4 Milestone Escrow Pre-Funding'
  });
  assert.strictEqual(creditRes.status, 200, 'Credit should return 200');
  assert.strictEqual(creditRes.body.success, true);
  assert.strictEqual(creditRes.body.wallet.availableBalance, initialClientBal + depositAmount);
  assert.strictEqual(creditRes.body.transaction.type, 'credit');
  assert.strictEqual(creditRes.body.transaction.amount, depositAmount);
  console.log(`✓ Client credited ₹${depositAmount} successfully. New balance: ₹${creditRes.body.wallet.availableBalance}`);

  console.log('=== TEST 3: Freelancer Forbidden to Call Client Credit API ===');
  const flCreditForbidden = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/wallet/credit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'USR-101' // Priya Sharma (Freelancer)
    }
  }, { amount: 5000 });
  assert.strictEqual(flCreditForbidden.status, 403, 'Freelancer calling credit should return 403 Forbidden');
  console.log('✓ Freelancer blocked from client escrow credit endpoint with HTTP 403');

  console.log('=== TEST 4: Freelancer Earnings Wallet Retrieval ===');
  const flWalletRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/wallet',
    method: 'GET',
    headers: { 'x-user-id': 'USR-101' }
  });
  assert.strictEqual(flWalletRes.status, 200);
  assert.strictEqual(flWalletRes.body.wallet.role, 'freelancer');
  const initialFlBal = flWalletRes.body.wallet.availableBalance;
  assert(initialFlBal >= 10000, 'Freelancer should have cleared balance');
  console.log(`✓ Freelancer wallet retrieved: Withdrawable Balance = ₹${initialFlBal}`);

  console.log('=== TEST 5: Freelancer Debit / Bank Payout Withdrawal ===');
  const withdrawAmount = 10000;
  const withdrawRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/wallet/withdraw',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'USR-101'
    }
  }, {
    amount: withdrawAmount,
    destinationAccountId: 'BANK-01',
    payoutMethod: 'Instant IMPS Transfer'
  });
  assert.strictEqual(withdrawRes.status, 200, 'Withdrawal should return 200');
  assert.strictEqual(withdrawRes.body.success, true);
  assert.strictEqual(withdrawRes.body.wallet.availableBalance, initialFlBal - withdrawAmount);
  assert.strictEqual(withdrawRes.body.transaction.type, 'withdrawal_debit');
  assert.strictEqual(withdrawRes.body.transaction.amount, withdrawAmount);
  assert(withdrawRes.body.transaction.referenceId.startsWith('UTR-'), 'Transaction must have UTR');
  console.log(`✓ Freelancer debited ₹${withdrawAmount} to bank. UTR: ${withdrawRes.body.transaction.referenceId}`);

  console.log('=== TEST 6: Client Forbidden to Call Freelancer Withdraw API ===');
  const clWithdrawForbidden = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/wallet/withdraw',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'USR-102' // Rahul Verma (Client)
    }
  }, { amount: 5000 });
  assert.strictEqual(clWithdrawForbidden.status, 403, 'Client calling withdraw should return 403 Forbidden');
  console.log('✓ Client blocked from freelancer bank withdrawal endpoint with HTTP 403');

  console.log('=== TEST 7: Overdraft Protection / Insufficient Funds Check ===');
  const overdraftRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/wallet/withdraw',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'USR-101'
    }
  }, {
    amount: 99999999 // Exceeds balance
  });
  assert.strictEqual(overdraftRes.status, 400, 'Overdraft should return 400 Bad Request');
  assert(overdraftRes.body.error === 'Insufficient funds', 'Should return Insufficient funds');
  console.log('✓ Overdraft blocked: Insufficient funds validation successful');

  console.log('\n=== ALL 7 WALLET API & ROLE SECURITY TESTS PASSED ===\n');
}

runWalletTests().catch(err => {
  console.error('Wallet test failed:', err);
  process.exit(1);
});
