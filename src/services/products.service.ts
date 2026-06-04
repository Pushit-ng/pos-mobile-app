import axiosInstance from '@/lib/axios'
import { API_PATHS } from '@/constants/api-paths'

export const productsService = {
  list: (params: Record<string, unknown>) =>
    axiosInstance.get(API_PATHS.PRODUCTS.LIST, { params }),

  scan: (q: string, storeId: string) =>
    axiosInstance.get(API_PATHS.PRODUCTS.SCAN, { params: { q, storeId } }),
}
