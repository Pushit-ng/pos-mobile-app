import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { printerService, isPrintingAvailable } from '@/services/printer.service'
import { useSettingsStore } from '@/store/settings.store'

interface BluetoothPrinterModalProps {
  visible: boolean
  onClose: () => void
}

interface Device {
  name: string
  address: string
}

export default function BluetoothPrinterModal({ visible, onClose }: BluetoothPrinterModalProps) {
  const [scanning, setScanning]     = useState(false)
  const [devices, setDevices]       = useState<Device[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)

  const pairedPrinter   = useSettingsStore((s) => s.pairedPrinter)
  const setPairedPrinter = useSettingsStore((s) => s.setPairedPrinter)

  async function handleScan() {
    setError(null)
    setScanning(true)
    setDevices([])
    try {
      const found = await printerService.scanDevices()
      setDevices(found)
      if (found.length === 0) {
        setError('No devices found. Make sure your printer is on and paired in phone settings.')
      }
    } catch {
      setError('Failed to scan for devices.')
    } finally {
      setScanning(false)
    }
  }

  async function handleConnect(device: Device) {
    setError(null)
    setConnecting(device.address)
    try {
      await printerService.connectDevice(device.address)
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setPairedPrinter(device)
    } catch {
      setError(`Failed to connect to ${device.name}`)
    } finally {
      setConnecting(null)
    }
  }

  async function handleTestPrint() {
    if (!pairedPrinter) return
    setError(null)
    try {
      await printerService.printReceipt({
        invoiceId: 'TEST-0001',
        items: [{ name: 'Test Item', unitName: 'Piece', qty: 1, lineTotal: 100000 }],
        subtotal: 100000,
        vatAmount: 0,
        total: 100000,
        paymentMethod: 'CASH',
        companyName: 'POS Choice',
      })
    } catch {
      setError('Test print failed. Check printer connection.')
    }
  }

  function handleDisconnect() {
    setPairedPrinter(null)
    setDevices([])
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🖨️ Bluetooth Printer Setup</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>

        {!isPrintingAvailable() ? (
          <View style={styles.unavailable}>
            <Text style={styles.unavailableTitle}>Printing Not Available</Text>
            <Text style={styles.unavailableText}>
              Bluetooth printing is only available in the installed app (not in Expo Go). Build with
              EAS to enable.
            </Text>
          </View>
        ) : (
          <View style={styles.body}>
            {/* Connected printer */}
            {pairedPrinter && (
              <View style={styles.connectedBanner}>
                <Text style={styles.connectedText}>✓ Connected: {pairedPrinter.name}</Text>
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Scan button */}
            <TouchableOpacity
              style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
              onPress={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.scanBtnText}>Scan for Printers</Text>
              )}
            </TouchableOpacity>

            {/* Device list */}
            {devices.length > 0 && (
              <View style={styles.deviceSection}>
                <Text style={styles.sectionLabel}>Available Devices</Text>
                <FlatList
                  data={devices}
                  keyExtractor={(item) => item.address}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.deviceRow}>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{item.name}</Text>
                        <Text style={styles.deviceAddress}>{item.address}</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.connectBtn,
                          pairedPrinter?.address === item.address && styles.connectBtnActive,
                        ]}
                        onPress={() => handleConnect(item)}
                        disabled={connecting === item.address}
                      >
                        {connecting === item.address ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.connectBtnText}>
                            {pairedPrinter?.address === item.address ? 'Connected' : 'Connect'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            )}

            {/* Actions for connected printer */}
            {pairedPrinter && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.testBtn} onPress={handleTestPrint}>
                  <Text style={styles.testBtnText}>Print Test Page</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  unavailable: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  unavailableTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  unavailableText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  body: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  connectedBanner: {
    backgroundColor: '#064e3b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  connectedText: {
    color: '#6ee7b7',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#450a0a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  scanBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scanBtnDisabled: {
    opacity: 0.6,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  deviceSection: {
    gap: 8,
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceAddress: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
  },
  connectBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  connectBtnActive: {
    backgroundColor: '#064e3b',
  },
  connectBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  testBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectBtn: {
    flex: 1,
    backgroundColor: '#450a0a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  disconnectBtnText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '600',
  },
})
