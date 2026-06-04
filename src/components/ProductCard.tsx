import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { formatNaira } from '@/utils/format-currency'
import type { CartProduct } from '@/store/cart.store'

interface ProductCardProps {
  product: CartProduct
  onSelect: (product: CartProduct) => void
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const inStock = product.quantityInStock > 0
  const activeUnits = product.sellingUnits?.filter((u) => u.isActive) ?? []
  const hasMultipleUnits = activeUnits.length > 1

  return (
    <TouchableOpacity
      style={[styles.card, !inStock && styles.cardOutOfStock]}
      onPress={() => onSelect(product)}
      activeOpacity={0.75}
      disabled={!inStock}
    >
      {/* Stock indicator */}
      <View style={styles.topRow}>
        <View style={[styles.stockDot, inStock ? styles.dotGreen : styles.dotRed]} />
        {hasMultipleUnits && (
          <View style={styles.unitsBadge}>
            <Text style={styles.unitsBadgeText}>{activeUnits.length} units</Text>
          </View>
        )}
      </View>

      {/* Product name */}
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>

      {/* Price badge */}
      <View style={styles.priceBadge}>
        <Text style={styles.priceText}>{formatNaira(product.sellingPrice)}</Text>
      </View>

      {/* Stock count */}
      <Text style={styles.stockText}>
        {inStock ? `${product.quantityInStock} in stock` : 'Out of stock'}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    margin: 4,
    minHeight: 130,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardOutOfStock: {
    opacity: 0.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#22c55e',
  },
  dotRed: {
    backgroundColor: '#ef4444',
  },
  unitsBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unitsBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  priceBadge: {
    backgroundColor: '#312e81',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  priceText: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '700',
  },
  stockText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
})
