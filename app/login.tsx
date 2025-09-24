import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Phone, ArrowRight, Eye, EyeOff, Shield, Sparkles } from 'lucide-react-native';
import Colors, { gradients } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { loginWithEmail, loginWithPhone } = useAuth();
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onSubmit = async () => {
    const value = mode === 'email' ? email : phone;
    console.log('[LoginScreen] submit', { mode, hasValue: !!value });
    if (!value || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      if (mode === 'email') await loginWithEmail(email);
      else await loginWithPhone(phone);
      router.replace('/(tabs)/home' as const);
    } catch (e) {
      console.error('[LoginScreen] login error', e);
      Alert.alert('Login Error', 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignup = () => {
    router.push('/signup' as const);
  };

  const isFormValid = () => {
    const value = mode === 'email' ? email : phone;
    return value.length > 0 && password.length >= 6;
  };

  return (
    <LinearGradient colors={gradients.primary} style={styles.gradient}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Sparkles size={32} color="white" />
                </View>
              </View>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your culinary journey</Text>
            </View>

            {/* Auth Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity 
                testID="login-mode-email"
                style={[styles.modeButton, mode === 'email' && styles.modeButtonActive]} 
                onPress={() => setMode('email')}
              >
                <Mail size={18} color={mode === 'email' ? Colors.light.tint : Colors.light.secondary} />
                <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                testID="login-mode-phone"
                style={[styles.modeButton, mode === 'phone' && styles.modeButtonActive]} 
                onPress={() => setMode('phone')}
              >
                <Phone size={18} color={mode === 'phone' ? Colors.light.tint : Colors.light.secondary} />
                <Text style={[styles.modeText, mode === 'phone' && styles.modeTextActive]}>Phone</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email/Phone Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {mode === 'email' ? 'Email Address' : 'Phone Number'}
                </Text>
                <View style={[styles.inputWrapper, focusedField === mode && styles.inputWrapperFocused]}>
                  {mode === 'email' ? (
                    <Mail size={20} color={Colors.light.secondary} style={styles.inputIcon} />
                  ) : (
                    <Phone size={20} color={Colors.light.secondary} style={styles.inputIcon} />
                  )}
                  <TextInput
                    testID="login-input"
                    style={styles.input}
                    placeholder={mode === 'email' ? 'you@example.com' : '+1 (555) 123-4567'}
                    placeholderTextColor={Colors.light.secondary}
                    value={mode === 'email' ? email : phone}
                    onChangeText={mode === 'email' ? setEmail : setPhone}
                    keyboardType={mode === 'phone' ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField(mode)}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
                  <TextInput
                    testID="password-input"
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.light.secondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={Colors.light.secondary} />
                    ) : (
                      <Eye size={20} color={Colors.light.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Security Notice */}
              <View style={styles.securityNotice}>
                <Shield size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.securityText}>Your data is protected with end-to-end encryption</Text>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                testID="login-continue"
                style={[styles.loginButton, !isFormValid() && styles.loginButtonDisabled]} 
                onPress={onSubmit} 
                disabled={!isFormValid() || isLoading}
              >
                <LinearGradient 
                  colors={isFormValid() ? ['#FF6B35', '#F7931E'] : ['#E5E7EB', '#D1D5DB']} 
                  style={styles.loginButtonGradient}
                >
                  <Text style={[styles.loginButtonText, !isFormValid() && styles.loginButtonTextDisabled]}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                  {!isLoading && <ArrowRight size={20} color={isFormValid() ? 'white' : Colors.light.secondary} />}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={navigateToSignup}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
    backdropFilter: 'blur(10px)',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modeTextActive: {
    color: Colors.light.tint,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: 'white',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 16,
  },
  passwordInput: {
    paddingRight: 12,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  loginButtonTextDisabled: {
    color: Colors.light.secondary,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  signupText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signupLink: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textDecorationLine: 'underline',
  },
});
