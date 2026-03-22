import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AlertScreen } from '../screens/AlertScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import BiometricEnrollmentScreen from '../screens/BiometricEnrollmentScreen';
import { AdminTabNavigator } from './AdminTabNavigator';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  Alert: undefined;
  BiometricEnrollment: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.primary,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

export function AppNavigator() {
  const { token, userRole, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'dispatcher';

  return (
    <NavigationContainer theme={navTheme}>
      {token ? (
        isAdmin ? (
          // Admin / dispatcher → bottom tab navigator
          <AdminTabNavigator />
        ) : (
          // Driver → original stack navigator
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: colors.text,
              headerTitleStyle: { color: colors.text },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Driver Dashboard' }} />
            <Stack.Screen name="Alert" component={AlertScreen} options={{ title: 'Alert' }} />
            <Stack.Screen name="BiometricEnrollment" component={BiometricEnrollmentScreen} options={{ title: 'Enrollment' }} />
          </Stack.Navigator>
        )
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login"  component={LoginScreen}  />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
