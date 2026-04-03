import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@workspace/db';
import { colors } from './../theme/colors';
import { ErrorModal } from '../components/ErrorModal';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen = ({ onNavigateToRegister }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleLogin = async () => {
    // Validação local
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Informe seu email';
    if (!password) newErrors.password = 'Informe sua senha';
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setGlobalError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // O AuthContext vai detectar a mudança e redirecionar automaticamente
    } catch (e: any) {
      setGlobalError(e.message || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      {globalError && (
        <ErrorModal
          title="Erro no Login"
          content={globalError}
          closeFunc={() => setGlobalError(null)}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Curved Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Recicle++</Text>
          <Text style={styles.subtitleText}>Faça a diferença, recicle!</Text>
        </View>

        {/* Card do Formulário */}
        <View style={styles.formContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Bem-vindo de volta!</Text>
            <Text style={styles.description}>
              Entre na sua conta para continuar
            </Text>

            {/* Input Email */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputBox,
                  errors.email ? styles.inputError : null,
                ]}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={txt => {
                    setEmail(txt);
                    setErrors(p => ({ ...p, email: undefined }));
                  }}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Input Password */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputBox,
                  errors.password ? styles.inputError : null,
                ]}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={txt => {
                    setPassword(txt);
                    setErrors(p => ({ ...p, password: undefined }));
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.forgotPassBtn}>
              <Text style={styles.forgotPassText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Ou entre com</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botão Google */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => Alert.alert('Em breve!')}>
              <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
              <Text style={styles.googleBtnText}>Entrar com Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem conta? </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.footerLink}>Registre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F7' },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 80,
    paddingBottom: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  logoText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },

  formContainer: { paddingHorizontal: 20, marginTop: -30, zIndex: 20 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  description: { fontSize: 14, color: '#64748B', marginBottom: 24 },

  inputWrapper: { marginBottom: 16 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  input: { flex: 1, color: '#0F172A', fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },

  forgotPassBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPassText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  submitBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 15,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#64748B', fontSize: 13, fontWeight: '500' },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  googleBtnText: { color: '#0F172A', fontSize: 15, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#64748B', fontSize: 14 },
  footerLink: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
});
