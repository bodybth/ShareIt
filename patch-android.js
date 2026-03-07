/**
 * patch-android.js
 * Runs after `npx cap add android` to inject:
 *  - All required Android permissions
 *  - requestLegacyExternalStorage for /sdcard/ access
 *  - tools namespace for permission flags
 *  - queries block for BLE on Android 12+
 */

const fs   = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, 'android/app/src/main/AndroidManifest.xml');

if (!fs.existsSync(MANIFEST)) {
  console.error('❌  AndroidManifest.xml not found. Run `npx cap add android` first.');
  process.exit(1);
}

let xml = fs.readFileSync(MANIFEST, 'utf8');

// ── 1. Add tools namespace to <manifest> tag ─────────────────────────────────
if (!xml.includes('xmlns:tools')) {
  xml = xml.replace(
    /(<manifest[^>]*)(>)/,
    '$1\n    xmlns:tools="http://schemas.android.com/tools"$2'
  );
  console.log('  ✅ Added xmlns:tools namespace');
}

// ── 2. Inject all permissions before </manifest> ─────────────────────────────
const PERMISSIONS = `
    <!-- ── Bluetooth (legacy Android ≤ 11) ── -->
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30"/>
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30"/>

    <!-- ── Bluetooth (Android 12+) ── -->
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation"
        tools:targetSdk="33"/>
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE"/>

    <!-- ── Location (required for BLE on Android < 12) ── -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>

    <!-- ── Network ── -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE"/>
    <uses-permission android:name="android.permission.INTERNET"/>

    <!-- ── Camera (for QR scanner) ── -->
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-feature android:name="android.hardware.camera" android:required="false"/>

    <!-- ── Storage — read/write /sdcard/Breeze/ ── -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="29"/>
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE"/>

    <!-- ── Vibration (transfer notifications) ── -->
    <uses-permission android:name="android.permission.VIBRATE"/>

`;

if (!xml.includes('BLUETOOTH_SCAN')) {
  xml = xml.replace('</manifest>', PERMISSIONS + '</manifest>');
  console.log('  ✅ Injected all permissions');
}

// ── 3. Add requestLegacyExternalStorage + queries to <application> ───────────
if (!xml.includes('requestLegacyExternalStorage')) {
  xml = xml.replace(
    /(<application\b[^>]*)(>)/s,
    (match, open, close) => {
      if (open.includes('android:requestLegacyExternalStorage')) return match;
      return open + '\n        android:requestLegacyExternalStorage="true"' + close;
    }
  );
  console.log('  ✅ Added requestLegacyExternalStorage="true"');
}

// ── 4. Add queries block for BLE on Android 11+ ──────────────────────────────
const QUERIES = `
    <queries>
        <intent>
            <action android:name="android.bluetooth.adapter.action.REQUEST_ENABLE"/>
        </intent>
    </queries>
`;

if (!xml.includes('<queries>') && !xml.includes('queries>')) {
  xml = xml.replace('</manifest>', QUERIES + '\n</manifest>');
  console.log('  ✅ Added BLE queries block');
}

fs.writeFileSync(MANIFEST, xml, 'utf8');
console.log('\n🍃 AndroidManifest.xml patched successfully!\n');

// ── 5. Patch build.gradle minSdkVersion for Capacitor 8 ─────────────────────
const GRADLE = path.join(__dirname, 'android/variables.gradle');
if (fs.existsSync(GRADLE)) {
  let gradle = fs.readFileSync(GRADLE, 'utf8');
  // Cap 8 requires minSdk 24, compileSdk/targetSdk 36
  gradle = gradle.replace(/minSdkVersion\s*=?\s*\d+/, 'minSdkVersion = 24');
  gradle = gradle.replace(/compileSdkVersion\s*=?\s*\d+/, 'compileSdkVersion = 36');
  gradle = gradle.replace(/targetSdkVersion\s*=?\s*\d+/, 'targetSdkVersion = 36');
  fs.writeFileSync(GRADLE, gradle, 'utf8');
  console.log('✅ variables.gradle updated for Capacitor 8 (minSdk=24, target=36)\n');
}
