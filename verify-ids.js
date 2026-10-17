const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('js/app.js', 'utf8');

const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const ids = new Set();
while ((match = idRegex.exec(js)) !== null) {
  ids.add(match[1]);
}

console.log('Total unique IDs accessed in js/app.js:', ids.size);
const missing = [];
for (const id of ids) {
  if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
    missing.push(id);
  }
}

if (missing.length === 0) {
  console.log('✓ ALL IDs in js/app.js exist in index.html!');
} else {
  console.log('Missing IDs:', missing);
}
