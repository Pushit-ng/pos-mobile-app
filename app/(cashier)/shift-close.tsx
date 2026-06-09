import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { shiftsService } from '@/services/shifts.service'
import { clearAuthToken } from '@/lib/axios'
import { formatNaira, nairaToKobo } from '@/utils/format-currency'
import type { ShiftData } from '@/types'

export default function ShiftCloseScreen() {
  const clearSession = useAuthStore((s) => s.clearSession)
  const pushToast    = useUIStore((s) => s.pushToast)

  const [shift, setShift]         = useState<ShiftData | null>(null)
  const [loadingShift, setLoadingShift] = useState(true)

  const [cashStr, setCashStr]         = useState('')
  const [transferStr, setTransferStr] = useState('')
  const [cardStr, setCardStr]         = useState('')
  const [note, setNote]               = useState('')
  const [loading, setLoading]         = useState(false)
  const [closed, setClosed]           = useState(false)

  useEffect(() => {
    async function fetchShift() {
      try {
        const res = await shiftsService.getActive()
        const data = res.data?.data
        if (data) {
          setShift({
            id:               data.id ?? data._id,
            expectedCash:     data.expectedCash ?? 0,
            expectedTransfer: data.expectedTransfer ?? 0,
            expectedCard:     data.expectedCard ?? 0,
          })
        }
      } catch {
        pushToast('Could not load shift data', 'error')
      } finally {
        setLoadingShift(false)
      }
    }
    fetchShift()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const declaredCash     = nairaToKobo(parseFloat(cashStr) || 0)
  const declaredTransfer = nairaToKobo(parseFloat(transferStr) || 0)
  const declaredCard     = nairaToKobo(parseFloat(cardStr) || 0)

  const varianceCash     = declaredCash     - (shift?.expectedCash ?? 0)
  const varianceTransfer = declaredTransfer - (shift?.expectedTransfer ?? 0)
  const varianceCard     = declaredCard     - (shift?.expectedCard ?? 0)
  const totalVariance    = varianceCash + varianceTransfer + varianceCard

  async function handleCloseShift() {
    if (!shift) return

    const needsNote = Math.abs(totalVariance) > 100_000 // ₦1,000 in kobo
    if (needsNote && !note.trim()) {
      pushToast('Please add a note explaining the variance', 'error')
      return
    }

    setLoading(true)
    try {
      await shiftsService.close(shift.id, {
        declaredCash,
        declaredTransfer,
        declaredCard,
        closingNote: note || undefined,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setClosed(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to close shift'
      pushToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinish() {
    await clearAuthToken()
    clearSession()
    router.replace('/(auth)/login')
  }

  if (loadingShift) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    )
  }

  if (closed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Shift Closed</Text>
          <View style={styles.varianceSummary}>
            <Text style={styles.varianceRow}>
              Variance: {totalVariance >= 0 ? '+' : ''}{formatNaira(totalVariance)}
            </Text>
          </View>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Done — Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Close Shift</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Expected amounts */}
          {shift && (
            <View style={styles.expectedCard}>
              <Text style={styles.expectedTitle}>Expected Amounts</Text>
              <View style={styles.expectedRow}>
                <Text style={styles.expectedLabel}>Cash</Text>
                <Text style={styles.expectedValue}>{formatNaira(shift.expectedCash)}</Text>
              </View>
              <View style={styles.expectedRow}>
                <Text style={styles.expectedLabel}>Transfer</Text>
                <Text style={styles.expectedValue}>{formatNaira(shift.expectedTransfer)}</Text>
              </View>
              <View style={styles.expectedRow}>
                <Text style={styles.expectedLabel}>Card POS</Text>
                <Text style={styles.expectedValue}>{formatNaira(shift.expectedCard)}</Text>
              </View>
            </View>
          )}

          {/* Declare amounts */}
          <Text style={styles.sectionTitle}>Declare Actual Amounts (₦)</Text>

          <View style={styles.form}>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Cash Count</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cashStr}
                onChangeText={setCashStr}
                placeholder="0.00"
                placeholderTextColor="#475569"
              />
              {cashStr !== '' && (
                <Text style={[
                  styles.variance,
                  varianceCash >= 0 ? styles.varPositive : styles.varNegative,
                ]}>
                  {varianceCash >= 0 ? '+' : ''}{formatNaira(varianceCash)}
                </Text>
              )}
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Transfer Total</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={transferStr}
                onChangeText={setTransferStr}
                placeholder="0.00"
                placeholderTextColor="#475569"
              />
              {transferStr !== '' && (
                <Text style={[
                  styles.variance,
                  varianceTransfer >= 0 ? styles.varPositive : styles.varNegative,
                ]}>
                  {varianceTransfer >= 0 ? '+' : ''}{formatNaira(varianceTransfer)}
                </Text>
              )}
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Card POS Total</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cardStr}
                onChangeText={setCardStr}
                placeholder="0.00"
                placeholderTextColor="#475569"
              />
              {cardStr !== '' && (
                <Text style={[
                  styles.variance,
                  varianceCard >= 0 ? styles.varPositive : styles.varNegative,
                ]}>
                  {varianceCard >= 0 ? '+' : ''}{formatNaira(varianceCard)}
                </Text>
              )}
            </View>

            {/* Total variance */}
            {(cashStr || transferStr || cardStr) && (
              <View style={[
                styles.totalVarianceBox,
                Math.abs(totalVariance) > 100_000 && styles.totalVarianceAlert,
              ]}>
                <Text style={styles.totalVarianceLabel}>Total Variance</Text>
                <Text style={[
                  styles.totalVarianceValue,
                  totalVariance >= 0 ? styles.varPositive : styles.varNegative,
                ]}>
                  {totalVariance >= 0 ? '+' : ''}{formatNaira(totalVariance)}
                </Text>
              </View>
            )}

            {/* Closing note */}
            <Text style={styles.label}>
              Closing Note{Math.abs(totalVariance) > 100_000 ? ' (required)' : ' (optional)'}
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={note}
              onChangeText={setNote}
              placeholder="Any comments about this shift..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, loading && styles.closeBtnDisabled]}
            onPress={handleCloseShift}
            disabled={loading}
          >
            <Text style={styles.closeBtnText}>
              {loading ? 'Closing Shift...' : 'Close Shift'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020617',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    color: '#6366f1',
    fontSize: 15,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  expectedCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
    gap: 10,
  },
  expectedTitle: {
    color: '#64748b',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  expectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expectedLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  expectedValue: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  fieldRow: {
    gap: 6,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  variance: {
    fontSize: 13,
    fontWeight: '600',
  },
  varPositive: {
    color: '#22c55e',
  },
  varNegative: {
    color: '#f87171',
  },
  totalVarianceBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  totalVarianceAlert: {
    borderColor: '#7f1d1d',
    backgroundColor: '#1c0a0a',
  },
  totalVarianceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  totalVarianceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeBtnDisabled: {
    opacity: 0.6,
  },
  closeBtnText: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '700',
  },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
    backgroundColor: '#020617',
  },
  successIcon: {
    fontSize: 72,
    color: '#22c55e',
  },
  successTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  varianceSummary: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  varianceRow: {
    color: '#94a3b8',
    fontSize: 16,
  },
  finishBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
