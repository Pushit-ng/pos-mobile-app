import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { useUIStore } from '@/store/ui.store'
import { productsService } from '@/services/products.service'
import type { CartProduct } from '@/store/cart.store'

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning]  = useState(true)
  const [loading, setLoading]    = useState(false)

  const storeId   = useAuthStore((s) => s.user?.storeId ?? '')
  const addItem   = useCartStore((s) => s.addItem)
  const pushToast = useUIStore((s) => s.pushToast)

  async function handleBarcode(data: string) {
    if (!scanning || loading) return
    setScanning(false)
    setLoading(true)

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    try {
      const res = await productsService.scan(data, storeId)
      const raw = res.data?.data
      if (!raw) throw new Error('Product not found')

      const product: CartProduct = {
        ...raw,
        id: raw.id ?? raw._id ?? '',
        sellingUnits: raw.sellingUnits?.map((u: { _id?: string; id?: string }) => ({
          ...u,
          id: u.id ?? u._id ?? '',
        })),
      }

      const activeUnits = product.sellingUnits?.filter((u) => u.isActive) ?? []
      const unit = activeUnits[0] ?? null
      const price = unit?.sellingPrice ?? product.sellingPrice

      addItem(product, unit, 1, price)
      pushToast(`${product.name} added to cart`, 'success')
      router.back()
    } catch {
      pushToast('Product not found for that barcode', 'error')
      // Resume scanning after a short delay
      setTimeout(() => {
        setScanning(true)
        setLoading(false)
      }, 2000)
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is required to scan barcodes.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'qr'],
        }}
        onBarcodeScanned={scanning ? ({ data }) => handleBarcode(data) : undefined}
      />

      {/* Reticle overlay */}
      <View style={styles.overlay}>
        <View style={styles.topDim} />
        <View style={styles.middleRow}>
          <View style={styles.sideDim} />
          <View style={styles.reticle}>
            {/* Corner marks */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {loading && <ActivityIndicator color="#6366f1" />}
          </View>
          <View style={styles.sideDim} />
        </View>
        <View style={styles.bottomDim}>
          <Text style={styles.hintText}>
            {loading ? 'Looking up product...' : 'Align barcode in the frame'}
          </Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const RETICLE_SIZE = 220
const DIM_COLOR = 'rgba(2, 6, 23, 0.7)'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  permText: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topDim: {
    flex: 1,
    backgroundColor: DIM_COLOR,
  },
  middleRow: {
    flexDirection: 'row',
    height: RETICLE_SIZE,
  },
  sideDim: {
    flex: 1,
    backgroundColor: DIM_COLOR,
  },
  reticle: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDim: {
    flex: 1,
    backgroundColor: DIM_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 40,
  },
  hintText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#6366f1',
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  btn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
})
