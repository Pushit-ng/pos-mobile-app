# POS-Choice Mobile — Push Notifications (Future Feature)

## Overview

Push notifications alert cashiers and managers to important events even when the app is closed. This is a Phase M5 feature — not in the initial launch.

---

## Use Cases

| Notification | Recipient | Trigger |
|-------------|---------|--------|
| Low stock alert | Admin (mobile or web) | Product qty drops to or below `reorderLevel` |
| New held transaction | Same-store cashiers | Cashier puts cart on hold from a different device |
| Shift reminders | Cashier | 30 minutes before shift start |
| New credit customer | Cashier | Customer added with credit limit by admin |
| Daily summary | Admin | 11 PM each day — total revenue, transaction count |

---

## Payload Format

```json
{
  "title":    "Low Stock Alert",
  "body":     "Indomie Chicken 70g — only 3 units left",
  "data": {
    "type":      "LOW_STOCK",
    "productId": "64f3a...",
    "storeId":   "64f1e..."
  },
  "sound": "default",
  "badge":  1
}
```

### Notification Types

| `data.type` | Action on tap |
|-------------|--------------|
| `LOW_STOCK` | Open product detail page |
| `HELD_TRANSACTION` | Open held transactions list |
| `SHIFT_REMINDER` | Open shift open screen |
| `DAILY_SUMMARY` | Open dashboard summary |
| `NEW_CREDIT_CUSTOMER` | Open customer detail |

---

## Technical Setup

### Push Service: Expo Push Notifications

Use **Expo Push Notifications** service — free, handles both FCM (Android) and APNs (iOS) in one API.

#### Frontend — Register Token

```ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null  // simulators don't support push

  const { status: existing } = await Notifications.getPermissionsAsync()
  const { status } = existing === 'granted'
    ? { status: existing }
    : await Notifications.requestPermissionsAsync()

  if (status !== 'granted') return null

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })
  return token.data  // looks like: ExponentPushToken[xxxx...]
}
```

#### Backend — Store Token

`POST /users/push-token` (new endpoint in Phase M5)

```json
{ "pushToken": "ExponentPushToken[xxxx...]" }
```

Store on the `User` document: `pushToken: String`.

#### Backend — Send Notification

```ts
import axios from 'axios'

async function sendPushNotification(pushToken: string, payload: PushPayload) {
  await axios.post('https://exp.host/--/api/v2/push/send', {
    to:    pushToken,
    title: payload.title,
    body:  payload.body,
    data:  payload.data,
    sound: 'default',
  }, {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

## Deep Linking on Tap

When a notification is tapped, the app should navigate to the relevant screen.

```ts
// In root layout — listen for notification taps
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
})

// In root _layout.tsx
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { type, productId } = response.notification.request.content.data as any
    if (type === 'LOW_STOCK')       router.push(`/products/${productId}`)
    if (type === 'HELD_TRANSACTION') router.push('/held')
    if (type === 'SHIFT_REMINDER')   router.push('/shift-open')
  })
  return () => subscription.remove()
}, [])
```

---

## FCM / APNs Setup

Expo handles certificate management automatically when using EAS Build. No manual APNs `.p8` file needed.

**Required for production:**
- Android: Firebase project + `google-services.json` added to EAS credentials
- iOS: Apple Push Notification certificate managed by EAS (automatic)

```bash
# Register FCM credentials with EAS
eas credentials --platform android
# Follow prompts to enter Firebase project details
```

---

## Notification Channels (Android)

```ts
// Create channels on app startup (Android 8+)
Notifications.setNotificationChannelAsync('pos-alerts', {
  name:       'POS Alerts',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  sound:      'default',
})

Notifications.setNotificationChannelAsync('pos-reminders', {
  name:       'Shift Reminders',
  importance: Notifications.AndroidImportance.DEFAULT,
})
```

---

## Privacy Considerations (NDPR)

- Notifications must not include sensitive customer data in the payload visible on the lock screen.
- ❌ Don't put customer name or amount in the notification body.
- ✅ Use vague text: "You have a new held transaction" (not "Chioma's ₦12,400 cart is on hold").
- Users must be able to opt out via app settings → "Push Notifications" toggle.
- Store `pushNotificationsEnabled: boolean` on the User document. Set to `false` on opt-out and skip sending.
