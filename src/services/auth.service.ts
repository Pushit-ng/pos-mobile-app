import axiosInstance from '@/lib/axios'
import { API_PATHS } from '@/constants/api-paths'

export const authService = {
  cashierLogin: (pin: string, companyId: string) =>
    axiosInstance.post(API_PATHS.AUTH.CASHIER_LOGIN, { pin, companyId }),

  getCompanyConfig: (companyId: string) =>
    axiosInstance.get(API_PATHS.COMPANIES.CONFIG, { params: { companyId } }),
}
