# POS-Choice Mobile — Cashier App (iOS & Android)

> A focused React Native (Expo) mobile app for cashiers who need to make sales from a smartphone. Same backend as POS-frontend-v2. Only the features a cashier needs — nothing else.

**Backend:** [POS-backend-v2](../POS-backend-v2) · **Web POS:** [POS-frontend-v2](../POS-frontend-v2)

---

## Why a Mobile App?

Many small and medium stores in Nigeria **cannot afford a dedicated computer** for the cashier. A smartphone is already in their pocket. POS-Choice Mobile lets them:

- Make full sales from an Android or iPhone
- Scan barcodes using the phone's camera
- Print to a Bluetooth thermal printer OR share receipt via WhatsApp
- Use the same backend as the web/desktop POS — stock updates in real-time

---

## Technology Decision: React Native + Expo

**Why React Native over Ionic:**

| Factor | React Native (Expo) | Ionic |
|--------|---------------------|-------|
| Performance | Native rendering (no WebView) | WebView-based (slower) |
| Camera/barcode | `expo-camera` — native, fast | Plugin, slower scan |
| UI feel | Truly native on iOS & Android | Web-in-a-frame |
| Learning curve | React + RN-specific APIs | React + Ionic components |
| Thermal printer | `react-native-bluetooth-escpos-printer` | Limited plugins |
| Hot reload dev | Expo Go app — instant | Ionic serve |
| OTA updates | Expo Updates — push without app store | Manual |
| Team knowledge | Same React as web app ✓ | Similar |

**Recommendation: React Native with Expo (managed workflow)**

The team already knows React and TypeScript. The Expo SDK provides camera, notifications, and Bluetooth access without native code. OTA updates mean we can ship improvements without waiting for App Store review.

---

## Feature Scope — Cashier Only

The mobile app is **cashier-scoped only**. No admin features. No reports. No product management. Just selling.

| Feature | Included | Notes |
|---------|---------|-------|
| PIN login | ✅ | Same PIN as web app |
| Product search (by name or barcode camera scan) | ✅ | Live camera scan + text search |
| Product grid (filtered by category) | ✅ | |
| Pack/piece selling unit picker | ✅ | |
| Cart management (add, qty, remove) | ✅ | |
| All payment methods (Cash/Transfer/POS/Credit/Split) | ✅ | |
| Transaction charge rules (auto-applied) | ✅ | |
| Customer assignment + credit sales | ✅ | |
| Receipt — WhatsApp share | ✅ | `wa.me` link |
| Receipt — Bluetooth thermal print | ✅ | Phase 2 |
| Hold / resume transactions | ✅ | |
| Shift open / close | ✅ | |
| My stats today (transactions, revenue) | ✅ | |
| Admin reports | ❌ | Admin uses web app |
| Product management | ❌ | Admin uses web app |
| User management | ❌ | Admin uses web app |

---

## Getting Started

### Prerequisites

- Node.js v25+
- Expo CLI: `npm install -g expo`
- Expo Go app on your phone (iOS/Android) — for development

### Setup

```bash
cd POS-mobile-app
npm install
npx expo start

# Scan the QR code in Expo Go to run on your device
```

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/research/README.md`](docs/research/README.md) | Why mobile, target users, feature decisions |
| [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md) | Project structure, navigation, state management |
| [`docs/features/cashier-features.md`](docs/features/cashier-features.md) | Full feature spec for each screen |
| [`docs/phases/project-phases.md`](docs/phases/project-phases.md) | Build phases and task breakdown |
| [`docs/STATUS.md`](docs/STATUS.md) | Current build status |

---

## Related Projects

| Project | Description |
|---------|-------------|
| [POS-backend-v2](../POS-backend-v2) | The backend this app connects to |
| [POS-frontend-v2](../POS-frontend-v2) | Web version (admin + cashier) |
| [POS-desktop-app](../POS-desktop-app) | Electron desktop app |
| [pos-front-page](../pos-front-page) | Marketing website |
