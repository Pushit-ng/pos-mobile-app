import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import ProductCard from '@/components/ProductCard'
import CartBadge from '@/components/CartBadge'
import UnitPickerSheet from '@/components/UnitPickerSheet'
import CheckoutSheet from '@/components/CheckoutSheet'
import type { CartProduct } from '@/store/cart.store'

const CATEGORIES = [
  { id: '', name: 'All' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'food', name: 'Food' },
  { id: 'household', name: 'Household' },
  { id: 'electronics', name: 'Electronics' },
]

export default function PosScreen() {
  const user            = useAuthStore((s) => s.user)
  const addItem         = useCartStore((s) => s.addItem)
  const pushToast       = useUIStore((s) => s.pushToast)

  const {
    products,
    loading,
    loadMore,
    refresh,
    hasMore,
    search,
    setSearch,
    category,
    setCategory,
  } = useProducts()

  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(null)
  const [checkoutVisible, setCheckoutVisible] = useState(false)

  const handleProductSelect = useCallback((product: CartProduct) => {
    const activeUnits = product.sellingUnits?.filter((u) => u.isActive) ?? []

    if (activeUnits.length <= 1) {
      // Single unit — add directly
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const unit = activeUnits[0] ?? null
      const price = unit?.sellingPrice ?? product.sellingPrice
      addItem(product, unit, 1, price)
      pushToast(`${product.name} added`, 'success', 1500)
    } else {
      // Multiple units — open picker
      setSelectedProduct(product)
    }
  }, [addItem, pushToast])

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) loadMore()
  }, [hasMore, loading, loadMore])

  const renderProduct = useCallback(
    ({ item }: { item: CartProduct }) => (
      <ProductCard product={item} onSelect={handleProductSelect} />
    ),
    [handleProductSelect],
  )

  const keyExtractor = useCallback((item: CartProduct) => item.id, [])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.storeName}>POS Choice</Text>
          <Text style={styles.cashierName}>
            {user?.firstName ?? 'Cashier'}
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchText}
              value={search}
              onChangeText={setSearch}
              placeholder="Search products..."
              placeholderTextColor="#475569"
            />
          </View>
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => router.push('/(cashier)/scanner')}
          >
            <Text style={styles.cameraBtnText}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, category === cat.id && styles.chipActive]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={[styles.chipText, category === cat.id && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product grid */}
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={keyExtractor}
          numColumns={2}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.grid}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading && products.length === 0}
              onRefresh={refresh}
              tintColor="#6366f1"
            />
          }
          ListFooterComponent={
            loading && products.length > 0 ? (
              <ActivityIndicator color="#6366f1" style={styles.footerLoader} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <ActivityIndicator color="#6366f1" />
              </View>
            )
          }
        />

        {/* Cart badge (sticky) */}
        <CartBadge
          onPress={() => {
            /* Cart drawer — open checkout for now */
            setCheckoutVisible(true)
          }}
          onCharge={() => setCheckoutVisible(true)}
        />

        {/* Unit picker sheet */}
        <UnitPickerSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        {/* Checkout sheet */}
        <CheckoutSheet
          visible={checkoutVisible}
          onClose={() => setCheckoutVisible(false)}
          onSuccess={() => setCheckoutVisible(false)}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  storeName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cashierName: {
    color: '#94a3b8',
    fontSize: 14,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    height: 44,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cameraBtnText: {
    fontSize: 20,
  },
  chipScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  chipContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  chipActive: {
    backgroundColor: '#312e81',
    borderColor: '#6366f1',
  },
  chipText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#a5b4fc',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  grid: {
    padding: 8,
    paddingBottom: 120,
  },
  footerLoader: {
    padding: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
  },
})
