# POS-Choice Mobile — Build Status

> Last updated: 2026-06-02

## Phase Status

| Phase | Name | Status | Started |
|-------|------|--------|---------|
| M1 | Foundation & Authentication | 🔲 Not started | — |
| M2 | Core POS Selling Flow | 🔲 Pending | — |
| M3 | Hold, Return & Shift Management | 🔲 Pending | — |
| M4 | Polish, Bluetooth Print & Launch | 🔲 Pending | — |

## Project Not Started Yet

The `POS-mobile-app` project is fully documented and ready to build. The backend API is already complete (Phases 1 & 2 done) and supports all mobile cashier features.

### Prerequisites Before Building
- [ ] Install Expo CLI: `npm install -g expo`
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Sign up at expo.dev (free)
- [ ] Have a physical Android device for testing (Expo Go app)
- [ ] Apple Developer account ($99/year) if building for iOS

### Start Command
```bash
cd POS-mobile-app
npx create-expo-app . --template expo-template-blank-typescript
npx expo install expo-router expo-camera @react-native-async-storage/async-storage
npx expo start
```

### Dependencies for Phase M1

```bash
npm install zustand axios @react-native-async-storage/async-storage
npm install react-native-safe-area-context react-native-screens
npx expo install expo-router expo-linking expo-constants expo-status-bar
npx expo install expo-camera
```

### Backend Dependency

The mobile app connects to `POS-backend-v2`. Ensure the backend is running and accessible from the device (use LAN IP, not localhost).
