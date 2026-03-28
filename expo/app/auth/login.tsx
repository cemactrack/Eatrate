import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { Link, useRouter } from 'expo-router';

export default function AuthLoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const canSubmit = useMemo(() => email.length > 3 && password.length >= 6, [email, password]);

  const onSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Navigation will be handled by auth state change
      router.replace('/(tabs)/(home)/home' as const);
    } catch (e) {
      console.error('[AuthLogin] error', e);
      // Error handling is done in the signIn method
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0ea5e9', '#22c55e']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.card} testID="auth-login">
          <Text style={styles.title}>Welcome back</Text>

          <View style={styles.inputRow}>
            <Mail size={18} color="#6b7280" />
            <TextInput
              testID="email"
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputRow}>
            <Lock size={18} color="#6b7280" />
            <TextInput
              testID="password"
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            testID="login-button"
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Login'}</Text>
            <ArrowRight size={18} color="white" />
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>No account?</Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.light.text, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 16, color: Colors.light.text },
  button: {
    marginTop: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 16 },
  footerRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  footerText: { color: '#6b7280' },
  link: { color: Colors.light.tint, fontWeight: '700' },
});
