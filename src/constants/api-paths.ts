// All paths are relative to the base URL (which includes /api/v1).
// These mirror the web app's api-paths.ts — cashier-relevant paths only.

export const API_PATHS = {
  AUTH: {
    CASHIER_LOGIN: '/auth/cashier/pincode',
  },

  PRODUCTS: {
    LIST: '/products',
    SCAN: '/products/scan',
    BY_ID: (id: string) => `/products/${id}`,
  },

  TRANSACTIONS: {
    CREATE:          '/transactions',
    HOLD:            '/transactions/hold',
    HOLD_BY_ID:      (id: string) => `/transactions/hold/${id}`,
    NEXT_INVOICE_ID: '/transactions/next-invoice-id',
    RECEIPT:         (invoiceId: string) => `/transactions/receipt/${invoiceId}`,
  },

  SHIFTS: {
    ACTIVE: '/shifts/active',
    CREATE: '/shifts',
    CLOSE:  (id: string) => `/shifts/${id}/close`,
  },

  CUSTOMERS: {
    SEARCH: '/customers/search',
  },

  COMPANIES: {
    CONFIG: '/companies/config',
  },

  QUOTATIONS: {
    LIST:  '/quotations',
    BY_ID: (id: string) => `/quotations/${id}`,
  },

  SALES_RETURNS: {
    PROCESS: '/sales-returns',
  },

  CATEGORIES: {
    LIST: '/categories',
  },
} as const
