const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  { name: 'Header segmented switcher exists', pass: html.includes('id="header-role-switcher"') },
  { name: 'Freelancer seg button exists with onclick switchRole(\'freelancer\')', pass: html.includes('id="seg-btn-freelancer"') && html.includes("switchRole('freelancer')") },
  { name: 'Client seg button exists with onclick switchRole(\'client\')', pass: html.includes('id="seg-btn-client"') && html.includes("switchRole('client')") },
  { name: 'Admin seg button exists with onclick switchRole(\'admin\')', pass: html.includes('id="seg-btn-admin"') && html.includes("switchRole('admin')") },
  { name: 'Ambient glow elements exist', pass: html.includes('glow-dash-left') && html.includes('glow-dash-right') },
  { name: 'Freelancer cyber hero exists', pass: html.includes('class="dashboard-cyber-hero dch-freelancer"') },
  { name: 'Client cyber hero exists', pass: html.includes('class="dashboard-cyber-hero"') },
  { name: 'Admin cyber hero exists', pass: html.includes('class="dashboard-cyber-hero dch-admin"') },
  { name: 'All 3 cyber heroes contain SVG 3D shield', pass: (html.match(/dch-shield-center/g) || []).length >= 3 },
  { name: 'All 3 cyber heroes contain pedestal rings', pass: (html.match(/dch-pedestal-ring/g) || []).length >= 6 },
  { name: 'All 3 cyber heroes contain agreement cards', pass: (html.match(/dch-agreement-card/g) || []).length >= 3 },
  { name: 'Freelancer chart container exists in index.html', pass: html.includes('id="fl-chart-svg-container"') },
  { name: 'Client chart container exists in index.html', pass: html.includes('id="cl-chart-svg-container"') },
  { name: 'Freelancer chart range selector exists', pass: html.includes('onclick="setFreelancerChartRange(\'30d\')"') },
  { name: 'Client chart range selector exists', pass: html.includes('onclick="setClientChartRange(\'30d\')"') },
  { name: 'Admin chart container exists in app.js', pass: fs.readFileSync('js/app.js', 'utf8').includes('id="adm-chart-svg-container"') },
  { name: 'Admin chart range selector exists in app.js', pass: fs.readFileSync('js/app.js', 'utf8').includes('onclick="setAdminChartRange(\'30d\')"') }
];

let allPassed = true;
checks.forEach(c => {
  console.log((c.pass ? '✓ ' : '✗ ') + c.name);
  if (!c.pass) allPassed = false;
});

if (!allPassed) process.exit(1);
console.log('\nAll HTML DOM structural checks passed!');
