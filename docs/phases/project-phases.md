# POS-Choice Mobile — Project Phases & Tasks

## Overview

| Phase | Name | Duration | Tasks | Status |
|-------|------|----------|-------|--------|
| M1 | Foundation & Authentication | 2 weeks | 20 | ✅ COMPLETED (2026-06-04) |
| M2 | Core POS Selling Flow | 3 weeks | 24 | ✅ COMPLETED (2026-06-04) |
| M3 | Hold, Return & Shift Management | 2 weeks | 14 | ✅ COMPLETED (2026-06-04) |
| M4 | Polish, Bluetooth Print & Launch | 2 weeks | 12 | 🔲 Pending (hardware testing required) |

**M1–M3 complete. M4 requires physical hardware (Bluetooth printer, EAS build).**

---

## Phase M1 — Foundation & Authentication

**Goal:** App opens, cashier can log in with PIN, shift open/close works.

### Setup Tasks

| ID | Task | Detail |
|----|------|--------|
| MOB-1.01 | Expo project scaffold | `npx create-expo-app POS-mobile-app --template expo-template-blank-typescript` |
| MOB-1.02 | Install Expo Router | `npx expo install expo-router expo-linking expo-constants expo-status-bar` |
| MOB-1.03 | Install dependencies | `npm install zustand axios @react-native-async-storage/async-storage react-native-safe-area-context react-native-screens` |
| MOB-1.04 | Configure app.json | App name "POS-Choice", bundle ID, icon, splash screen |
| MOB-1.05 | eas.json | EAS Build profiles: development, preview, production |
| MOB-1.06 | API constants | `constants/config.ts` with `EXPO_PUBLIC_API_URL` |
| MOB-1.07 | Axios instance | Same singleton pattern as web: auth header, 401 handler |
| MOB-1.08 | Auth store | Zustand: user session (in-memory, no persist) |
| MOB-1.09 | Cart store | Zustand with AsyncStorage persist |

### Auth Tasks

| ID | Task | Detail |
|----|------|--------|
| MOB-1.10 | `PinPad` component | 10-button numpad, PIN dots, backspace, confirm |
| MOB-1.11 | PIN login screen | Company name fetch, PIN input, loading state, error handling |
| MOB-1.12 | Auth guard | Root layout redirects to login if no token |
| MOB-1.13 | Auth service | `cashierLogin(pin, companyId)` — same API as web |
| MOB-1.14 | Company config fetch | `GET /companies/config` — public endpoint, auto-fills companyId |

### Shift Tasks

| ID | Task | Detail |
|----|------|--------|
| MOB-1.15 | Shift open screen | Opening float input, note, [Open Shift] button |
| MOB-1.16 | Shift close screen | Declare cash/transfer/POS, see variance, [Close Shift] |
| MOB-1.17 | Shift service | `getActive()`, `open()`, `close()` API calls |
| MOB-1.18 | Post-login flow | After PIN login: check active shift → shift-open OR POS |
| MOB-1.19 | `ui.store.ts` | Toast queue (react-native native alerts or custom toast) |
| MOB-1.20 | Toast component | RN-compatible toast (bottom of screen, compact) |

**Done when:** Cashier can PIN-login, open shift, and see the (empty) POS screen.

---

## Phase M2 — Core POS Selling Flow

**Goal:** Full sell-to-receipt flow working. This is the core value of the app.

### Product Display

| ID | Task | Detail |
|----|------|--------|
| MOB-2.01 | Products service | `list()` (with storeId, categoryId, search), `scan()` |
| MOB-2.02 | `useProducts` hook | Same cursor-paginated fetch as web; normalize `_id → id` |
| MOB-2.03 | `ProductCard` | 2-column grid card: image placeholder, name, price, stock badge, "pieces" or pack badge |
| MOB-2.04 | `ProductGrid` | FlatList with 2 columns, pull-to-refresh, infinite scroll |
| MOB-2.05 | Category chips | Horizontal ScrollView; `+N More` opens bottom sheet picker |
| MOB-2.06 | Search bar | Text input with camera icon button; debounced 300ms |

### Barcode Scanner

| ID | Task | Detail |
|----|------|--------|
| MOB-2.07 | Camera permission | Request camera permission on first use |
| MOB-2.08 | `BarcodeScanner` overlay | Full-screen camera; targeting frame; cancel button |
| MOB-2.09 | Scan handler | Same logic as web: exact barcode → add; multiple → picker |

### Cart

| ID | Task | Detail |
|----|------|--------|
| MOB-2.10 | `UnitPicker` modal | Bottom sheet: pack vs piece selector, qty input, line total |
| MOB-2.11 | Cart footer | Sticky footer: item count + total + [Charge] button |
| MOB-2.12 | Cart drawer | Slide-up bottom sheet with full cart (BottomSheet from `@gorhom/bottom-sheet`) |
| MOB-2.13 | `CartItem` row | Name, unit label, qty controls `[−][qty][+]`, line total, trash |
| MOB-2.14 | `− button disabled at qty=1` | Same as web — cannot go below 1 with minus |

### Checkout

| ID | Task | Detail |
|----|------|--------|
| MOB-2.15 | `CheckoutModal` | Bottom sheet: Total Due, payment tabs (Cash/Transfer/POS/Split), confirm |
| MOB-2.16 | Cash tab | Amount tendered input, change display |
| MOB-2.17 | Transfer tab | "Confirm received" button, reference input |
| MOB-2.18 | POS/Card tab | Terminal reference input |
| MOB-2.19 | Idempotency key | Generate UUID on checkout open; same pattern as web |
| MOB-2.20 | `transactionsService.create()` | Same API call, same payload |
| MOB-2.21 | Success flow | Brief toast + [Share on WhatsApp] button; cart cleared immediately |
| MOB-2.22 | WhatsApp receipt share | Build text receipt; `Linking.openURL('whatsapp://send?...')` |
| MOB-2.23 | Customer modal | Bottom sheet: search by phone/name, quick-create form |
| MOB-2.24 | Credit payment tab | Only shown if credit customer assigned |

**Done when:** Cashier can scan product, build cart, checkout with cash/transfer, share receipt on WhatsApp.

---

## Phase M3 — Hold, Return & Shift Management

| ID | Task | Detail |
|----|------|--------|
| MOB-3.01 | Hold transaction | [Hold] button saves to cart store + `POST /transactions/hold` |
| MOB-3.02 | Held carts list | Tab or modal showing held carts; tap to resume |
| MOB-3.03 | Auto-hold on resume | Same as web: if cart has items, auto-hold before resuming |
| MOB-3.04 | Delete held cart | Swipe-left gesture on held cart row |
| MOB-3.05 | Me tab | My stats: today's transactions, revenue, shift timer |
| MOB-3.06 | Shift stats fetch | `GET /reports/cashier-performance/me` |
| MOB-3.07 | Shift close flow | Declare amounts, see variance, submit |
| MOB-3.08 | Quotation screen | Simplified: cart in "quote mode"; save as quote; print via WhatsApp |
| MOB-3.09 | Return screen | Search by invoice ID; select items to return; submit |
| MOB-3.10 | Auto-lock screen | After 15min inactivity → PIN re-entry (same as web auto-lock) |
| MOB-3.11 | Exit → auto-hold | App to background / logout auto-holds current cart |
| MOB-3.12 | Cart persistence | Verify AsyncStorage persist/restore on app restart |
| MOB-3.13 | Split payment | Multiple payment methods, same sum-must-equal-total validation |
| MOB-3.14 | Background fetch | Refresh company/shift info when app comes to foreground |

---

## Phase M4 — Polish, Bluetooth Print & Launch

| ID | Task | Detail |
|----|------|--------|
| MOB-4.01 | Bluetooth printer pairing | Device list picker; remember last printer |
| MOB-4.02 | `react-native-bluetooth-escpos-printer` | ESC/POS receipt via Bluetooth thermal printer |
| MOB-4.03 | Print toggle | Same "Auto-print" setting as web |
| MOB-4.04 | App icon | 1024×1024 logo; Expo will generate all sizes |
| MOB-4.05 | Splash screen | Branded loading screen while app initialises |
| MOB-4.06 | Dark theme | Dark background throughout (consistent with web POS) |
| MOB-4.07 | Android APK build | `eas build --platform android --profile preview` |
| MOB-4.08 | iOS TestFlight | `eas build --platform ios` (requires Apple Developer account) |
| MOB-4.09 | Performance audit | Ensure product grid loads < 2s on a budget Android device |
| MOB-4.10 | Network error handling | No internet → retry button + "working offline" message |
| MOB-4.11 | Haptic feedback | Light haptic on product add, success; error vibration |
| MOB-4.12 | Google Play / App Store listing | Store descriptions, screenshots (Expo makes this easy) |

---

## Good-to-Have (Backlog)

| Feature | Effort | Value |
|---------|--------|-------|
| Biometric login (FaceID/fingerprint) | Low | High |
| Push notifications (low stock, new held cart) | Medium | High |
| Offline mode (queue transactions) | High | Very High |
| Product photo upload from camera | Medium | Medium |
| Inventory quick-adjustment (cashier reports damage) | Low | Medium |
| Multi-language (Yoruba, Hausa, Igbo) | High | Medium |

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | React Native + Expo (managed) | Team knows React; Expo SDK covers all native needs |
| Navigation | Expo Router (file-based) | Same mental model as Next.js App Router |
| State | Zustand | Same library as web app — team familiarity |
| HTTP | Axios | Same as web; interceptors for auth/error |
| Camera | `expo-camera` | Expo SDK, well-maintained, barcode support |
| Storage | `@react-native-async-storage/async-storage` | Standard for Expo projects |
| Bottom sheets | `@gorhom/bottom-sheet` | Best-in-class RN bottom sheet |
| Lists | FlatList (built-in RN) | Best performance for long product lists |
| Bluetooth print | `react-native-bluetooth-escpos-printer` | Most maintained ESC/POS RN library |
| Build | EAS Build (Expo) | Cloud builds, no local Xcode/Android Studio needed |
