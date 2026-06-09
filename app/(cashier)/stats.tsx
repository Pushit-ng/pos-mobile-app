import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { shiftsService } from '@/services/shifts.service'
import { formatNaira } from '@/utils/format-currency'
import type { ActiveShift } from '@/types'

function formatDuration(start: string): string {
  const ms = Date.now() - new Date(start).getTime()
  const hours   = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}

export default function StatsScreen() {
  const user       = useAuthStore((s) => s.user)
  const pushToast  = useUIStore((s) => s.pushToast)

  const [shift, setShift]     = useState<ActiveShift | null>(null)
  const [loading, setLoading] = useState(true)
  const [timer, setTimer]     = useState('')

  useEffect(() => {
    async function fetchShift() {
      try {
        const res = await shiftsService.getActive()
        const data = res.data?.data
        if (data) {
          setShift({
            id:            data.id ?? data._id,
            openedAt:      data.openedAt ?? data.createdAt,
            openingFloat:  data.openingFloat ?? 0,
            salesCount:    data.salesCount ?? data.transactionCount,
            totalRevenue:  data.totalRevenue ?? data.totalSales,
          })
        }
      } catch {
        // No active shift or network error
      } finally {
        setLoading(false)
      }
    }
    fetchShift()
  }, [])

  // Timer tick
  useEffect(() => {
    if (!shift?.openedAt) return
    const interval = setInterval(() => {
      setTimer(formatDuration(shift.openedAt))
    }, 1000)
    setTimer(formatDuration(shift.openedAt))
    return () => clearInterval(interval)
  }, [shift?.openedAt])

  function handleCloseShift() {
    if (!shift) return
    Alert.alert(
      'Close Shift',
      'You will be taken to the shift close screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => router.push('/(cashier)/shift-close'),
        },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>My Stats</Text>
        <Text style={styles.cashierName}>
          {user?.firstName} {user?.lastName}
        </Text>

        {loading ? (
          <ActivityIndicator color="#6366f1" style={styles.loader} />
        ) : shift ? (
          <>
            {/* Shift info */}
            <View style={styles.shiftCard}>
              <Text style={styles.shiftCardLabel}>Active Shift</Text>
              <Text style={styles.timer}>{timer || '00h 00m'}</Text>
              <Text style={styles.shiftOpened}>
                Opened at{' '}
                {new Date(shift.openedAt).toLocaleTimeString('en-NG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{shift.salesCount ?? 0}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatNaira(shift.totalRevenue ?? 0)}
                </Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatNaira(shift.openingFloat ?? 0)}
                </Text>
                <Text style={styles.statLabel}>Opening Float</Text>
              </View>
            </View>

            {/* Close shift */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseShift}>
              <Text style={styles.closeBtnText}>Close Shift</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noShift}>
            <Text style={styles.noShiftEmoji}>⏱</Text>
            <Text style={styles.noShiftText}>No active shift</Text>
            <TouchableOpacity
              style={styles.openShiftBtn}
              onPress={() => router.push('/(cashier)/shift-open')}
            >
              <Text style={styles.openShiftBtnText}>Open Shift</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cashierName: {
    color: '#64748b',
    fontSize: 15,
    marginBottom: 24,
  },
  loader: {
    marginTop: 48,
  },
  shiftCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  shiftCardLabel: {
    color: '#64748b',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  timer: {
    color: '#6366f1',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 2,
  },
  shiftOpened: {
    color: '#475569',
    fontSize: 13,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
  closeBtn: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '700',
  },
  noShift: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  noShiftEmoji: {
    fontSize: 56,
  },
  noShiftText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '500',
  },
  openShiftBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  openShiftBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})
