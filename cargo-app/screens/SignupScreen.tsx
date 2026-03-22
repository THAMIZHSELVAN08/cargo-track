import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { ui } from '../theme/ui';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type SignupProps = NativeStackScreenProps<RootStackParamList, 'Signup'>;
type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function SignupScreen({ navigation }: SignupProps) {
  const { signUp, isSigningIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [biometricId, setBiometricId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => 
    name.trim().length > 0 && 
    email.trim().length > 3 && 
    password.length >= 6 && 
    age.length > 0 && 
    biometricId.length > 0 &&
    !isSigningIn, 
  [name, email, password, age, biometricId, isSigningIn]);

  async function onSignup() {
    setError(null);
    const res = await signUp({
      name,
      email,
      password,
      age: parseInt(age),
      biometricFingerprintId: biometricId
    });
    if (!res.ok) setError(res.message);
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <LinearGradient colors={[ui.color.bg0, ui.color.bg1, '#0A1024']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.brand}>
          <Text style={styles.logo}>CARGO</Text>
          <Text style={styles.subtitle}>Driver Registration</Text>
        </View>

        <View style={styles.cardShadow}>
          <BlurView intensity={28} tint="dark" style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            
            <View style={{ marginTop: ui.space.l, gap: ui.space.s }}>
              <View style={styles.field}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ravi Kumar"
                  placeholderTextColor={ui.color.textTertiary}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="driver@company.com"
                  placeholderTextColor={ui.color.textTertiary}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Min. 6 chars"
                  placeholderTextColor={ui.color.textTertiary}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: ui.space.s }}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="25"
                    placeholderTextColor={ui.color.textTertiary}
                  />
                </View>
                <View style={[styles.field, { flex: 2 }]}>
                  <Text style={styles.label}>Biometric ID</Text>
                  <TextInput
                    style={styles.input}
                    value={biometricId}
                    onChangeText={setBiometricId}
                    placeholder="Fingerprint ID"
                    placeholderTextColor={ui.color.textTertiary}
                  />
                </View>
              </View>
            </View>

            <Pressable 
              style={({ pressed }) => [styles.button, (!canSubmit || pressed) && styles.buttonPressed]} 
              onPress={onSignup} 
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={canSubmit ? ['#FF8A2A', ui.color.accent] : ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.10)']}
                style={styles.buttonFill}
              >
                {isSigningIn ? <ActivityIndicator color="rgba(0,0,0,0.85)" /> : <Text style={styles.buttonText}>Sign Up</Text>}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: ui.color.textSecondary }}>Already have an account? <Text style={{ color: ui.color.accent }}>Sign In</Text></Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </BlurView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ui.color.bg0,
  },
  scrollContainer: {
    paddingHorizontal: ui.space.l,
    paddingTop: 60,
    paddingBottom: 40,
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
    backgroundColor: ui.color.surface,
  },
  cardTitle: {
    color: ui.color.text,
    ...ui.type.headline,
  },
  label: {
    color: ui.color.textSecondary,
    ...ui.type.caption,
    marginBottom: 4,
  },
  field: {
    padding: ui.space.m,
    borderRadius: ui.radius.l,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  input: {
    color: ui.color.text,
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
    color: 'rgba(0,0,0,0.88)',
    fontWeight: '900',
  },
  error: {
    marginTop: ui.space.s,
    color: ui.color.danger,
    textAlign: 'center',
  },
});
