import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { shiftsService } from '@/services/shifts.service'
import { nairaToKobo } from '@/utils/format-currency'

export default function ShiftOpenScreen() {
  const storeId   = useAuthStore((s) => s.user?.storeId ?? '')
  const pushToast = useUIStore((s) => s.pushToast)

  const [floatStr, setFloatStr] = useState('')
  const [note, setNote]         = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleOpenShift() {
    if (!storeId) {
      pushToast('Store not configured on this account', 'error')
      return
    }

    setLoading(true)
    try {
      const openingFloat = nairaToKobo(parseFloat(floatStr) || 0)
      await shiftsService.open(storeId, openingFloat, note || undefined)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      pushToast('Shift opened successfully', 'success')
      router.replace('/(cashier)/pos')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to open shift'
      pushToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏪</Text>
          </View>

          <Text style={styles.title}>Open Shift</Text>
          <Text style={styles.subtitle}>
            Enter your opening float to start selling
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Opening Float (₦)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={floatStr}
              onChangeText={setFloatStr}
              placeholder="0.00"
              placeholderTextColor="#475569"
            />

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. All floats counted and confirmed"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.openBtn, loading && styles.openBtnDisabled]}
            onPress={handleOpenShift}
            disabled={loading}
          >
            <Text style={styles.openBtnText}>
              {loading ? 'Opening Shift...' : 'Open Shift'}
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
  scroll: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 4,
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
  openBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  openBtnDisabled: {
    opacity: 0.6,
  },
  openBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
