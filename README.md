# 🍃 Breeze — File Sharing App (Android APK)

A modern, privacy-first P2P file sharing Android app built with Capacitor + WebRTC.

[![Build APK](https://github.com/YOUR_USERNAME/breeze-share/actions/workflows/build-apk.yml/badge.svg)](https://github.com/YOUR_USERNAME/breeze-share/actions/workflows/build-apk.yml)

---

## 🚀 Getting the APK

### Option A — Download from GitHub Actions (easiest)
1. Go to **Actions** tab in your repo
2. Click the latest **Build Breeze APK** run
3. Scroll to **Artifacts** → download `breeze-apk-*`
4. Enable *Install unknown apps* on Android → install

### Option B — Tag a release
```bash
git tag v1.0.0
git push origin v1.0.0
```
GitHub Actions will build and attach the APK to a GitHub Release automatically.

---

## 🛠️ Local Build

### Prerequisites
- Node.js 20+
- Android Studio + SDK (API 34)
- Java 17

```bash
npm install
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
# APK → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ⚙️ CI/CD Pipeline

| Job | What it does | Trigger |
|-----|-------------|---------|
| **test** | Runs pre-build sanity checks | Every push/PR |
| **build-apk** | Builds debug APK via Gradle | After tests pass |
| **release** | Attaches APK to GitHub Release | On `v*` tags only |

---

## 📁 Project Structure

```
breeze-share/
├── www/
│   └── index.html          ← Web app (served inside WebView)
├── capacitor.config.json   ← Capacitor / Android config
├── package.json
├── test.js
└── .github/
    └── workflows/
        └── build-apk.yml   ← Full CI/CD pipeline
```

---

## 📄 License

MIT
