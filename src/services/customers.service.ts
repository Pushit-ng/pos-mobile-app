import axiosInstance from '@/lib/axios'
import { API_PATHS } from '@/constants/api-paths'

export const customersService = {
  search: (q: string) =>
    axiosInstance.get(API_PATHS.CUSTOMERS.SEARCH, { params: { q } }),
}
