# POS-Choice Mobile — Architecture Overview

## Project Structure

```
POS-mobile-app/
├── app/                            # Expo Router (file-based routing)
│   ├── _layout.tsx                 # Root layout: auth provider, toast
│   ├── index.tsx                   # Redirect to /auth/pin or /pos
│   ├── auth/
│   │   └── pin.tsx                 # PIN login screen
│   ├── pos/
│   │   ├── _layout.tsx             # POS tab layout (bottom tabs)
│   │   ├── index.tsx               # Main POS screen (scan + cart)
│   │   ├── quotation.tsx           # Quotation screen
│   │   └── return.tsx              # Sales return
│   └── shift/
│       ├── open.tsx                # Open shift
│       └── close.tsx               # Close shift / reconcile
│
├── components/
│   ├── cashier/
│   │   ├── ProductGrid.tsx         # Scrollable product grid
│   │   ├── ProductCard.tsx         # Single product card (tap to add)
│   │   ├── CartPanel.tsx           # Cart items list + totals
│   │   ├── CartItem.tsx            # Individual cart item row
│   │   ├── UnitPicker.tsx          # Pack/piece modal
│   │   ├── CheckoutModal.tsx       # Payment method + confirm
│   │   ├── CustomerModal.tsx       # Customer search + quick create
│   │   ├── BarcodeScanner.tsx      # Camera barcode scan overlay
│   │   ├── CategoryChips.tsx       # Category filter row
│   │   └── ReceiptSheet.tsx        # Bottom sheet with receipt + share
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       ├── PinPad.tsx              # Numeric PIN keypad
│       ├── Toast.tsx               # Notification toasts
│       └── Spinner.tsx
│
├── store/
│   ├── auth.store.ts               # Zustand: user session, token
│   ├── cart.store.ts               # Zustand: cart items, held carts
│   └── ui.store.ts                 # Zustand: toasts
│
├── services/
│   ├── auth.service.ts
│   ├── products.service.ts
│   ├── transactions.service.ts
│   ├── customers.service.ts
│   └── shifts.service.ts
│
├── hooks/
│   ├── useProducts.ts              # Product list with pagination
│   ├── useCamera.ts                # Barcode scan hook
│   └── useCart.ts                  # Cart-specific helpers
│
├── utils/
│   ├── format-currency.ts          # formatNaira(kobo)
│   ├── api-paths.ts                # All API endpoint paths
│   └── platform.ts                 # isAndroid(), isIOS()
│
├── constants/
│   └── config.ts                   # API_BASE_URL, app version
│
├── app.json                        # Expo config
├── eas.json                        # EAS Build config
├── package.json
└── CLAUDE.md
```

## Navigation Architecture

```
Root Navigator
├── Auth Stack
│   └── PIN Login Screen
│
└── Main Stack (requires CASHIER auth)
    ├── Shift Open Screen (if no active shift)
    │
    └── Bottom Tabs
        ├── POS Tab (main selling screen)
        ├── Held Tab (held transactions)
        └── Me Tab (my stats + shift close)
```

## State Management

Same Zustand pattern as the web app:
- `auth.store.ts` — user session (in-memory, no persist; cashier re-logs after app close)
- `cart.store.ts` — cart items (persisted via AsyncStorage for crash recovery)
- `ui.store.ts` — toasts

```typescript
// AsyncStorage adapter for React Native persist
import AsyncStorage from '@react-native-async-storage/async-storage'

persist(cartStore, {
  name: 'pos-cart',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (s) => ({ items: s.items, customer: s.customer, heldCarts: s.heldCarts }),
})
```

## API Integration

The mobile app connects to the **same `POS-backend-v2` API** as the web app. No separate backend needed.

```typescript
// constants/config.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.poschoice.ng/api/v1'
```

In development, point to the local NestJS server:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3003/api/v1
```
(Use LAN IP — `localhost` doesn't work on a physical device)

## Authentication

Same JWT flow as web:
- Cashier PIN → `POST /auth/cashier/pincode` → 8h access token
- Stored in memory (Zustand) — user must PIN again after app restart
- Token included in every API call via Axios interceptor

## Barcode Scanning

```typescript
// hooks/useCamera.ts
import { useCameraPermissions, CameraView } from 'expo-camera'

export function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions()
  
  return (
    <CameraView
      style={StyleSheet.absoluteFillObject}
      barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'qr'] }}
      onBarcodeScanned={({ data }) => onScan(data)}
    />
  )
}
```

## Thermal Printing (Phase 2)

Bluetooth ESC/POS printing:

```bash
npm install react-native-bluetooth-escpos-printer
```

```typescript
import BluetoothEscposPrinter from 'react-native-bluetooth-escpos-printer'

async function printReceipt(receiptLines: string[]) {
  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER)
  await BluetoothEscposPrinter.printText('ALHERI STORES\n', {})
  // ... full receipt
  await BluetoothEscposPrinter.printText('\n\n\n', {})
  await BluetoothEscposPrinter.cutPaper()
}
```

Alternatively: share receipt as text via WhatsApp (Phase 1 fallback, free, works always).

## Platform Requirements

| Feature | Android | iOS |
|---------|---------|-----|
| Minimum version | Android 8.0 (API 26) | iOS 14+ |
| Camera (barcode) | ✅ | ✅ |
| Bluetooth printer | ✅ | ✅ (limited) |
| AsyncStorage | ✅ | ✅ |
| WhatsApp share | ✅ | ✅ |
| Push notifications | Phase 3 | Phase 3 |

## Distribution

| Channel | Platform | When |
|---------|---------|------|
| Expo Go (QR) | iOS + Android | Development |
| APK direct install | Android | Beta / stores without app store access |
| Google Play Store | Android | Public launch |
| Apple App Store | iOS | Public launch (requires $99/year Developer account) |

> **Nigerian market note:** Android dominates in Nigeria (85%+ market share). Prioritise Android APK distribution first — many store owners can install APKs directly without the Play Store.

## Environment Variables

```env
# .env (Expo reads variables prefixed EXPO_PUBLIC_)
EXPO_PUBLIC_API_URL=https://api.poschoice.ng/api/v1
EXPO_PUBLIC_WHATSAPP_NUMBER=2348XXXXXXXXX
EXPO_PUBLIC_APP_VERSION=1.0.0
```
