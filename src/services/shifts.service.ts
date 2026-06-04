import axiosInstance from '@/lib/axios'
import { API_PATHS } from '@/constants/api-paths'

export interface CloseShiftPayload {
  declaredCash: number
  declaredTransfer: number
  declaredCard: number
  closingNote?: string
}

export const shiftsService = {
  getActive: () =>
    axiosInstance.get(API_PATHS.SHIFTS.ACTIVE),

  open: (storeId: string, openingFloat: number, note?: string) =>
    axiosInstance.post(API_PATHS.SHIFTS.CREATE, { storeId, openingFloat, note }),

  close: (shiftId: string, data: CloseShiftPayload) =>
    axiosInstance.patch(API_PATHS.SHIFTS.CLOSE(shiftId), data),
}
