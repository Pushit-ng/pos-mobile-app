// Shared domain types for POS mobile app.
// Component-only props interfaces live in their respective component files.

/** Payment method for a transaction. Matches backend PaymentMethod enum values. */
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'split'

/** Company configuration loaded from the backend at login time. */
export interface CompanyConfig {
  name: string
  id: string
}

/** Shift data returned by the active-shift endpoint, used during shift close. */
export interface ShiftData {
  id: string
  expectedCash: number     // kobo
  expectedTransfer: number // kobo
  expectedCard: number     // kobo
}

/** Active shift summary used in the stats screen. */
export interface ActiveShift {
  id: string
  openedAt: string
  openingFloat: number
  salesCount?: number
  totalRevenue?: number
}
