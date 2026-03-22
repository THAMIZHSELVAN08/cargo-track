import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../services/env';
import { ui } from '../theme/ui';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, isSigningIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length > 0 && !isSigningIn, [email, password, isSigningIn]);

  const baseUrl = getApiBaseUrl();

  async function onLogin() {
    setError(null);
    const res = await signIn(email, password);
    if (res.ok) {
      if (res.needsEnrollment) {
        navigation.navigate('BiometricEnrollment');
      }
    } else {
      setError(res.message);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <LinearGradient colors={[ui.color.bg0, ui.color.bg1, '#0A1024']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.container}>
        <View style={styles.brand}>
          <View style={styles.logoBadge}>
             <View style={styles.checkInner}>
               <Text style={styles.checkText}>✓</Text>
             </View>
          </View>
          <Text style={styles.welcomeBack}>Welcome Back!</Text>
        </View>

        <View style={styles.cardShadow}>
          <BlurView intensity={28} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>Email Address</Text>

            <View style={{ marginTop: ui.space.m, gap: ui.space.s }}>
              <View style={styles.field}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="driver@company.com"
                  placeholderTextColor={ui.color.textTertiary}
                  selectionColor={ui.color.accent}
                />
              </View>

              <View style={styles.field}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Password"
                  placeholderTextColor={ui.color.textTertiary}
                  selectionColor={ui.color.accent}
                />
              </View>
            </View>

            <Pressable 
              style={({ pressed }) => [styles.button, (!canSubmit || pressed) && styles.buttonPressed]} 
              onPress={onLogin} 
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={canSubmit ? ['#FF8A2A', ui.color.accent] : ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.10)']}
                style={styles.buttonFill}
              >
                {isSigningIn ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
              </LinearGradient>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable 
              onPress={() => Alert.alert('Forgot Credentials', 'Please contact your fleet administrator to reset your login details.')} 
              style={{ marginTop: 24, alignItems: 'center' }}
            >
              <Text style={{ color: ui.color.textSecondary, fontSize: 13 }}>Forgot Credentials? <Text style={{ color: ui.color.accent, fontWeight: '700' }}>Contact Admin</Text></Text>
            </Pressable>

            {!baseUrl ? (
              <Text style={styles.hint}>
                Missing API URL. Set <Text style={styles.code}>EXPO_PUBLIC_API_URL</Text> in your environment.
              </Text>
            ) : null}
          </BlurView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ui.color.bg0,
  },
  container: {
    flex: 1,
    paddingHorizontal: ui.space.l,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: ui.space.xl,
  },
  logo: {
    color: ui.color.text,
    fontSize: 44,
    letterSpacing: 7,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: ui.color.textSecondary,
    ...ui.type.subhead,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardShadow: {
    borderRadius: ui.radius.xl,
    ...ui.shadow,
  },
  card: {
    borderRadius: ui.radius.xl,
    padding: ui.space.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#35C2CF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '300',
  },
  welcomeBack: {
    color: ui.color.textSecondary,
    fontSize: 24,
    fontWeight: '400',
    marginTop: 10,
  },
  cardTitle: {
    color: ui.color.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  label: {
    color: ui.color.textSecondary,
    ...ui.type.caption,
    marginBottom: 8,
  },
  field: {
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  input: {
    color: ui.color.text,
    paddingVertical: 10,
    ...ui.type.body,
  },
  button: {
    marginTop: ui.space.l,
    borderRadius: ui.radius.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonFill: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  error: {
    marginTop: ui.space.s,
    color: ui.color.danger,
    ...ui.type.body,
  },
  hint: {
    marginTop: ui.space.s,
    color: ui.color.warning,
    ...ui.type.caption,
    lineHeight: 18,
  },
  code: {
    ...ui.type.mono,
    color: ui.color.text,
  },
});

