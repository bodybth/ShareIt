/**
 * patch-android.js — Breeze v2
 * Idempotent: checks before each injection, never creates duplicates.
 */
const fs   = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, 'android/app/src/main/AndroidManifest.xml');
const GRADLE   = path.join(__dirname, 'android/variables.gradle');

if (!fs.existsSync(MANIFEST)) {
  console.error('❌  AndroidManifest.xml not found. Run `npx cap add android` first.');
  process.exit(1);
}

let xml = fs.readFileSync(MANIFEST, 'utf8');

function addPermission(name, extra = '') {
  if (xml.includes(`android:name="${name}"`)) { console.log(`  ⏭️  ${name}`); return; }
  const tag = extra ? `    <uses-permission android:name="${name}"\n        ${extra}/>` : `    <uses-permission android:name="${name}"/>`;
  xml = xml.replace('</manifest>', tag + '\n</manifest>');
  console.log(`  ✅  ${name}`);
}
function addFeature(name, required='false') {
  if (xml.includes(`android:name="${name}"`)) return;
  xml = xml.replace('</manifest>', `    <uses-feature android:name="${name}" android:required="${required}"/>\n</manifest>`);
  console.log(`  ✅  feature: ${name}`);
}

console.log('\n🔧 Patching AndroidManifest.xml…\n');

// Tools namespace
if (!xml.includes('xmlns:tools')) {
  xml = xml.replace(/(<manifest\b[^>]*)(>)/, '$1\n    xmlns:tools="http://schemas.android.com/tools"$2');
  console.log('  ✅  xmlns:tools');
}

// Bluetooth
addPermission('android.permission.BLUETOOTH',       'android:maxSdkVersion="30"');
addPermission('android.permission.BLUETOOTH_ADMIN', 'android:maxSdkVersion="30"');
addPermission('android.permission.BLUETOOTH_SCAN',       'android:usesPermissionFlags="neverForLocation"');
addPermission('android.permission.BLUETOOTH_CONNECT');
addPermission('android.permission.BLUETOOTH_ADVERTISE'); // ← needed for BLE advertising

// Location (required for BLE scan on Android < 12)
addPermission('android.permission.ACCESS_FINE_LOCATION');
addPermission('android.permission.ACCESS_COARSE_LOCATION');

// Network (INTERNET already added by Capacitor — skip)
addPermission('android.permission.ACCESS_WIFI_STATE');
addPermission('android.permission.ACCESS_NETWORK_STATE');
addPermission('android.permission.CHANGE_NETWORK_STATE');
addPermission('android.permission.CHANGE_WIFI_STATE');

// Camera (QR scanner)
addPermission('android.permission.CAMERA');
addFeature('android.hardware.camera');

// Storage
addPermission('android.permission.READ_EXTERNAL_STORAGE',  'android:maxSdkVersion="32"');
addPermission('android.permission.WRITE_EXTERNAL_STORAGE', 'android:maxSdkVersion="29"');
addPermission('android.permission.MANAGE_EXTERNAL_STORAGE');

// Vibrate
addPermission('android.permission.VIBRATE');

// requestLegacyExternalStorage
if (!xml.includes('requestLegacyExternalStorage')) {
  xml = xml.replace(/(<application\b)([^>]*?)(>)/s, '$1$2\n        android:requestLegacyExternalStorage="true"$3');
  console.log('\n  ✅  requestLegacyExternalStorage="true"');
}

// BLE queries block
if (!xml.includes('<queries>')) {
  xml = xml.replace('</manifest>', `\n    <queries><intent><action android:name="android.bluetooth.adapter.action.REQUEST_ENABLE"/></intent></queries>\n</manifest>`);
  console.log('  ✅  BLE queries block');
}

fs.writeFileSync(MANIFEST, xml, 'utf8');
console.log('\n✅  AndroidManifest.xml done!\n');

// Patch variables.gradle for Capacitor 8 (minSdk=24)
if (fs.existsSync(GRADLE)) {
  let g = fs.readFileSync(GRADLE, 'utf8'), b = g;
  g = g.replace(/minSdkVersion\s*=\s*\d+/,    'minSdkVersion = 24');
  g = g.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 36');
  g = g.replace(/targetSdkVersion\s*=\s*\d+/,  'targetSdkVersion = 36');
  if (g !== b) { fs.writeFileSync(GRADLE, g, 'utf8'); console.log('✅  variables.gradle: minSdk=24, compileSdk=36, targetSdk=36\n'); }
}
