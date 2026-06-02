# POS-Choice Mobile — Cashier Feature Specs

## Screen 1: PIN Login

**Route:** `/auth/pin`

**Design:**
- Dark background (#020617)
- Store logo (or company initial if no logo)
- Company name fetched from `GET /companies/config`
- 6 PIN dots + numpad (1–9, 0, backspace)
- Auto-submit when PIN reaches configured length (4–6 digits)
- Server-side lockout after 5 failures (same as web)

**Behaviour:**
- Same `POST /auth/cashier/pincode` API as web
- On success → check active shift → navigate to shift-open or POS
- Biometric login (FaceID/fingerprint) in Phase 3

```
┌──────────────────────────────────┐
│                                  │
│         [Company Logo]           │
│      Alheri Stores Ltd           │
│                                  │
│      Enter your PIN              │
│                                  │
│      ● ● ● ●  (dots)             │
│                                  │
│    [ 1 ]  [ 2 ]  [ 3 ]          │
│    [ 4 ]  [ 5 ]  [ 6 ]          │
│    [ 7 ]  [ 8 ]  [ 9 ]          │
│    [ ⌫ ]  [ 0 ]  [ ✓ ]          │
│                                  │
└──────────────────────────────────┘
```

---

## Screen 2: Shift Open

**Route:** `/shift/open`

Shown if cashier has no active shift. Same as web version:
- Opening float input (₦ amount)
- Note field (optional)
- [Open Shift] → `POST /shifts` → navigate to POS

---

## Screen 3: Main POS Screen

**Route:** `/pos`

**Layout:** Vertical stack (no side-by-side like web — mobile is single column).

```
┌──────────────────────────────────┐  ← Header
│ [≡]  Alheri Stores   Esther  [F] │  ← Logo, cashier, held badge
├──────────────────────────────────┤
│ [🔍 Search or scan barcode...]   │  ← Search bar with camera icon
├──────────────────────────────────┤
│ [All] [Beverages] [Electronics]→ │  ← Category chips (scrollable)
├──────────────────────────────────┤
│                                  │  ← Product grid (2 cols)
│  ┌───────┐  ┌───────┐           │
│  │       │  │       │           │
│  │ Milo  │  │ Coca  │           │
│  │₦2,200 │  │ ₦300  │           │
│  │23 stk │  │48 stk │           │
│  └───────┘  └───────┘           │
│                                  │
│  ┌───────┐  ┌───────┐           │
│  │...    │  │...    │           │
│  └───────┘  └───────┘           │
│                                  │
├──────────────────────────────────┤  ← Cart summary (sticky footer)
│ 3 items · ₦4,850    [CHARGE ▶]  │
└──────────────────────────────────┘
```

**Tapping the Cart Footer** expands to a full-screen cart drawer from the bottom.

**Camera Scan:** Tapping the camera icon in the search bar opens a full-screen barcode scanner overlay.

---

## Screen 4: Barcode Scanner Overlay

Full-screen camera view with:
- Targeting square in the centre
- Cancel button (bottom)
- Flash toggle (top right)
- Auto-closes and adds product when barcode detected

```
┌──────────────────────────────────┐
│                              [⚡] │
│                                  │
│                                  │
│         ┌──────────────┐        │
│         │              │        │  ← targeting frame
│         │   SCAN HERE  │        │
│         │              │        │
│         └──────────────┘        │
│                                  │
│                                  │
│         [ Cancel ]               │
└──────────────────────────────────┘
```

---

## Screen 5: Cart Drawer (Bottom Sheet)

Slides up from bottom on cart footer tap.

**Content:**
- Customer chip (`[+ Add Customer]` if none)
- Scrollable cart items list
- Each item: name, unit (piece × 2), line total, `[−][qty][+]`, trash
- Subtotal, discount, VAT, total
- [Hold Cart] [Charge ▶]

---

## Screen 6: Unit Picker Modal

Bottom sheet shown when tapping a product with `packDefinition`:

```
┌──────────────────────────────────┐
│  Sachet Water                    │
│                                  │
│  ┌─────────────┐ ┌─────────────┐│
│  │  📦 Bag     │ │  💧 Piece   ││
│  │  20 pcs     │ │  ₦30 each  ││
│  │  ₦600       │ │            ││
│  └─────────────┘ └─────────────┘│
│                                  │
│  Qty:  [ − ] [ 1 ] [ + ]        │
│  Total: ₦600                    │
│                                  │
│  [Cancel]    [Add to Cart]       │
└──────────────────────────────────┘
```

---

## Screen 7: Checkout Modal

Bottom sheet with payment method tabs:

```
┌──────────────────────────────────┐
│  TOTAL DUE                       │
│  ₦4,850                         │  ← large, emerald
├──────────────────────────────────┤
│  [Cash] [Transfer] [POS] [Split] │  ← tabs
├──────────────────────────────────┤
│  Cash tab:                       │
│  Amount Tendered: [₦          ] │
│  Change: ₦0                     │
├──────────────────────────────────┤
│                                  │
│     [CONFIRM PAYMENT ✓]          │
│                                  │
└──────────────────────────────────┘
```

On confirm:
1. Call `POST /transactions` with `X-Idempotency-Key`
2. Show brief success toast with invoice number
3. Option: "Share Receipt on WhatsApp" — opens WhatsApp
4. Cart cleared → ready for next customer

---

## Screen 8: Customer Search Modal

Bottom sheet with search input:
- Search by phone number or name
- Shows name, type badge, credit balance
- Inline quick-create form (name + phone + type)

---

## Screen 9: Held Transactions

**Route:** `/pos/held` (or a tab)

List of held carts:
- Label, item count, total, time held
- Tap to resume (auto-holds current cart if not empty)
- Swipe left to delete

---

## Screen 10: My Stats (Me Tab)

Simple stats for the current shift:
- Transactions made today: X
- Revenue today: ₦X
- Average transaction value: ₦X
- Open shift timer (hh:mm)
- [Close Shift] button → navigates to shift close screen

---

## Screen 11: Shift Close

Same as web version:
- Expected amounts (from API)
- Declare: cash count, transfer total, POS total
- Variance display
- Note (required if variance > ₦1,000)
- [Close Shift] → success → redirect to login

---

## Gestures & Mobile UX

| Gesture | Action |
|---------|--------|
| Swipe up on cart footer | Expand cart drawer |
| Swipe down on drawer | Collapse drawer |
| Swipe left on cart item | Delete item |
| Swipe left on held cart | Delete held cart |
| Pull-to-refresh on product grid | Refresh products |
| Long-press product card | Show product details (stock, barcode, pack info) |
| Pinch on barcode scanner | Zoom in/out |

---

## Receipt Sharing (WhatsApp)

After successful transaction, the app builds a text receipt:
```
*ALHERI STORES LTD*
12 Ahmadu Bello Way, Kaduna
Tel: +234 803 000 0001

*RECEIPT - INV-A1A5-000042*
Date: 02/06/2026 14:23

Sachet Water (bag) x2  ₦1,200
Coca-Cola 50cl x3      ₦900
Milo 400g x1           ₦2,200

Subtotal:  ₦4,300
VAT (7.5%): ₦322.50
*TOTAL: ₦4,622.50*

Payment: Cash
Thank you for shopping with us!
```

This text is URL-encoded and opened via:
```
whatsapp://send?phone={customerPhone}&text={encodedReceipt}
```

If customer phone is not set, cashier can type/paste the number.
