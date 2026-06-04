import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import PinPad from '@/components/PinPad'
import { authService } from '@/services/auth.service'
import { setAuthToken } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { COMPANY_ID } from '@/constants/config'
import { shiftsService } from '@/services/shifts.service'

interface CompanyConfig {
  name: string
  id: string
}

export default function LoginScreen() {
  const setSession  = useAuthStore((s) => s.setSession)
  const pushToast   = useUIStore((s) => s.pushToast)

  const [company, setCompany]         = useState<CompanyConfig | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(true)
  const [loginLoading, setLoginLoading]     = useState(false)
  const [error, setError]                   = useState<string | undefined>()
  const [lockoutSeconds, setLockoutSeconds] = useState(0)

  useEffect(() => {
    async function fetchCompany() {
      if (!COMPANY_ID) {
        setLoadingCompany(false)
        return
      }
      try {
        const res = await authService.getCompanyConfig(COMPANY_ID)
        const data = res.data?.data ?? res.data
        setCompany({ name: data.name ?? 'POS Choice', id: data.id ?? COMPANY_ID })
      } catch {
        setCompany({ name: 'POS Choice', id: COMPANY_ID })
      } finally {
        setLoadingCompany(false)
      }
    }
    fetchCompany()
  }, [])

  useEffect(() => {
    if (lockoutSeconds <= 0) return
    const timer = setInterval(() => {
      setLockoutSeconds((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutSeconds])

  async function handlePinSubmit(pin: string) {
    if (lockoutSeconds > 0) return
    const companyId = company?.id ?? COMPANY_ID
    if (!companyId) {
      setError('Company not configured. Check EXPO_PUBLIC_COMPANY_ID.')
      return
    }

    setLoginLoading(true)
    setError(undefined)
    try {
      const res = await authService.cashierLogin(pin, companyId)
      const { accessToken, user } = res.data?.data ?? {}
      if (!accessToken) throw new Error('No access token received')

      await setAuthToken(accessToken)
      setSession(
        {
          sub:       user?.id ?? user?.sub ?? '',
          firstName: user?.firstName ?? '',
          lastName:  user?.lastName ?? '',
          role:      user?.role ?? 'cashier',
          companyId: user?.companyId ?? companyId,
          storeId:   user?.storeId,
        },
        accessToken,
      )

      // Check for active shift
      try {
        const shiftRes = await shiftsService.getActive()
        const shift = shiftRes.data?.data
        if (shift && shift.id) {
          router.replace('/(cashier)/pos')
        } else {
          router.replace('/(cashier)/shift-open')
        }
      } catch {
        // If shift check fails, go to pos anyway
        router.replace('/(cashier)/pos')
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string; retryAfter?: number } } })?.response?.status
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message

      if (status === 429) {
        const retryAfter =
          (err as { response?: { data?: { retryAfter?: number } } })?.response?.data?.retryAfter ?? 60
        setLockoutSeconds(retryAfter)
        setError(`Too many attempts. Try again in ${retryAfter}s`)
      } else if (status === 401) {
        setError('Incorrect PIN. Please try again.')
      } else {
        setError(message ?? 'Login failed. Check your connection.')
        pushToast(message ?? 'Login failed', 'error')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Company header */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoInitial}>
              {company?.name?.[0]?.toUpperCase() ?? 'P'}
            </Text>
          </View>
          {loadingCompany ? (
            <ActivityIndicator color="#6366f1" size="small" />
          ) : (
            <Text style={styles.companyName}>{company?.name ?? 'POS Choice'}</Text>
          )}
          <Text style={styles.subtitle}>Enter your PIN to sign in</Text>
        </View>

        {/* Lockout countdown */}
        {lockoutSeconds > 0 && (
          <View style={styles.lockoutBanner}>
            <Text style={styles.lockoutText}>
              Too many attempts. Try again in {lockoutSeconds}s
            </Text>
          </View>
        )}

        {/* PIN pad */}
        <PinPad
          onSubmit={handlePinSubmit}
          loading={loginLoading}
          error={lockoutSeconds > 0 ? undefined : error}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoInitial: {
    color: '#a5b4fc',
    fontSize: 36,
    fontWeight: '800',
  },
  companyName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 15,
  },
  lockoutBanner: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  lockoutText: {
    color: '#fca5a5',
    textAlign: 'center',
    fontSize: 13,
  },
})
