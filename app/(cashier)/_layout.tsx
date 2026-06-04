import React from 'react'
import { Tabs } from 'expo-router'
import { StyleSheet, View, Text } from 'react-native'
import { useCartStore } from '@/store/cart.store'

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    pos:   '🏪',
    held:  '📌',
    stats: '📊',
  }
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[name] ?? '●'}
    </Text>
  )
}

function HeldBadge() {
  const heldCarts = useCartStore((s) => s.heldCarts)
  if (heldCarts.length === 0) return null
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{heldCarts.length}</Text>
    </View>
  )
}

export default function CashierLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          tabBarIcon: ({ focused }) => <TabIcon name="pos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="held"
        options={{
          title: 'Held',
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon name="held" focused={focused} />
              <HeldBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'My Stats',
          tabBarIcon: ({ focused }) => <TabIcon name="stats" focused={focused} />,
        }}
      />
      {/* Hidden screens — not shown in tabs */}
      <Tabs.Screen name="scanner"    options={{ href: null }} />
      <Tabs.Screen name="shift-open" options={{ href: null }} />
      <Tabs.Screen name="shift-close" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
})
