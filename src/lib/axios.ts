import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_BASE_URL, TOKEN_KEY } from '@/constants/config'

// Router ref — set by root layout so the interceptor can navigate on 401
let _navigateToLogin: (() => void) | null = null
export function setNavigateToLogin(fn: () => void) {
  _navigateToLogin = fn
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
})

// Request interceptor — attach Bearer token from SecureStore
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // SecureStore may fail on simulators; continue without token
  }
  return config
})

// Response interceptor — handle 401 by clearing session + navigating to login
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuthToken()
      _navigateToLogin?.()
    }
    return Promise.reject(error)
  },
)

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export default axiosInstance
