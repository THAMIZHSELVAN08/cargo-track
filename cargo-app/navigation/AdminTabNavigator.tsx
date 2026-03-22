import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUnlockScreen    from '../screens/admin/AdminUnlockScreen';
import AdminAlertsScreen    from '../screens/admin/AdminAlertsScreen';
import AdminProfileScreen   from '../screens/admin/AdminProfileScreen';

const Tab = createBottomTabNavigator();

const C = {
  bg:     '#111827',
  card:   '#1F2937',
  border: '#374151',
  text:   '#F9FAFB',
  muted:  '#9CA3AF',
  accent: '#F97316',
};

// Simple icon components using text/emoji
function TabIcon({ icon, color, size }: { icon: string; color: string; size: number }) {
  return (
    <Text style={{ fontSize: size - 4, color }}>{icon}</Text>
  );
}

export function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor:   C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <TabIcon icon="🗺" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminUnlock"
        component={AdminUnlockScreen}
        options={{
          title: 'Unlock',
          tabBarIcon: ({ color, size }) => <TabIcon icon="🔓" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminAlerts"
        component={AdminAlertsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <TabIcon icon="🔔" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <TabIcon icon="👤" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
