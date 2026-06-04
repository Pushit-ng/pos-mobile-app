import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// All prices/totals in KOBO

export interface CartSellingUnit {
  id: string
  name: string
  unitSize: number
  sellingPrice: number
  minimumPrice: number
  isActive: boolean
}

export interface CartProduct {
  id: string
  name: string
  barcode?: string
  sellingPrice: number          // kobo per piece (base unit price)
  minimumSellingPrice: number
  quantityInStock: number
  categoryId?: string
  packDefinition?: {
    packName: string
    packSize: number
    packSellingPrice: number
    packMinimumPrice?: number
  }
  sellingUnits?: CartSellingUnit[]
  baseUnit?: string
}

export interface CartItem {
  product:             CartProduct
  sellingUnitId:       string | null    // UUID from sellingUnits[].id (null for legacy piece)
  sellingUnitType:     'piece' | 'pack' // kept for transaction service compat
  sellingUnitQty:      number
  sellingUnitPrice:    number           // kobo
  sellingUnitName:     string           // snapshot display name
  sellingUnitSize:     number           // base units per selling unit (1 for piece, N for pack)
  quantityInBaseUnits: number           // = sellingUnitQty × sellingUnitSize
  discountAmount:      number           // kobo, per-item
  lineTotal:           number           // kobo
}

export interface CartCustomer {
  id: string
  firstName: string
  lastName: string
  phone: string
  creditBalance?: number  // kobo — amount owed to store
  creditLimit?: number    // kobo — maximum credit allowed
  type: 'walk-in' | 'credit'
}

export interface HeldCart {
  holdId: string
  label?: string
  items: CartItem[]
  customer: CartCustomer | null
  orderDiscount: number
  subtotal: number
  heldAt: string
}

interface CartState {
  items: CartItem[]
  customer: CartCustomer | null
  orderDiscount: number   // kobo
  heldCarts: HeldCart[]
  checkoutIdempotencyKey: string | null

  addItem: (
    product: CartProduct,
    sellingUnit: { id: string; name: string; unitSize: number; sellingPrice?: number } | null,
    sellingUnitQty: number,
    sellingUnitPrice: number,
  ) => void
  updateQty: (index: number, qty: number) => void
  removeItem: (index: number) => void
  applyItemDiscount: (index: number, discountKobo: number) => void
  applyOrderDiscount: (discountKobo: number) => void
  setCustomer: (customer: CartCustomer | null) => void
  clearCart: () => void

  holdCart: (label?: string) => HeldCart
  resumeCart: (holdId: string) => void
  deleteHeld: (holdId: string) => void

  setCheckoutKey: (key: string | null) => void

  // Computed helpers
  subtotal: () => number
  totalDiscount: () => number
  discountedSubtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      orderDiscount: 0,
      heldCarts: [],
      checkoutIdempotencyKey: null,

      addItem: (product, sellingUnit, sellingUnitQty, sellingUnitPrice) => {
        const sellingUnitSize = sellingUnit?.unitSize ?? 1
        const sellingUnitId   = sellingUnit?.id ?? null
        const sellingUnitName = sellingUnit?.name ?? 'Piece'
        const sellingUnitType: 'piece' | 'pack' = sellingUnitSize === 1 ? 'piece' : 'pack'
        const quantityInBaseUnits = sellingUnitQty * sellingUnitSize
        const lineTotal = sellingUnitQty * sellingUnitPrice

        const newItem: CartItem = {
          product,
          sellingUnitId,
          sellingUnitType,
          sellingUnitQty,
          sellingUnitPrice,
          sellingUnitName,
          sellingUnitSize,
          quantityInBaseUnits,
          discountAmount: 0,
          lineTotal,
        }
        set((s) => ({ items: [...s.items, newItem] }))
      },

      updateQty: (index, qty) =>
        set((s) => ({
          items: s.items.map((item, i) => {
            if (i !== index) return item
            const quantityInBaseUnits = qty * item.sellingUnitSize
            const rawLineTotal = qty * item.sellingUnitPrice - item.discountAmount
            return {
              ...item,
              sellingUnitQty: qty,
              quantityInBaseUnits,
              lineTotal: Math.max(0, rawLineTotal),
            }
          }),
        })),

      removeItem: (index) =>
        set((s) => ({ items: s.items.filter((_, i) => i !== index) })),

      applyItemDiscount: (index, discountKobo) =>
        set((s) => ({
          items: s.items.map((item, i) =>
            i === index
              ? {
                  ...item,
                  discountAmount: discountKobo,
                  lineTotal: item.sellingUnitQty * item.sellingUnitPrice - discountKobo,
                }
              : item,
          ),
        })),

      applyOrderDiscount: (discountKobo) => set({ orderDiscount: discountKobo }),

      setCustomer: (customer) => set({ customer }),

      clearCart: () =>
        set({ items: [], customer: null, orderDiscount: 0, checkoutIdempotencyKey: null }),

      holdCart: (label) => {
        const s = get()
        const held: HeldCart = {
          holdId: crypto.randomUUID(),
          label,
          items: s.items,
          customer: s.customer,
          orderDiscount: s.orderDiscount,
          subtotal: s.subtotal(),
          heldAt: new Date().toISOString(),
        }
        set((prev) => ({
          heldCarts: [...prev.heldCarts, held],
          items: [],
          customer: null,
          orderDiscount: 0,
        }))
        return held
      },

      resumeCart: (holdId) => {
        const s = get()
        const held = s.heldCarts.find((h) => h.holdId === holdId)
        if (!held) return

        let updatedHeldCarts = s.heldCarts.filter((h) => h.holdId !== holdId)

        if (s.items.length > 0) {
          const autoHeld: HeldCart = {
            holdId: crypto.randomUUID(),
            label: `Auto-held (${new Date().toLocaleTimeString('en-NG', {
              hour: '2-digit',
              minute: '2-digit',
            })})`,
            items: s.items,
            customer: s.customer,
            orderDiscount: s.orderDiscount,
            subtotal: s.subtotal(),
            heldAt: new Date().toISOString(),
          }
          updatedHeldCarts = [...updatedHeldCarts, autoHeld]
        }

        set({
          items: held.items,
          customer: held.customer,
          orderDiscount: held.orderDiscount,
          heldCarts: updatedHeldCarts,
        })
      },

      deleteHeld: (holdId) =>
        set((s) => ({ heldCarts: s.heldCarts.filter((h) => h.holdId !== holdId) })),

      setCheckoutKey: (key) => set({ checkoutIdempotencyKey: key }),

      subtotal: () => get().items.reduce((sum, item) => sum + item.lineTotal, 0),

      totalDiscount: () => {
        const s = get()
        return s.items.reduce((sum, item) => sum + item.discountAmount, 0) + s.orderDiscount
      },

      discountedSubtotal: () => {
        const s = get()
        return s.subtotal() - s.orderDiscount
      },
    }),
    {
      name: 'pos-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        items: s.items,
        customer: s.customer,
        orderDiscount: s.orderDiscount,
        heldCarts: s.heldCarts,
      }),
    },
  ),
)
