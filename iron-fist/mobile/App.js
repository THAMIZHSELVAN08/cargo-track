import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { AuthProvider } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: '#0a0a0b' },
            headerTintColor: '#3b82f6',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#0a0a0b' }
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ 
              title: 'Iron Fist Command',
              headerBackVisible: false 
            }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
