// test.js
const fs = require('fs');

const html = fs.readFileSync('www/index.html', 'utf8');
const cap  = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));

let pass = 0, fail = 0;
function test(name, ok) {
  if (ok) { console.log(`  ✅ ${name}`); pass++; }
  else     { console.error(`  ❌ ${name}`); fail++; }
}

console.log('\n🧪 Breeze pre-build checks…\n');

// HTML checks
test('DOCTYPE present',        html.includes('<!DOCTYPE html>'));
test('App title present',      html.includes('<title>'));
test('PeerJS loaded',          html.includes('peerjs'));
test('QR code lib loaded',     html.includes('qrcodejs'));
test('initPeer() defined',     html.includes('function initPeer'));
test('sendFiles() defined',    html.includes('function sendFiles'));
test('Drop zone present',      html.includes('drop-zone'));
test('File input present',     html.includes('file-input'));
test('Connect button present', html.includes('connect-btn'));
test('Send button present',    html.includes('send-btn'));
test('Progress bar present',   html.includes('progress-bar'));
test('Transfer log present',   html.includes('log-list'));

// Capacitor config checks
test('appId set',    !!cap.appId && cap.appId.length > 0);
test('appName set',  !!cap.appName);
test('webDir = www', cap.webDir === 'www');

console.log(`\n📊  ${pass} passed · ${fail} failed\n`);
if (fail > 0) { process.exit(1); }
else console.log('All checks passed! Ready to build APK 🍃\n');
