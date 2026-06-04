import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Vibration,
} from 'react-native'
import * as Haptics from 'expo-haptics'

interface PinPadProps {
  onSubmit: (pin: string) => void
  loading?: boolean
  error?: string
  maxLength?: number
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']

export default function PinPad({
  onSubmit,
  loading = false,
  error,
  maxLength = 6,
}: PinPadProps) {
  const [pin, setPin] = useState('')

  function handleKey(key: string) {
    if (loading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (key === '⌫') {
      setPin((prev) => prev.slice(0, -1))
      return
    }

    if (key === '✓') {
      if (pin.length >= 4) {
        const current = pin
        setPin('')
        onSubmit(current)
      }
      return
    }

    if (pin.length < maxLength) {
      const next = pin + key
      setPin(next)
      // Auto-submit at maxLength
      if (next.length === maxLength) {
        setTimeout(() => {
          setPin('')
          onSubmit(next)
        }, 100)
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* PIN dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length ? styles.dotFilled : styles.dotEmpty]}
          />
        ))}
      </View>

      {/* Error */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Numpad grid */}
      <View style={styles.grid}>
        {KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.key,
              key === '✓' && styles.keyConfirm,
              key === '⌫' && styles.keyBackspace,
            ]}
            onPress={() => handleKey(key)}
            activeOpacity={0.7}
            disabled={loading}
          >
            {loading && key === '✓' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={[
                  styles.keyText,
                  key === '✓' && styles.keyConfirmText,
                ]}
              >
                {key}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
    height: 32,
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotFilled: {
    backgroundColor: '#6366f1',
  },
  dotEmpty: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 280,
    gap: 12,
    marginTop: 16,
  },
  key: {
    width: 80,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyConfirm: {
    backgroundColor: '#6366f1',
  },
  keyBackspace: {
    backgroundColor: '#0f172a',
  },
  keyText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  keyConfirmText: {
    color: '#fff',
  },
})
