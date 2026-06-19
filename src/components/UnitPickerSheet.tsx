import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import * as Haptics from 'expo-haptics'
import { formatNaira } from '@/utils/format-currency'
import type { CartProduct, CartSellingUnit } from '@/store/cart.store'
import { useCartStore } from '@/store/cart.store'
import { useUIStore } from '@/store/ui.store'

interface UnitPickerSheetProps {
  product: CartProduct | null
  onClose: () => void
}

export default function UnitPickerSheet({ product, onClose }: UnitPickerSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints     = useMemo(() => ['60%'], [])
  const [selectedUnit, setSelectedUnit] = useState<CartSellingUnit | null>(null)
  const [qty, setQty] = useState(1)

  const addItem    = useCartStore((s) => s.addItem)
  const pushToast  = useUIStore((s) => s.pushToast)

  const activeUnits = product?.sellingUnits?.filter((u) => u.isActive) ?? []

  // Reset on product change — derive activeUnits inside effect to avoid stale closure
  React.useEffect(() => {
    const units = product?.sellingUnits?.filter((u) => u.isActive) ?? []
    if (product && units.length > 0) {
      setSelectedUnit(units[0] ?? null)
      setQty(1)
      bottomSheetRef.current?.expand()
    } else if (!product) {
      bottomSheetRef.current?.close()
    }
  }, [product])

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  function handleAdd() {
    if (!product || !selectedUnit) return
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    addItem(product, selectedUnit, qty, selectedUnit.sellingPrice)
    pushToast(`${product.name} added to cart`, 'success')
    onClose()
    bottomSheetRef.current?.close()
  }

  function adjustQty(delta: number) {
    setQty((prev) => Math.max(1, prev + delta))
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const lineTotal = selectedUnit ? selectedUnit.sellingPrice * qty : 0

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        {product ? (
          <>
            <Text style={styles.productName}>{product.name}</Text>

            {/* Unit cards */}
            <View style={styles.unitsRow}>
              {activeUnits.map((unit) => (
                <TouchableOpacity
                  key={unit.id}
                  style={[
                    styles.unitCard,
                    selectedUnit?.id === unit.id && styles.unitCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedUnit(unit)
                    if (Platform.OS !== 'web') Haptics.selectionAsync()
                  }}
                >
                  <Text style={styles.unitName}>{unit.name}</Text>
                  {unit.unitSize > 1 && (
                    <Text style={styles.unitSize}>= {unit.unitSize} {product.baseUnit ?? 'pieces'}</Text>
                  )}
                  <Text style={styles.unitPrice}>{formatNaira(unit.sellingPrice)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Qty stepper */}
            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>Qty:</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustQty(-1)}
                disabled={qty <= 1}
              >
                <Text style={[styles.stepBtnText, qty <= 1 && styles.stepBtnDisabled]}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustQty(1)}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.lineTotal}>Total: {formatNaira(lineTotal)}</Text>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#0f172a',
  },
  handle: {
    backgroundColor: '#334155',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  productName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  unitsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  unitCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  unitCardSelected: {
    borderColor: '#6366f1',
  },
  unitName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  unitSize: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8,
  },
  unitPrice: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  stepperLabel: {
    color: '#94a3b8',
    fontSize: 16,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  stepBtnDisabled: {
    color: '#475569',
  },
  qtyText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  lineTotal: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  addBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
