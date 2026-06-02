# POS-Choice Mobile — Offline Queue (Future Feature)

## Overview

When a cashier has no internet connection, sales must not be blocked. The offline queue stores transactions locally in AsyncStorage and syncs them to the server when connectivity is restored.

This is a **Phase M5 feature** — not in the initial launch.

---

## AsyncStorage Schema

### Key: `offline_queue`

```json
[
  {
    "localId":        "local-uuid-1234",
    "idempotencyKey": "uuid-v4-for-server-dedup",
    "payload": {
      "storeId":      "64f1e...",
      "cashierId":    "64f1b...",
      "shiftId":      "64f2b...",
      "items": [
        {
          "productId": "64f3a...",
          "name":      "Indomie Chicken 70g",
          "qty":        2,
          "unitType":  "piece",
          "sellingPrice": 3500,
          "lineTotal":    7000
        }
      ],
      "subtotal":     7000,
      "discount":     0,
      "tax":          0,
      "total":        7000,
      "paymentMethod": "CASH",
      "amountTendered": 10000,
      "change":        3000
    },
    "createdLocally": "2026-05-30T11:23:00.000Z",
    "retryCount":     0,
    "status":         "pending",
    "lastError":      null
  }
]
```

### Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Waiting to be synced |
| `syncing` | Currently being sent to server |
| `synced` | Successfully created on server; will be removed from queue |
| `failed` | All retries exhausted; requires manual review |
| `conflict` | Server responded with a conflict (e.g. product deleted) |

---

## Retry Strategy

### Exponential Back-off

```ts
function getRetryDelay(retryCount: number): number {
  // 5s → 10s → 20s → 40s → 80s → max 120s
  return Math.min(5000 * Math.pow(2, retryCount), 120_000)
}
```

| Retry | Delay |
|-------|-------|
| 1st   | 5s    |
| 2nd   | 10s   |
| 3rd   | 20s   |
| 4th   | 40s   |
| 5th   | 80s   |
| 6th+  | 120s  |
| Max retries | 10 (after which status → `failed`) |

### Network Detection

```ts
import NetInfo from '@react-native-community/netinfo'

NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    triggerOfflineQueueSync()
  }
})
```

---

## Sync Process

```ts
async function syncOfflineQueue() {
  const queue = await AsyncStorage.getItem('offline_queue')
  const items: QueueItem[] = queue ? JSON.parse(queue) : []

  const pending = items.filter(i => i.status === 'pending')
  if (!pending.length) return

  for (const item of pending) {
    item.status = 'syncing'
    await saveQueue(items)

    try {
      await api.post('/transactions', item.payload, {
        headers: { 'X-Idempotency-Key': item.idempotencyKey },
      })
      item.status = 'synced'
    } catch (err: any) {
      if (err.response?.status === 409) {
        // 409 = duplicate (already synced on a previous attempt)
        item.status = 'synced'
      } else if (err.response?.status === 422) {
        // 422 = product deleted / stock mismatch — needs manual review
        item.status = 'conflict'
        item.lastError = err.response.data.message
      } else {
        // Network error or 5xx — retry later
        item.status = 'pending'
        item.retryCount += 1
        if (item.retryCount >= 10) item.status = 'failed'
      }
    }

    await saveQueue(items)
  }

  // Remove successfully synced items after 24h (keep for audit)
  await purgeOldSynced(items)
}
```

---

## Conflict Resolution

A conflict happens when the server rejects the transaction (not a network error). Cases:

| Scenario | Server Response | Resolution |
|----------|----------------|-----------|
| Product deleted after offline sale | 404 on productId | Show conflict screen — cashier must re-do the transaction |
| Insufficient stock | 409 with `INSUFFICIENT_STOCK` | Show conflict screen — let cashier adjust qty |
| Duplicate idempotency key (already synced) | 409 with `DUPLICATE_KEY` | Mark as `synced` — silent success |
| Cashier shift closed | 422 | Cannot post to a closed shift — requires manager to re-open or accept the error |

**Conflict Screen:**
```
┌──────────────────────────────────────┐
│  ⚠️  Could not sync offline sale     │
│                                      │
│  Sale for Esther (11:23 AM):         │
│    Indomie × 2  ₦70                  │
│    Total: ₦70 (CASH)                 │
│                                      │
│  Reason: Product no longer available │
│                                      │
│  [Contact Admin]  [Dismiss]          │
└──────────────────────────────────────┘
```

---

## Stock Deduction While Offline

**Problem:** When offline, we cannot confirm stock availability from the server.

**Decision:** Accept the sale optimistically. Show a warning badge if the locally-cached stock for a product is 0 or unknown.

```ts
// In product selector — check local cache
const localStock = getCachedStock(product.id)

if (localStock !== null && localStock <= 0) {
  showToast({
    type: 'warning',
    message: `${product.name} may be out of stock. Sale will be confirmed when online.`
  })
}

// Still allow adding to cart — optimistic
addToCart(product)
```

**Local stock cache:** Products endpoint response is cached in AsyncStorage with a 30-minute TTL. Stock levels in the cache are decremented on each offline sale.

---

## User-Facing Indicators

### Offline Banner

When `NetInfo.isConnected === false`:

```
┌──────────────────────────────────────────────────────┐
│  📶 No internet — sales are saved and will sync      │
│     when you're back online.            [2 pending]  │
└──────────────────────────────────────────────────────┘
```

Shown as a sticky top bar above the product grid. Tap `[2 pending]` to open the queue review screen.

### Queue Counter Badge

Tab bar "Me" tab shows a badge with the count of pending items.

---

## Security Notes

- Offline queue items in AsyncStorage are not encrypted by default on Android. For sensitive deployments, use `expo-secure-store` for the queue.
- Queue items include full transaction payloads. If the device is stolen, an attacker with ADB access could read queue items. This is acceptable for the initial version — revisit for enterprise customers.
- Synced items are purged after 24 hours. The server is the source of truth.
