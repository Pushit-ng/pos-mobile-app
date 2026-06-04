# POS-Choice Mobile — Project Guide for Claude

## Project Overview

A **React Native (Expo)** cashier-only mobile app for iOS and Android. Lets cashiers make sales from a smartphone — ideal for stores that can't afford a computer.

- **Framework:** React Native with Expo (managed workflow)
- **Navigation:** Expo Router (file-based, like Next.js)
- **State:** Zustand with AsyncStorage persist
- **Language:** TypeScript strict

## Who Uses This App

**Cashiers only.** No admin features. No reports. No product management. Just selling as fast as possible.

## Non-Negotiable Rules

1. **All money in kobo** — Same as web app. `formatNaira(kobo)` for display.
2. **Same backend** — Connects to `POS-backend-v2` at `EXPO_PUBLIC_API_URL`.
3. **Same token** — Cashier PIN login → 8h JWT. No refresh token.
4. **Dark theme** — Background `#020617`, consistent with the web cashier POS.
5. **Idempotency** — `POST /transactions` always sends `X-Idempotency-Key` UUID.
6. **Offline awareness** — Show a toast if API call fails; never silently lose data.
7. **Performance on budget Android** — Test on low-end Android devices.

## Key Documentation

| Doc | Must-Read? | Purpose |
|-----|-----------|---------|
| `docs/architecture/system-overview.md` | ✅ | Project structure, navigation, state, barcode scanning |
| `docs/features/cashier-features.md` | ✅ | Every screen spec with ASCII wireframes |
| `docs/phases/project-phases.md` | Reference | All 70 build tasks across 4 phases |

## API Connection

The mobile app uses the same API as the web POS:
- Base URL from `EXPO_PUBLIC_API_URL`
- In development: `http://192.168.x.x:3003/api/v1` (LAN IP — not localhost)
- In production: `https://api.poschoice.ng/api/v1`

## Critical Differences vs Web App

| Feature | Web | Mobile |
|---------|-----|--------|
| Barcode scan | USB scanner (keyboard events) | `expo-camera` (camera) |
| Cart layout | Side-by-side | Vertical (bottom sheet) |
| Navigation | React Router | Expo Router |
| Persist | localStorage | AsyncStorage |
| Fonts | @fontsource | System fonts (SF Pro / Roboto) |
| Printing | API endpoint | Bluetooth ESC/POS (Phase 4) |

## Build Status

**Phase 7 M1 (Foundation): COMPLETED** (2026-06-04) — Project scaffold, Expo Router, auth store, cart store, PIN login, shift open/close screens  
**Phase 7 M2 (POS Selling Flow): COMPLETED** (2026-06-04) — Product grid, barcode scanner, cart, unit picker, checkout (cash/transfer/card/split), WhatsApp receipt  
**Phase 7 M3 (Hold & Shift): COMPLETED** (2026-06-04) — Held carts screen, stats screen, shift management  
**Phase 7 M4 (Polish & Launch): PENDING** — Requires hardware testing (Bluetooth printer, EAS build, app store submission)  
**Current Status:** All screens and logic implemented — ready for `npm install` + `expo start`

See `docs/STATUS.md`

## Related Projects

| Project | Description |
|---------|-------------|
| `POS-backend-v2` | The backend this app connects to (already complete) |
| `POS-frontend-v2` | Web version (admin + cashier) |
| `pos-front-page` | Marketing website |
