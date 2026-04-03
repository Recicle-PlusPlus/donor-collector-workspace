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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@workspace/db';
import { colors } from './../theme/colors';
import { ErrorModal } from '../components/ErrorModal';

interface RegisterScreenProps {
  role: 'donor' | 'collector';
  onNavigateToLogin: () => void;
}

const phoneMask = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const RegisterScreen = ({
  role,
  onNavigateToLogin,
}: RegisterScreenProps) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const updateForm = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
  };

  const handleRegister = async () => {
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = 'Informe seu nome';
    if (form.phone.replace(/\D/g, '').length < 10)
      err.phone = 'Telefone inválido';
    if (!form.email) err.email = 'Informe seu email';
    if (form.password.length < 6) err.password = 'Mínimo de 6 caracteres';
    if (form.confirmPassword !== form.password)
      err.confirmPassword = 'As senhas não coincidem';
    setErrors(err);

    if (Object.keys(err).length > 0) return;

    setLoading(true);
    setGlobalError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            phone: form.phone.replace(/\D/g, ''),
            role: role,
          },
        },
      });

      if (error) throw error;

      if (!data.session) {
        setGlobalError(
          'Registro realizado! Verifique sua caixa de entrada para confirmar o email.',
        );
      }
    } catch (e: any) {
      setGlobalError(e.message || 'Ocorreu um erro ao realizar o registro.');
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
          title="Atenção"
          content={globalError}
          closeFunc={() => setGlobalError(null)}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Recicle++</Text>
          <Text style={styles.subtitleText}>Faça a diferença, recicle!</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Crie sua conta</Text>
            <Text style={styles.description}>
              Preencha seus dados para começar como{' '}
              {role === 'donor' ? 'Doador' : 'Coletor'}
            </Text>

            {/* Name */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputBox,
                  errors.name ? styles.inputError : null,
                ]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  placeholderTextColor={colors.textSecondary}
                  value={form.name}
                  onChangeText={t => updateForm('name', t)}
                />
              </View>
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Phone */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputBox,
                  errors.phone ? styles.inputError : null,
                ]}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={form.phone}
                  onChangeText={t => updateForm('phone', phoneMask(t))}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Email */}
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
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={t => updateForm('email', t)}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password */}
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
                  secureTextEntry={!showPw}
                  value={form.password}
                  onChangeText={t => updateForm('password', t)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPw(!showPw)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <MaterialCommunityIcons
                    name={showPw ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputBox,
                  errors.confirmPassword ? styles.inputError : null,
                ]}>
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar Senha"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showCpw}
                  value={form.confirmPassword}
                  onChangeText={t => updateForm('confirmPassword', t)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowCpw(!showCpw)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <MaterialCommunityIcons
                    name={showCpw ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { marginTop: 10 }]}
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Registrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.footerLink}>Fazer Login</Text>
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
