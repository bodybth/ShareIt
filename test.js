// test.js — Breeze v2 pre-build checks
const fs  = require('fs');
const cap = JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const html = fs.readFileSync('www/index.html','utf8');
const patch = fs.readFileSync('patch-android.js','utf8');

let pass = 0, fail = 0;
function test(name, ok) {
  if (ok) { console.log(`  ✅  ${name}`); pass++; }
  else     { console.error(`  ❌  ${name}`); fail++; }
}

console.log('\n🧪 Breeze v2 checks…\n');

// ── HTML structure
test('DOCTYPE',                 html.includes('<!DOCTYPE html>'));
test('Viewport meta',           html.includes('viewport'));
test('PeerJS CDN',              html.includes('peerjs'));
test('jsQR CDN',                html.includes('jsqr'));
test('QRCode CDN',              html.includes('qrcodejs'));

// ── BLE
test('BLE plugin wired',        html.includes('BluetoothLe') || html.includes('BLE'));
test('BLE scan toggle',         html.includes('toggleScan'));
test('BLE scan result handler', html.includes('onBLEScanResult'));
test('Nearby device render',    html.includes('renderNearby'));

// ── Camera QR
test('getUserMedia call',       html.includes('getUserMedia'));
test('jsQR decode call',        html.includes('jsQR('));
test('openScanner function',    html.includes('function openScanner'));
test('stopScanner function',    html.includes('function stopScanner'));
test('QR video element',        html.includes('qr-video'));
test('QR canvas element',       html.includes('qr-canvas'));

// ── Incoming request / permission dialog
test('file-request message',    html.includes("'file-request'") || html.includes('"file-request"'));
test('accepted message',        html.includes("'accepted'") || html.includes('"accepted"'));
test('rejected message',        html.includes("'rejected'") || html.includes('"rejected"'));
test('showIncomingRequest fn',  html.includes('showIncomingRequest'));
test('acceptIncoming fn',       html.includes('acceptIncoming'));
test('rejectIncoming fn',       html.includes('rejectIncoming'));
test('Incoming modal present',  html.includes('modal-incoming'));

// ── File saving
test('saveFile to /sdcard/',    html.includes('Breeze/') && html.includes('EXTERNAL_STORAGE'));
test('blobToBase64 helper',     html.includes('blobToBase64'));
test('Filesystem plugin used',  html.includes('FS.writeFile') || html.includes('Filesystem'));

// ── Capacitor config
test('appId set',               !!cap.appId);
test('webDir = www',            cap.webDir === 'www');
test('Filesystem plugin conf',  !!cap.plugins?.Filesystem);
test('BLE plugin conf',         !!cap.plugins?.BluetoothLe);

// ── Package deps
const deps = {...pkg.dependencies, ...pkg.devDependencies};
test('@capacitor/android dep',        deps['@capacitor/android']?.startsWith('^8'));
test('@capacitor/filesystem dep',     deps['@capacitor/filesystem']?.startsWith('^8'));
test('@capacitor/network dep',        deps['@capacitor/network']?.startsWith('^8'));
test('@capacitor-community/ble dep',  deps['@capacitor-community/bluetooth-le']?.startsWith('^8'));

// ── Patch script
test('patch-android.js exists',       fs.existsSync('patch-android.js'));
test('BLUETOOTH_SCAN in patch',       patch.includes('BLUETOOTH_SCAN'));
test('CAMERA permission in patch',    patch.includes('android.permission.CAMERA'));
test('EXTERNAL_STORAGE in patch',     patch.includes('EXTERNAL_STORAGE'));
test('MANAGE_EXTERNAL_STORAGE',       patch.includes('MANAGE_EXTERNAL_STORAGE'));
test('requestLegacyExternalStorage',  patch.includes('requestLegacyExternalStorage'));

console.log(`\n📊  ${pass} passed · ${fail} failed\n`);
if (fail) { process.exit(1); }
else console.log('All checks passed! Ready to build APK 🍃\n');
