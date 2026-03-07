/**
 * patch-android.js — Breeze v2
 *
 * Safely patches AndroidManifest.xml after `npx cap add android`.
 * Every permission is checked individually before insertion —
 * no duplicates, no invalid attributes.
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

// ── Helper: inject a permission only if not already present ──────────────────
function addPermission(name, extra = '') {
  if (xml.includes(`android:name="${name}"`)) {
    console.log(`  ⏭️  Already present: ${name}`);
    return;
  }
  const tag = extra
    ? `    <uses-permission android:name="${name}"\n        ${extra}/>`
    : `    <uses-permission android:name="${name}"/>`;
  xml = xml.replace('</manifest>', tag + '\n</manifest>');
  console.log(`  ✅  Added: ${name}`);
}

function addFeature(name, required = 'false') {
  if (xml.includes(`android:name="${name}"`)) return;
  const tag = `    <uses-feature android:name="${name}" android:required="${required}"/>`;
  xml = xml.replace('</manifest>', tag + '\n</manifest>');
  console.log(`  ✅  Added feature: ${name}`);
}

console.log('\n🔧 Patching AndroidManifest.xml…\n');

// ── 1. Add tools namespace ────────────────────────────────────────────────────
if (!xml.includes('xmlns:tools')) {
  xml = xml.replace(
    /(<manifest\b[^>]*)(>)/,
    '$1\n    xmlns:tools="http://schemas.android.com/tools"$2'
  );
  console.log('  ✅  Added xmlns:tools namespace');
}

// ── 2. Permissions ───────────────────────────────────────────────────────────
// Bluetooth legacy (Android <= 11)
addPermission('android.permission.BLUETOOTH',       'android:maxSdkVersion="30"');
addPermission('android.permission.BLUETOOTH_ADMIN', 'android:maxSdkVersion="30"');

// Bluetooth modern (Android 12+) — NO tools:targetSdk (not a valid merger instruction)
addPermission('android.permission.BLUETOOTH_SCAN',
  'android:usesPermissionFlags="neverForLocation"');
addPermission('android.permission.BLUETOOTH_CONNECT');
addPermission('android.permission.BLUETOOTH_ADVERTISE');

// Location (required for BLE on Android < 12)
addPermission('android.permission.ACCESS_FINE_LOCATION');
addPermission('android.permission.ACCESS_COARSE_LOCATION');

// Network — INTERNET is already added by Capacitor, skip to avoid duplicate
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

// Vibration
addPermission('android.permission.VIBRATE');

// ── 3. requestLegacyExternalStorage ──────────────────────────────────────────
if (!xml.includes('requestLegacyExternalStorage')) {
  xml = xml.replace(
    /(<application\b)([^>]*?)(>)/s,
    '$1$2\n        android:requestLegacyExternalStorage="true"$3'
  );
  console.log('\n  ✅  Set requestLegacyExternalStorage="true"');
} else {
  console.log('\n  ⏭️  requestLegacyExternalStorage already set');
}

// ── 4. BLE queries block ──────────────────────────────────────────────────────
if (!xml.includes('<queries>')) {
  const queries = `
    <queries>
        <intent>
            <action android:name="android.bluetooth.adapter.action.REQUEST_ENABLE"/>
        </intent>
    </queries>
`;
  xml = xml.replace('</manifest>', queries + '</manifest>');
  console.log('  ✅  Added BLE queries block');
} else {
  console.log('  ⏭️  queries block already present');
}

// ── Write ─────────────────────────────────────────────────────────────────────
fs.writeFileSync(MANIFEST, xml, 'utf8');
console.log('\n✅  AndroidManifest.xml patched!\n');

// ── 5. Patch variables.gradle for Capacitor 8 (minSdk=24) ────────────────────
if (fs.existsSync(GRADLE)) {
  let gradle = fs.readFileSync(GRADLE, 'utf8');
  const before = gradle;
  gradle = gradle.replace(/minSdkVersion\s*=\s*\d+/,     'minSdkVersion = 24');
  gradle = gradle.replace(/compileSdkVersion\s*=\s*\d+/,  'compileSdkVersion = 36');
  gradle = gradle.replace(/targetSdkVersion\s*=\s*\d+/,   'targetSdkVersion = 36');
  if (gradle !== before) {
    fs.writeFileSync(GRADLE, gradle, 'utf8');
    console.log('✅  variables.gradle: minSdk=24, compileSdk=36, targetSdk=36\n');
  } else {
    console.log('⏭️  variables.gradle already up to date\n');
  }
} else {
  console.log('⚠️  variables.gradle not found — skip\n');
}
