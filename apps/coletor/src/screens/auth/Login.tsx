import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ButtonDefault,
  InputIcon,
  Loading,
  ErrorModal,
  colors,
} from '@workspace/ui';
import { supabase } from '@workspace/db';

import { RootStackParamList } from '../../navigation';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export function Login() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Estados dos inputs
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [hidePass, setHidePass] = useState(true);

  // Estados de feedback visual
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !pass) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
      });

      if (error) throw error;
    } catch (e: any) {
      setErrorMsg(e.message || 'Ocorreu um erro ao iniciar sessão.');
    } finally {
      setLoading(false);
    }
  }

  function openSignScreen() {
    navigation.navigate('Sign');
  }

  // TO DO:
  function loginWithGoogle() {
    alert('Início de sessão com Google ainda não implementado.');
  }

  return (
    <View style={styles.container}>
      {errorMsg && (
        <ErrorModal
          title="Atenção"
          content={errorMsg}
          closeFunc={() => setErrorMsg(null)}
        />
      )}
      {loading && <Loading message="Iniciando sessão..." />}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {/* logo: */}
          {/* <Image source={require('../../../assets/images/logo.png')} style={styles.logo} /> */}
          <Text style={styles.headerText}>Recicle++</Text>
        </View>

        <View style={styles.dataContainer}>
          <Text style={styles.title}>Iniciar Sessão</Text>

          <InputIcon
            label="Email"
            placeholder="Introduza o seu email"
            value={email}
            onChangeText={setEmail}
            icon="email-outline"
            keyboardType="email-address"
          />

          <InputIcon
            label="Senha"
            placeholder="Introduza a sua senha"
            value={pass}
            onChangeText={setPass}
            icon={hidePass ? 'eye-outline' : 'eye-off-outline'}
            btn={true}
            cb={() => setHidePass(!hidePass)}
            secureTextEntry={hidePass}
          />

          <View style={styles.spacer} />

          <ButtonDefault
            title="Entrar"
            fun={handleLogin}
            color={colors.primary}
            textColor={colors.textLight}
            width={0.8}
          />

          <View style={styles.smallSpacer} />

          <ButtonDefault
            title="Registar"
            fun={openSignScreen}
            color={colors.primary}
            textColor={colors.textLight}
            opacity={0.7}
            width={0.8}
          />

          <Text style={styles.orText}>Ou inicie sessão com</Text>

          <ButtonDefault
            title="Google"
            fun={loginWithGoogle}
            color={colors.primary}
            textColor={colors.textLight}
            width={0.8}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 250,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  headerText: {
    color: colors.textLight,
    fontSize: 28,
    fontWeight: 'bold',
  },
  dataContainer: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 20,
    color: colors.textSecondary,
  },
  spacer: {
    height: 25,
  },
  smallSpacer: {
    height: 10,
  },
  orText: {
    marginVertical: 20,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
