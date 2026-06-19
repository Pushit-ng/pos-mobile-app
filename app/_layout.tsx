import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as SecureStore from 'expo-secure-store'
import { useURL } from 'expo-linking'
import * as Linking from 'expo-linking'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { StyleSheet } from 'react-native'
import { useAuthStore } from '@/store/auth.store'
import { setNavigateToLogin } from '@/lib/axios'
import ToastContainer from '@/components/ToastContainer'
import OfflineBanner from '@/components/OfflineBanner'
import OfflineQueueBanner from '@/components/OfflineQueueBanner'
import UpdateBanner from '@/components/UpdateBanner'
import { TOKEN_KEY } from '@/constants/config'
import { biometricService } from '@/services/biometric.service'
import { notificationsService } from '@/services/notifications.service'
import { useSettingsStore } from '@/store/settings.store'

SplashScreen.preventAutoHideAsync()

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export default function RootLayout() {
  const setSession   = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)

  const biometricEnabled    = useSettingsStore((s) => s.biometricEnabled)
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled)

  // Register the navigate-to-login callback for axios 401 interceptor
  useEffect(() => {
    setNavigateToLogin(() => {
      clearSession()
      router.replace('/(auth)/login')
    })
  }, [clearSession])

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY)
        if (token) {
          const payload = decodeJwtPayload(token)
          const exp = payload?.exp as number | undefined
          const now = Date.now() / 1000

          if (payload && exp && exp > now) {
            setSession(
              {
                sub:       String(payload.sub ?? ''),
                firstName: String(payload.firstName ?? ''),
                lastName:  String(payload.lastName ?? ''),
                role:      String(payload.role ?? ''),
                companyId: String(payload.companyId ?? ''),
                storeId:   payload.storeId ? String(payload.storeId) : undefined,
              },
              token,
            )
            // Hide splash before biometric prompt so the Face ID dialog is visible
            await SplashScreen.hideAsync()
            // Read from store directly — avoid stale closure since AsyncStorage
            // hydration is async and biometricEnabled may still be false at mount time.
            if (useSettingsStore.getState().biometricEnabled) {
              const bioResult = await biometricService.authenticate('Sign in to POS Choice')
              if (!bioResult.success) {
                await SecureStore.deleteItemAsync(TOKEN_KEY)
                router.replace('/(auth)/login')
                return
              }
            }
            router.replace('/(cashier)/pos')
          } else {
            await SecureStore.deleteItemAsync(TOKEN_KEY)
            router.replace('/(auth)/login')
          }
        } else {
          router.replace('/(auth)/login')
        }
      } catch {
        router.replace('/(auth)/login')
      } finally {
        // hideAsync is idempotent — safe to call again if not already hidden
        await SplashScreen.hideAsync()
      }
    }

    bootstrap()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (notificationsEnabled) {
      void notificationsService.requestPermission()
    }
  }, [notificationsEnabled])

  // Deep link handler — routes poschoice://receipt/<invoiceId> to the receipt screen.
  // expo-linking parses poschoice://receipt/INV-123 as { hostname: 'receipt', path: 'INV-123' }
  // so we check hostname, not path.startsWith('receipt/').
  const deepLinkUrl = useURL()
  useEffect(() => {
    if (!deepLinkUrl) return
    const parsed   = Linking.parse(deepLinkUrl)
    const hostname = parsed.hostname ?? ''
    const invoiceId = (parsed.path ?? '').replace(/^\//, '') // strip any leading slash
    if (hostname === 'receipt' && invoiceId) {
      router.push({ pathname: '/receipt/[invoiceId]', params: { invoiceId } })
    }
  }, [deepLinkUrl])

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <StatusBar style="light" />
        <UpdateBanner />
        <OfflineBanner />
        <OfflineQueueBanner />
        <Stack screenOptions={{ headerShown: false }} />
        <ToastContainer />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
})
