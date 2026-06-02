# POS-Choice Mobile — EAS Build & Distribution Setup

## Overview

EAS (Expo Application Services) handles cloud builds, app signing, and distribution. This document covers the complete setup for Android and iOS builds.

---

## eas.json Configuration

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "http://192.168.1.100:3003/api/v1"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.poschoice.ng/api/v1"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.poschoice.ng/api/v1"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./play-store-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

---

## Android Build Setup

### Step 1 — Create Keystore

```bash
# Generate a new keystore (keep this file SAFE — losing it = cannot update app)
keytool -genkey -v \
  -keystore pos-choice-release.keystore \
  -alias pos-choice \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Prompts:
# Keystore password:  [choose strong password]
# Key password:       [same or different]
# First/Last name:    Push-It
# Organization:       Push-It Ltd
# City:               Lagos
# State:              Lagos
# Country code:       NG
```

### Step 2 — Store Keystore in EAS Secrets

```bash
eas credentials
# → Android → Select keystore → Upload existing keystore
# OR: EAS will auto-generate and store one for you (recommended for new projects)
```

### Step 3 — Build APK (for direct distribution)

```bash
eas build --platform android --profile preview
# Output: .apk file
# Share link for direct download (valid 30 days)
```

### Step 4 — Build AAB (for Google Play)

```bash
eas build --platform android --profile production
# Output: .aab file (Android App Bundle)
# Required for Google Play Store
```

### Android Distribution Strategy (Nigeria-specific)

| Channel | Format | When to Use |
|---------|--------|-------------|
| Direct APK link | .apk | Beta testing; stores without Play Store access |
| Google Play Internal | .aab | Testing with select stores |
| Google Play Production | .aab | Public launch |

> **Nigerian context:** Many Android devices in Nigeria have slow/no Play Store access. The Preview APK shared via WhatsApp or direct link is the fastest way to get the app to pilot stores.

---

## iOS Build Setup

### Requirements

- Apple Developer Program membership ($99/year)
- Mac with Xcode installed (or use EAS cloud build — no Mac needed)
- App Store Connect app created

### Step 1 — Register App on App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → `+` → New App
3. Fill in: POS-Choice, bundle ID `ng.poschoice.app`, SKU `pos-choice`

### Step 2 — Build for iOS

```bash
eas build --platform ios --profile production
# EAS handles certificates and provisioning profiles automatically
```

### Step 3 — Submit to TestFlight

```bash
eas submit --platform ios --profile production
# OR manually upload .ipa via Transporter app or Xcode
```

---

## Over-the-Air (OTA) Updates

OTA updates push JavaScript/asset changes without requiring an app store submission. **Use for:** bug fixes, UI text changes, new features that don't use new native APIs.

**Do NOT use for:** changes to `app.json`, new native modules, major version bumps.

```bash
# Install expo-updates
npx expo install expo-updates

# app.json config
{
  "expo": {
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/YOUR-PROJECT-ID"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

### OTA Deployment

```bash
# Deploy to production channel
eas update --channel production --message "Fix: cart item qty button"

# Deploy to preview channel (stores on beta)
eas update --channel preview --message "New: loyalty chip in cart"
```

### OTA Compatibility Matrix

| App Store Version | Can receive OTA? | Notes |
|-----------------|-----------------|-------|
| 1.0.0 (SDK 52) | ✅ Any 1.x OTA | Same SDK version |
| 1.0.0 (SDK 52) | ❌ 2.0.0 OTA | SDK bump needs new build |
| 1.1.0 (SDK 52) | ✅ | Minor version same SDK |

**Rule:** OTA only works between builds with the same `runtimeVersion` (same SDK).

### Rollback Strategy

```bash
# List recent updates
eas update:list

# Roll back to a specific update ID
eas update:republish --group UPDATE_GROUP_ID --channel production
```

---

## Play Store App Listing Requirements

### Screenshots Required

| Screen type | Size | Count |
|-------------|------|-------|
| Phone screenshots | 1080×1920 px | 2–8 |
| 7-inch tablet | 1200×1920 px | Optional |
| 10-inch tablet | 1600×2560 px | Optional |

**Suggested screenshots:**
1. PIN login screen
2. Product grid (showing categories)
3. Cart with items
4. Checkout modal
5. Receipt/success screen

### App Store Description Template

```
POS-Choice — Point of Sale for Nigerian Retail

Make sales from your smartphone. POS-Choice is the fastest,
most reliable cashier app for supermarkets, mini-marts, and
retail stores across Nigeria.

KEY FEATURES:
✓ PIN login — secure cashier access
✓ Barcode scanning — camera-based, instant
✓ All payment methods: Cash, Bank Transfer, POS/Card
✓ Thermal receipt printing (Bluetooth)
✓ Share receipts via WhatsApp
✓ Hold & resume transactions
✓ Real-time stock updates

REQUIREMENTS:
• POS-Choice account (₦49,999/month — start free)
• Internet connection (or offline queue mode)

Support: hello@poschoice.ng
Website: poschoice.ng
```

---

## Version Increment Strategy

| Version bump | When | Command |
|-------------|------|---------|
| Patch (1.0.x) | Bug fixes only | OTA update preferred |
| Minor (1.x.0) | New features | New store build |
| Major (x.0.0) | Breaking changes, new SDK | New store build + migration guide |

```json
// app.json — increment before each store build
{
  "expo": {
    "version": "1.0.1",
    "android": { "versionCode": 2 },
    "ios": { "buildNumber": "2" }
  }
}
```

**Rule:** Always increment `versionCode` (Android) and `buildNumber` (iOS) for every store submission. Never reuse the same build number.
