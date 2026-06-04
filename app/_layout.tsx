import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as SecureStore from 'expo-secure-store'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { StyleSheet } from 'react-native'
import { useAuthStore } from '@/store/auth.store'
import { setNavigateToLogin } from '@/lib/axios'
import ToastContainer from '@/components/ToastContainer'
import { TOKEN_KEY } from '@/constants/config'

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
        await SplashScreen.hideAsync()
      }
    }

    bootstrap()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <StatusBar style="light" />
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
