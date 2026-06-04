import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { useCartStore } from '@/store/cart.store'
import { formatNaira } from '@/utils/format-currency'

interface CartBadgeProps {
  onPress: () => void
  onCharge: () => void
}

export default function CartBadge({ onPress, onCharge }: CartBadgeProps) {
  const items    = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal)
  const slideY   = useRef(new Animated.Value(100)).current

  const itemCount = items.length
  const total     = subtotal()

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: itemCount > 0 ? 0 : 100,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start()
  }, [itemCount, slideY])

  if (itemCount === 0) return null

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideY }] }]}
    >
      <TouchableOpacity style={styles.inner} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.info}>
          <Text style={styles.count}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.total}>{formatNaira(total)}</Text>
        </View>
        <TouchableOpacity style={styles.chargeBtn} onPress={onCharge} activeOpacity={0.8}>
          <Text style={styles.chargeBtnText}>CHARGE</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  info: {
    gap: 2,
  },
  count: {
    color: '#94a3b8',
    fontSize: 12,
  },
  total: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  chargeBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  chargeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
