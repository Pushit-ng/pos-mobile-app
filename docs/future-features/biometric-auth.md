# POS-Choice Mobile — Biometric Authentication (Future Feature)

## Overview

Biometric authentication lets cashiers authenticate with fingerprint or Face ID instead of entering their 4-digit PIN each time they unlock the app (auto-lock after 15 minutes of inactivity).

This is a **Phase M5 feature** — not in the initial launch. Initial launch uses PIN-only.

---

## Use Case

**Auto-lock unlock only.** Biometrics replaces PIN on the re-authentication screen that appears after 15 minutes of inactivity. The initial shift login still requires PIN (to ensure the correct cashier is active).

```
Scenario:
  1. Esther logs in with PIN → opens shift
  2. Esther stops using the app for 15 minutes
  3. Screen goes to "Locked — tap to unlock"
  4. [Touch fingerprint sensor] OR [Scan face]
  5. App unlocks without PIN re-entry
```

---

## Library Choice

Use **`expo-local-authentication`** (part of Expo SDK, MIT):

```bash
npx expo install expo-local-authentication
```

**Why not alternatives:**
- `react-native-biometrics`: Extra dependency, not needed when Expo SDK has it
- `react-native-fingerprint-scanner`: Archived, not maintained

---

## Integration Point

### Check Availability

```ts
import * as LocalAuthentication from 'expo-local-authentication'

async function checkBiometricSupport(): Promise<BiometricInfo> {
  const compatible = await LocalAuthentication.hasHardwareAsync()
  const enrolled   = await LocalAuthentication.isEnrolledAsync()
  const types      = await LocalAuthentication.supportedAuthenticationTypesAsync()

  return {
    available: compatible && enrolled,
    types,  // e.g. [FINGERPRINT, FACIAL_RECOGNITION, IRIS]
  }
}
```

### Authenticate

```ts
async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage:     'Unlock POS-Choice',
    cancelLabel:       'Use PIN instead',
    fallbackLabel:     'Use PIN',
    disableDeviceFallback: false,  // allow device PIN as fallback
  })
  return result.success
}
```

### Lock Screen Flow

```ts
// In auto-lock screen component
async function handleUnlock() {
  const biometricEnabled = await getBiometricSetting()  // from AsyncStorage

  if (biometricEnabled) {
    const ok = await authenticateWithBiometric()
    if (ok) { unlockApp(); return }
    // If biometric fails, fall through to PIN
  }

  setShowPinEntry(true)  // show PIN pad
}
```

---

## Settings Screen

Under "Settings → Security":

```
┌──────────────────────────────────────┐
│  Security Settings                   │
│  ────────────────────────────────   │
│  Auto-lock after      [15 minutes ▾] │
│                                      │
│  Unlock with           [PIN only  ▾] │
│  Fingerprint / Face ID               │
│                                      │
│  [Set up biometric unlock]           │
│  (shows if biometric available       │
│   but not yet configured)            │
└──────────────────────────────────────┘
```

Biometric setting stored in AsyncStorage per-cashier: `biometric_enabled_<cashierId>: 'true' | 'false'`

### Setup Flow

1. User taps "Set up biometric unlock"
2. PIN confirmation screen: "Enter your PIN to enable biometrics"
3. PIN correct → `LocalAuthentication.authenticateAsync()` to verify biometric works
4. Success → store `biometric_enabled_<cashierId> = true`

---

## Fallback Strategy

| Scenario | Fallback |
|---------|---------|
| Biometric fails (dirty sensor, angle) | Show PIN pad |
| Biometric cancelled by user | Show PIN pad |
| 3 failed biometric attempts | Force PIN (device OS handles this automatically) |
| New cashier on same device | Show PIN (biometric is per-cashier, not per-device) |
| Device has no biometric hardware | Always use PIN; no biometric option in settings |
| Biometric not enrolled | Show "Set up fingerprint in device settings" |

---

## Permissions (app.json)

iOS:
```json
"infoPlist": {
  "NSFaceIDUsageDescription": "Use Face ID to unlock POS-Choice after inactivity"
}
```

Android: No explicit permission needed for fingerprint — handled by OS biometric prompt.

---

## NDPR Note

Biometric data is processed **on-device only** by the OS. POS-Choice never sees, stores, or transmits biometric data. Only the `boolean` result (`success: true/false`) is used by the app.

This means NDPR consent is not required for biometric unlock — the data never leaves the device.
