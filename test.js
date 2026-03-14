// test.js — Breeze v2 checks
const fs  = require('fs');
const cap = JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const html = fs.readFileSync('www/index.html','utf8');
const patch = fs.readFileSync('patch-android.js','utf8');

let pass=0, fail=0;
function test(name, ok) {
  if (ok) { console.log(`  ✅  ${name}`); pass++; }
  else     { console.error(`  ❌  ${name}`); fail++; }
}

console.log('\n🧪 Breeze v2 checks…\n');

// HTML structure
test('DOCTYPE',            html.includes('<!DOCTYPE html>'));
test('PeerJS CDN',         html.includes('peerjs'));
test('jsQR CDN',           html.includes('jsqr'));
test('QRCode CDN',         html.includes('qrcodejs'));

// BLE advertising
test('startBLEAdvertising fn', html.includes('startBLEAdvertising'));
test('BLE.startAdvertising',   html.includes('BLE.startAdvertising'));
test('BZ: prefix in advert',   html.includes("'BZ:'"));
test('stopBLEAdvertising fn',  html.includes('stopBLEAdvertising'));

// BLE scanning
test('toggleScan fn',          html.includes('toggleScan'));
test('onBLEScanResult fn',     html.includes('onBLEScanResult'));
test('BZ: detection in scan',  html.includes("startsWith('BZ:')"));
test('extractedPeerId',        html.includes('extractedPeerId'));
test('renderNearby fn',        html.includes('renderNearby'));
test('BLE requestEnable',      html.includes('BLE.requestEnable'));
test('Auto-connect on tap',    html.includes('isBreeze && dev.peerId'));

// Camera QR
test('getUserMedia',           html.includes('getUserMedia'));
test('jsQR decode',            html.includes('jsQR('));
test('openScanner fn',         html.includes('function openScanner'));

// Transfer protocol
test('file-request msg',       html.includes("'file-request'"));
test('accepted msg',           html.includes("'accepted'"));
test('showIncomingRequest fn', html.includes('showIncomingRequest'));
test('acceptIncoming fn',      html.includes('acceptIncoming'));
test('Incoming modal',         html.includes('modal-incoming'));

// File saving — Downloads
test('DOWNLOADS directory',    html.includes("'DOWNLOADS'"));
test('EXTERNAL_STORAGE dir',   html.includes("'EXTERNAL_STORAGE'"));
test('getUri call',            html.includes('getUri'));
test('blobToBase64 fn',        html.includes('blobToBase64'));
test('guessMime fn',           html.includes('guessMime'));

// File viewer
test('openReceivedFile fn',    html.includes('openReceivedFile'));
test('shareCurrentFile fn',    html.includes('shareCurrentFile'));
test('Image thumbnail',        html.includes('file-card-thumb'));
test('Video player',           html.includes('<video'));
test('Audio player',           html.includes('<audio'));
test('File viewer modal',      html.includes('modal-fileview'));
test('Blob URL revoked',       html.includes('revokeObjectURL'));

// Error handling
test('peer-unavailable silent',html.includes("'peer-unavailable') return"));
test('Offline guard',          html.includes('navigator.onLine'));
test('Toast rate limit',       html.includes('box.children.length > 2'));

// Capacitor config
test('appId set',              !!cap.appId);
test('webDir = www',           cap.webDir === 'www');

// Package deps v8
const deps = {...pkg.dependencies, ...pkg.devDependencies};
test('@capacitor/android ^8',  deps['@capacitor/android']?.startsWith('^8'));
test('@capacitor/filesystem',  deps['@capacitor/filesystem']?.startsWith('^8'));
test('@capacitor/share',       !!deps['@capacitor/share']);
test('@capacitor/network',     deps['@capacitor/network']?.startsWith('^8'));
test('@capacitor-comm/ble ^8', deps['@capacitor-community/bluetooth-le']?.startsWith('^8'));

// Patch script
test('BLUETOOTH_ADVERTISE',    patch.includes('BLUETOOTH_ADVERTISE'));
test('BLUETOOTH_SCAN',         patch.includes('BLUETOOTH_SCAN'));
test('CAMERA permission',      patch.includes('android.permission.CAMERA'));
test('MANAGE_EXTERNAL_STORAGE',patch.includes('MANAGE_EXTERNAL_STORAGE'));
test('minSdk=24',              patch.includes('minSdkVersion = 24'));

console.log(`\n📊  ${pass} passed · ${fail} failed\n`);
if (fail) process.exit(1);
else console.log('All checks passed! 🍃\n');
