import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useCartStore, type HeldCart } from '@/store/cart.store'
import { useUIStore } from '@/store/ui.store'
import { formatNaira } from '@/utils/format-currency'
import { transactionsService } from '@/services/transactions.service'

export default function HeldScreen() {
  const heldCarts  = useCartStore((s) => s.heldCarts)
  const resumeCart = useCartStore((s) => s.resumeCart)
  const deleteHeld = useCartStore((s) => s.deleteHeld)
  const pushToast  = useUIStore((s) => s.pushToast)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleResume(holdId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    resumeCart(holdId)
    pushToast('Cart resumed', 'success')
  }

  function confirmDelete(holdId: string) {
    Alert.alert(
      'Delete Held Cart',
      'Are you sure you want to delete this held cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(holdId)
            try {
              // Best-effort delete on server (may not have server ID)
              await transactionsService.deleteHeld(holdId).catch(() => null)
            } finally {
              deleteHeld(holdId)
              setDeletingId(null)
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            }
          },
        },
      ],
    )
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  }

  function renderItem({ item }: { item: HeldCart }) {
    const isDeleting = deletingId === item.holdId
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>{item.label ?? 'Held Cart'}</Text>
            <Text style={styles.cardMeta}>
              {item.items.length} {item.items.length === 1 ? 'item' : 'items'} · {formatTime(item.heldAt)}
            </Text>
            <Text style={styles.cardTotal}>{formatNaira(item.subtotal)}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={() => handleResume(item.holdId)}
            >
              <Text style={styles.resumeBtnText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => confirmDelete(item.holdId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#f87171" size="small" />
              ) : (
                <Text style={styles.deleteBtnText}>✕</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Held Carts</Text>

        <FlatList
          data={heldCarts}
          keyExtractor={(item) => item.holdId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📌</Text>
              <Text style={styles.emptyText}>No held carts</Text>
              <Text style={styles.emptyHint}>
                Hold a cart from the POS screen to save it here
              </Text>
            </View>
          }
        />
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
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cardMeta: {
    color: '#64748b',
    fontSize: 13,
  },
  cardTotal: {
    color: '#a5b4fc',
    fontSize: 16,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  resumeBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resumeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#f87171',
    fontSize: 16,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyHint: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
})
