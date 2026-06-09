import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native'
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import type { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import * as Haptics from 'expo-haptics'
import { formatNaira, nairaToKobo } from '@/utils/format-currency'
import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { transactionsService } from '@/services/transactions.service'
import { buildWhatsAppReceipt } from '@/utils/receipt'
import type { PaymentMethod } from '@/types'

interface CheckoutSheetProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CheckoutSheet({ visible, onClose, onSuccess }: CheckoutSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints     = useMemo(() => ['85%'], [])

  const items      = useCartStore((s) => s.items)
  const customer   = useCartStore((s) => s.customer)
  const subtotalFn = useCartStore((s) => s.subtotal)
  const clearCart  = useCartStore((s) => s.clearCart)
  const user       = useAuthStore((s) => s.user)
  const pushToast  = useUIStore((s) => s.pushToast)

  const [method, setMethod]         = useState<PaymentMethod>('cash')
  const [tenderedStr, setTendered]  = useState('')
  const [reference, setReference]   = useState('')
  const [transferReceived, setTransferReceived] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [invoiceResult, setInvoiceResult] = useState<string | null>(null)
  // Snapshot of items captured before clearCart — needed for WhatsApp receipt
  const [saleItems, setSaleItems] = useState<typeof items>([])
  const [saleCustomer, setSaleCustomer] = useState(customer)

  // Idempotency key — generated once per sheet open
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  const total    = subtotalFn()
  const tendered = nairaToKobo(parseFloat(tenderedStr) || 0)
  const change   = Math.max(0, tendered - total)

  useEffect(() => {
    if (visible) {
      idempotencyKeyRef.current = crypto.randomUUID()
      setMethod('cash')
      setTendered('')
      setReference('')
      setTransferReceived(false)
      setInvoiceResult(null)
      setSaleItems([])
      setSaleCustomer(null)
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [visible])

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  function resolvePaymentMethod(): string {
    switch (method) {
      case 'cash':     return 'CASH'
      case 'transfer': return 'BANK_TRANSFER'
      case 'card':     return 'CARD_POS'
      default:         return 'CASH'
    }
  }

  function buildPaymentDetails(): Record<string, unknown> {
    switch (method) {
      case 'cash':
        return { amountTendered: tendered, change }
      case 'transfer':
        return { bankTransferReference: reference.trim() || null }
      case 'card':
        return { posTerminalReference: reference.trim() || null }
      default:
        return {}
    }
  }

  async function handleCompleteSale() {
    if (method === 'cash' && tendered < total) {
      pushToast('Tendered amount is less than total', 'error')
      return
    }
    if (method === 'transfer' && !transferReceived) {
      pushToast('Please confirm transfer was received', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = {
        storeId: user?.storeId,
        customerId: customer?.id ?? null,
        items: items.map((item) => ({
          productId:        item.product.id,
          sellingUnitId:    item.sellingUnitId ?? undefined,
          sellingUnitQty:   item.sellingUnitQty,
          sellingUnitPrice: item.sellingUnitPrice,
          sellingUnitType:  item.sellingUnitType,
          discountAmount:   item.discountAmount,
        })),
        paymentMethod:  resolvePaymentMethod(),
        paymentDetails: buildPaymentDetails(),
        totalAmount:    total,
      }

      const res = await transactionsService.create(payload, idempotencyKeyRef.current)
      const invoiceId: string =
        res.data?.data?.invoiceNumber ??
        res.data?.data?.invoiceId ??
        res.data?.data?.id ??
        'N/A'

      // Capture snapshot before clearing cart
      setSaleItems([...items])
      setSaleCustomer(customer)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setInvoiceResult(invoiceId)
      clearCart()
      pushToast(`Sale complete — ${invoiceId}`, 'success')
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to complete sale'
      pushToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleShareWhatsApp() {
    if (!invoiceResult) return
    const receiptText = buildWhatsAppReceipt({
      invoiceId: invoiceResult,
      items: saleItems.map((saleItem) => ({
        name: saleItem.product.name,
        unitName: saleItem.sellingUnitName,
        qty: saleItem.sellingUnitQty,
        lineTotal: saleItem.lineTotal,
      })),
      subtotal: saleItems.reduce((s, saleItem) => s + saleItem.lineTotal, 0),
      vatAmount: 0,
      total: saleItems.reduce((s, saleItem) => s + saleItem.lineTotal, 0),
      paymentMethod:
        method === 'cash' ? 'Cash' : method === 'transfer' ? 'Bank Transfer' : 'Card POS',
    })
    const phone = saleCustomer?.phone ? saleCustomer.phone.replace(/\D/g, '') : ''
    const url = phone
      ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(receiptText)}`
      : `whatsapp://send?text=${encodeURIComponent(receiptText)}`
    Linking.openURL(url).catch(() => {
      pushToast('Could not open WhatsApp', 'error')
    })
  }

  function handleDone() {
    onSuccess()
    onClose()
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={!loading}
      backdropComponent={renderBackdrop}
      onClose={onClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {invoiceResult ? (
          /* ---- SUCCESS STATE ---- */
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Sale Complete!</Text>
            <Text style={styles.successInvoice}>{invoiceResult}</Text>
            <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsApp}>
              <Text style={styles.whatsappBtnText}>Share Receipt on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ---- CHECKOUT STATE ---- */
          <>
            <Text style={styles.totalLabel}>TOTAL DUE</Text>
            <Text style={styles.totalAmount}>{formatNaira(total)}</Text>

            {/* Payment method tabs */}
            <View style={styles.tabs}>
              {(['cash', 'transfer', 'card'] as PaymentMethod[]).map((paymentMethod) => (
                <TouchableOpacity
                  key={paymentMethod}
                  style={[styles.tab, method === paymentMethod && styles.tabActive]}
                  onPress={() => setMethod(paymentMethod)}
                >
                  <Text style={[styles.tabText, method === paymentMethod && styles.tabTextActive]}>
                    {paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'transfer' ? 'Transfer' : 'Card POS'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cash tab */}
            {method === 'cash' && (
              <View style={styles.tabContent}>
                <Text style={styles.fieldLabel}>Amount Tendered (₦)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={tenderedStr}
                  onChangeText={setTendered}
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                />
                {tendered > 0 && (
                  <View style={styles.changeRow}>
                    <Text style={styles.changeLabel}>Change:</Text>
                    <Text style={[styles.changeAmount, change > 0 && styles.changePositive]}>
                      {formatNaira(change)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Transfer tab */}
            {method === 'transfer' && (
              <View style={styles.tabContent}>
                <View style={styles.toggleRow}>
                  <Text style={styles.fieldLabel}>Transfer Received</Text>
                  <Switch
                    value={transferReceived}
                    onValueChange={setTransferReceived}
                    trackColor={{ false: '#1e293b', true: '#4f46e5' }}
                    thumbColor="#fff"
                  />
                </View>
                <Text style={styles.fieldLabel}>Reference (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={reference}
                  onChangeText={setReference}
                  placeholder="Transfer reference"
                  placeholderTextColor="#475569"
                />
              </View>
            )}

            {/* Card POS tab */}
            {method === 'card' && (
              <View style={styles.tabContent}>
                <Text style={styles.fieldLabel}>Terminal Reference</Text>
                <TextInput
                  style={styles.input}
                  value={reference}
                  onChangeText={setReference}
                  placeholder="POS terminal reference"
                  placeholderTextColor="#475569"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnLoading]}
              onPress={handleCompleteSale}
              disabled={loading}
            >
              <Text style={styles.confirmBtnText}>
                {loading ? 'Processing...' : 'CONFIRM PAYMENT'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheetScrollView>
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
    padding: 24,
    paddingBottom: 40,
  },
  totalLabel: {
    color: '#64748b',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalAmount: {
    color: '#10b981',
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    marginBottom: 24,
    gap: 12,
  },
  fieldLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  changeLabel: {
    color: '#94a3b8',
    fontSize: 15,
  },
  changeAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  changePositive: {
    color: '#10b981',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnLoading: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  successIcon: {
    fontSize: 64,
    color: '#10b981',
  },
  successTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  successInvoice: {
    color: '#94a3b8',
    fontSize: 16,
  },
  whatsappBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  whatsappBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  doneBtnText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
})
