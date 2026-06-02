# POS-Choice Mobile — app.json & package.json Configuration

## Complete app.json

```json
{
  "expo": {
    "name": "POS-Choice",
    "slug": "pos-choice",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#020617"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "ng.poschoice.cashier",
      "buildNumber": "1",
      "deploymentTarget": "14.0",
      "infoPlist": {
        "NSCameraUsageDescription": "Used to scan product barcodes at checkout",
        "NSBluetoothAlwaysUsageDescription": "Used to connect to Bluetooth thermal receipt printer",
        "NSBluetoothPeripheralUsageDescription": "Used to connect to Bluetooth thermal receipt printer"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#020617"
      },
      "package": "ng.poschoice.cashier",
      "versionCode": 1,
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      "softwareKeyboardLayoutMode": "pan"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow POS-Choice to use camera for barcode scanning"
        }
      ],
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow POS-Choice to use Face ID for quick login"
        }
      ]
    ],
    "scheme": "poschoice",
    "deepLinking": {
      "schemes": ["poschoice"],
      "prefixes": ["https://poschoice.ng", "poschoice://"]
    },
    "extra": {
      "eas": {
        "projectId": "YOUR-EXPO-PROJECT-ID"
      }
    },
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 3000,
      "url": "https://u.expo.dev/YOUR-PROJECT-ID"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

---

## Complete package.json (with pinned versions)

```json
{
  "name": "pos-choice-mobile",
  "version": "1.0.0",
  "description": "POS-Choice cashier mobile app for iOS and Android",
  "main": "expo-router/entry",
  "scripts": {
    "start":   "expo start",
    "android": "expo start --android",
    "ios":     "expo start --ios",
    "build:android-preview":    "eas build --platform android --profile preview",
    "build:android-production": "eas build --platform android --profile production",
    "build:ios-production":     "eas build --platform ios --profile production",
    "update:preview":    "eas update --channel preview",
    "update:production": "eas update --channel production",
    "lint":    "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "expo":                                "~52.0.0",
    "expo-router":                         "~4.0.0",
    "expo-camera":                         "~15.0.0",
    "expo-constants":                      "~17.0.0",
    "expo-linking":                        "~7.0.0",
    "expo-local-authentication":           "~14.0.0",
    "expo-status-bar":                     "~2.0.0",
    "expo-updates":                        "~0.26.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "react":                               "18.3.2",
    "react-native":                        "0.76.0",
    "react-native-safe-area-context":      "4.11.0",
    "react-native-screens":                "~4.0.0",
    "@gorhom/bottom-sheet":               "^5.0.0",
    "axios":                               "^1.7.0",
    "zustand":                             "^5.0.0",
    "react-hook-form":                     "^7.53.0",
    "zod":                                 "^3.23.0"
  },
  "devDependencies": {
    "@babel/core":                         "^7.24.0",
    "@types/react":                        "~18.3.0",
    "@types/react-native":                 "~0.73.0",
    "typescript":                          "^5.3.0",
    "eslint":                              "^9.0.0",
    "@typescript-eslint/parser":           "^8.0.0"
  },
  "private": true
}
```

---

## Deep Linking Configuration

The app supports deep linking for receipt sharing and future notifications.

| URL | Opens |
|-----|-------|
| `poschoice://pos` | Main POS screen |
| `poschoice://held` | Held transactions |
| `poschoice://receipt/{invoiceId}` | Receipt view for reprint |
| `https://poschoice.ng/receipt/{invoiceId}` | Web fallback |

### Testing Deep Links

```bash
# Android
adb shell am start -a android.intent.action.VIEW -d "poschoice://receipt/INV-A1A5-000001" ng.poschoice.cashier

# iOS Simulator
xcrun simctl openurl booted "poschoice://receipt/INV-A1A5-000001"
```

---

## Required Assets

| File | Size | Purpose |
|------|------|---------|
| `assets/icon.png` | 1024×1024 | App icon (all platforms) |
| `assets/adaptive-icon.png` | 1024×1024 | Android adaptive icon |
| `assets/splash.png` | 1284×2778 | Splash screen |
| `assets/favicon.png` | 48×48 | Web favicon |

**Design spec:**
- Background: `#020617` (dark, matches app theme)
- Icon: Company logo / POS-Choice "P" monogram
- Splash: Logo centred on dark background, no animation text

---

## Target Device Specs

### Minimum Requirements
- Android 8.0 (API level 26) — covers ~95% of Nigerian Android market
- iOS 14.0 — covers ~90% of iPhones in use

### Tested Devices (Required Before Launch)
- [ ] Samsung Galaxy A51 (budget, very common in Nigeria)
- [ ] Tecno Spark 10 (ultra-budget Nigerian market)
- [ ] iPhone 11 (most common iOS in Nigeria)
- [ ] Samsung Galaxy S21 (flagship for comparison)
- [ ] Generic Infinix/Itel tablet (7-inch, ₦15,000 range)

### Performance Targets (Budget Android)
| Metric | Target |
|--------|--------|
| App cold start | < 3s on Samsung Galaxy A51 |
| Product list render (50 items) | < 500ms |
| Barcode scan latency | < 200ms |
| Cart add animation | < 100ms |
| Transaction POST + success | < 3s (good network) |
