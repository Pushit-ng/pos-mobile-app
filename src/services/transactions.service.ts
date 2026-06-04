import axiosInstance from '@/lib/axios'
import { API_PATHS } from '@/constants/api-paths'

export const transactionsService = {
  create: (payload: Record<string, unknown>, idempotencyKey: string) =>
    axiosInstance.post(API_PATHS.TRANSACTIONS.CREATE, payload, {
      headers: { 'X-Idempotency-Key': idempotencyKey },
    }),

  getReceipt: (invoiceId: string) =>
    axiosInstance.get(API_PATHS.TRANSACTIONS.RECEIPT(invoiceId)),

  hold: (data: Record<string, unknown>) =>
    axiosInstance.post(API_PATHS.TRANSACTIONS.HOLD, data),

  getHeld: () =>
    axiosInstance.get(API_PATHS.TRANSACTIONS.HOLD),

  deleteHeld: (id: string) =>
    axiosInstance.delete(API_PATHS.TRANSACTIONS.HOLD_BY_ID(id)),

  getNextInvoiceId: () =>
    axiosInstance.get(API_PATHS.TRANSACTIONS.NEXT_INVOICE_ID),
}
