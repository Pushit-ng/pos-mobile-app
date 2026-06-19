import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export const notificationsService = {
  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) return false
    const { status: existing } = await Notifications.getPermissionsAsync()
    if (existing === 'granted') return true
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  },

  async scheduleHeldCartReminder(label: string, holdId: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📌 Held Cart Reminder',
          body: label
            ? 'You have a held cart "' + label + '" waiting — don\'t forget!'
            : "You have a held cart waiting — don't forget!",
          data: { type: 'held_cart', holdId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 30 * 60,
          repeats: false,
        },
      })
    } catch {
      // Non-fatal
    }
  },

  async cancelHeldCartReminder(holdId: string): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync()
      for (const n of scheduled) {
        if ((n.content.data as Record<string, unknown>)?.holdId === holdId) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier)
        }
      }
    } catch {
      // Non-fatal
    }
  },

  async sendLowStockAlert(productName: string, qty: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Low Stock',
          body: productName + ' has only ' + qty + ' unit' + (qty !== 1 ? 's' : '') + ' left.',
          data: { type: 'low_stock' },
        },
        trigger: null,
      })
    } catch {
      // Non-fatal
    }
  },

  async sendSyncCompleteAlert(count: number): Promise<void> {
    if (count === 0) return
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Offline Sales Synced',
          body: count + ' pending transaction' + (count !== 1 ? 's' : '') + ' uploaded successfully.',
          data: { type: 'sync_complete' },
        },
        trigger: null,
      })
    } catch {
      // Non-fatal
    }
  },
}
