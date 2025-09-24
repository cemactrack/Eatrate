import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Phone, ArrowRight, Eye, EyeOff, User, ArrowLeft, Shield, Sparkles, Check } from 'lucide-react-native';
import Colors, { gradients } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const authContext = useAuth();
  const { loginWithEmail, loginWithPhone } = authContext || { loginWithEmail: async () => {}, loginWithPhone: async () => {} };
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
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

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first and last name.');
      return false;
    }
    
    const value = mode === 'email' ? email : phone;
    if (!value.trim()) {
      Alert.alert('Missing Information', `Please enter your ${mode}.`);
      return false;
    }
    
    if (mode === 'email' && !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }
    
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy.');
      return false;
    }
    
    return true;
  };

  const onSubmit = async () => {
    console.log('[SignupScreen] submit', { mode, hasValue: !!(mode === 'email' ? email : phone) });
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // In a real app, you'd call a signup API here
      // For now, we'll just simulate the signup and then login
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1500)); // Simulate API call
      
      if (mode === 'email') await loginWithEmail(email);
      else await loginWithPhone(phone);
      
      router.replace('/(tabs)/home' as const);
    } catch (e) {
      console.error('[SignupScreen] signup error', e);
      Alert.alert('Signup Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  const isFormValid = () => {
    const value = mode === 'email' ? email : phone;
    return firstName.trim().length > 0 && 
           lastName.trim().length > 0 && 
           value.length > 0 && 
           password.length >= 6 && 
           confirmPassword.length >= 6 &&
           password === confirmPassword &&
           agreedToTerms;
  };

  return (
    <LinearGradient colors={gradients.primary} style={styles.gradient}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={navigateToLogin}>
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Sparkles size={28} color="white" />
                </View>
              </View>
              <Text style={styles.welcomeText}>Create Account</Text>
              <Text style={styles.subtitle}>Join us and start your culinary adventure</Text>
            </View>

            {/* Auth Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity 
                testID="signup-mode-email"
                style={[styles.modeButton, mode === 'email' && styles.modeButtonActive]} 
                onPress={() => setMode('email')}
              >
                <Mail size={18} color={mode === 'email' ? Colors.light.tint : Colors.light.secondary} />
                <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                testID="signup-mode-phone"
                style={[styles.modeButton, mode === 'phone' && styles.modeButtonActive]} 
                onPress={() => setMode('phone')}
              >
                <Phone size={18} color={mode === 'phone' ? Colors.light.tint : Colors.light.secondary} />
                <Text style={[styles.modeText, mode === 'phone' && styles.modeTextActive]}>Phone</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Inputs */}
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.nameInput]}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <View style={[styles.inputWrapper, focusedField === 'firstName' && styles.inputWrapperFocused]}>
                    <User size={20} color={Colors.light.secondary} style={styles.inputIcon} />
                    <TextInput
                      testID="firstName-input"
                      style={styles.input}
                      placeholder="John"
                      placeholderTextColor={Colors.light.secondary}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
                
                <View style={[styles.inputContainer, styles.nameInput]}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <View style={[styles.inputWrapper, focusedField === 'lastName' && styles.inputWrapperFocused]}>
                    <User size={20} color={Colors.light.secondary} style={styles.inputIcon} />
                    <TextInput
                      testID="lastName-input"
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor={Colors.light.secondary}
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </View>

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
                    testID="signup-input"
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
                    placeholder="Create a strong password"
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
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.passwordStrength}>
                    <View style={styles.strengthIndicators}>
                      <View style={[styles.strengthDot, password.length >= 6 && styles.strengthDotActive]} />
                      <View style={[styles.strengthDot, password.length >= 8 && /[A-Z]/.test(password) && styles.strengthDotActive]} />
                      <View style={[styles.strengthDot, password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password) && styles.strengthDotActive]} />
                    </View>
                    <Text style={styles.strengthText}>
                      {password.length < 6 ? 'Weak' : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Strong' : 'Medium'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputWrapperFocused]}>
                  <TextInput
                    testID="confirmPassword-input"
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor={Colors.light.secondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={Colors.light.secondary} />
                    ) : (
                      <Eye size={20} color={Colors.light.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms Agreement */}
              <TouchableOpacity 
                style={styles.termsContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Check size={14} color={Colors.light.tint} />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Security Notice */}
              <View style={styles.securityNotice}>
                <Shield size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.securityText}>Your data is protected with end-to-end encryption</Text>
              </View>

              {/* Signup Button */}
              <TouchableOpacity 
                testID="signup-continue"
                style={[styles.signupButton, !isFormValid() && styles.signupButtonDisabled]} 
                onPress={onSubmit} 
                disabled={!isFormValid() || isLoading}
              >
                <LinearGradient 
                  colors={isFormValid() ? ['#FF6B35', '#F7931E'] : ['#E5E7EB', '#D1D5DB']} 
                  style={styles.signupButtonGradient}
                >
                  <Text style={[styles.signupButtonText, !isFormValid() && styles.signupButtonTextDisabled]}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                  {!isLoading && <ArrowRight size={20} color={isFormValid() ? 'white' : Colors.light.secondary} />}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
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
    marginBottom: 32,
    position: 'relative',
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
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
    marginBottom: 24,
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
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  checkmark: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: '700',
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  strengthIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  strengthDotActive: {
    backgroundColor: '#10B981',
  },
  strengthText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
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
  termsText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  termsLink: {
    color: 'white',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signupButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  signupButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  signupButtonTextDisabled: {
    color: Colors.light.secondary,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textDecorationLine: 'underline',
  },
});