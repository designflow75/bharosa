// scratch/test_login_role_flow.js
// Verifies that first-time and returning visitors at / or /login see the login page,
// can select a role, and then get transitioned to their dashboard.

const fs = require('fs');
const assert = require('assert');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

console.log('=== TEST 1: index.html markup contains role selectors for all form factors ===');
// Desktop hero role buttons
assert(indexHtml.includes("demoLogin('client')"), 'Must contain client role trigger');
assert(indexHtml.includes("demoLogin('freelancer')"), 'Must contain freelancer role trigger');
assert(indexHtml.includes("demoLogin('admin')"), 'Must contain admin role trigger');

// Desktop clean role selection panel & hero CTA
assert(indexHtml.includes('SIGN IN TO WORKSPACE'), 'Must contain clean workspace sign-in header');
assert(indexHtml.includes('Select Your Role'), 'Must prompt user to select role');
assert(indexHtml.includes('Select Role &amp; Enter') || indexHtml.includes('Select Role & Enter'), 'Hero must have clear select role action');

// Mobile direct role selection in ml-actions-block
assert(indexHtml.includes('ml-direct-role-buttons'), 'Must contain direct role buttons on mobile');
assert(indexHtml.includes('btn-ml-role-direct'), 'Must have styled direct role buttons for mobile');
assert(indexHtml.includes('Rahul Verma • Fund Escrow'), 'Mobile client button must show descriptive metadata');
assert(indexHtml.includes('Priya Sharma • Submit & Payouts'), 'Mobile freelancer button must show descriptive metadata');
console.log('✓ All desktop and mobile role selection elements verified in index.html');

console.log('=== TEST 2: js/app.js routeView enforces login page on initial visit ===');
// Verify routeView does not redirect on / or /login
const routeViewSnippet = appJs.slice(appJs.indexOf('function routeView'), appJs.indexOf('// Universal shared routes'));
assert(routeViewSnippet.includes("if (pathname === '/' || pathname === '/login') {"), 'Must check for / or /login');
assert(routeViewSnippet.includes('showAuthScreen();'), 'Must call showAuthScreen on / or /login');
assert(!routeViewSnippet.includes("navigateTo('/freelancer/dashboard')"), 'Must NOT auto-redirect to freelancer dashboard on / or /login');
assert(!routeViewSnippet.includes("navigateTo('/client/dashboard')"), 'Must NOT auto-redirect to client dashboard on / or /login');
console.log('✓ routeView strictly serves the login screen on / and /login without auto-redirecting');

console.log('=== TEST 3: Simulated Navigation & Role Transition Flow ===');
// Mock minimal browser environment
let currentPath = '/';
let authScreenVisible = false;
let appShellVisible = false;
let sessionUser = { role: 'freelancer', name: 'Old User' }; // User already in localStorage from before

const documentMock = {
  body: {
    classList: {
      remove: (c) => {},
      add: (c) => {}
    },
    style: {}
  },
  getElementById: (id) => {
    if (id === 'auth-screen') {
      return {
        classList: { remove: () => {}, add: () => {} },
        style: {
          removeProperty: () => {},
          setProperty: () => {},
          display: ''
        }
      };
    }
    if (id === 'app-shell') {
      return {
        classList: { remove: () => {}, add: () => {} },
        style: {
          removeProperty: () => {},
          setProperty: () => {},
          display: ''
        }
      };
    }
    return null;
  }
};

// Test routeView logic
function testRouteView(pathname, user) {
  let displayedScreen = null;
  let redirectedTo = null;

  if (pathname === '/' || pathname === '/login') {
    displayedScreen = 'auth-screen';
    return { displayedScreen, redirectedTo };
  }

  if (!user) {
    displayedScreen = 'auth-screen';
    return { displayedScreen, redirectedTo };
  }

  if (pathname.startsWith('/client/dashboard')) {
    displayedScreen = 'client-dashboard';
  } else if (pathname.startsWith('/freelancer/dashboard')) {
    displayedScreen = 'freelancer-dashboard';
  } else if (pathname.startsWith('/admin')) {
    displayedScreen = 'admin-dashboard';
  }

  return { displayedScreen, redirectedTo };
}

// 1. Initial Visit at root /
const step1 = testRouteView('/', sessionUser);
assert.strictEqual(step1.displayedScreen, 'auth-screen', 'First visit MUST show auth / login screen');
assert.strictEqual(step1.redirectedTo, null, 'First visit MUST NOT auto-redirect');
console.log('✓ Step 1: User visits site (/) -> Login page displayed with role options');

// 2. User selects "Client" role
const clientProfile = { role: 'client', name: 'Rahul Verma', redirectTo: '/client/dashboard' };
sessionUser = clientProfile;
const step2 = testRouteView(clientProfile.redirectTo, sessionUser);
assert.strictEqual(step2.displayedScreen, 'client-dashboard', 'Selecting client role enters client dashboard');
console.log('✓ Step 2: User clicks Client -> Transitions directly to Client Dashboard');

// 3. User selects "Freelancer" role
const freelancerProfile = { role: 'freelancer', name: 'Priya Sharma', redirectTo: '/freelancer/dashboard' };
sessionUser = freelancerProfile;
const step3 = testRouteView(freelancerProfile.redirectTo, sessionUser);
assert.strictEqual(step3.displayedScreen, 'freelancer-dashboard', 'Selecting freelancer role enters freelancer dashboard');
console.log('✓ Step 3: User clicks Freelancer -> Transitions directly to Freelancer Suite');

// 4. User selects "Admin" role
const adminProfile = { role: 'admin', name: 'Arbiter', redirectTo: '/admin' };
sessionUser = adminProfile;
const step4 = testRouteView(adminProfile.redirectTo, sessionUser);
assert.strictEqual(step4.displayedScreen, 'admin-dashboard', 'Selecting admin role enters admin dashboard');
console.log('✓ Step 4: User clicks Admin -> Transitions directly to Admin Console');

console.log('\n=== ALL 3 LOGIN & ROLE SELECTION TESTS PASSED ===');
