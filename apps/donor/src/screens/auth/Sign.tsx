import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ButtonDefault,
  InputIcon,
  InputIconMask,
  Loading,
  ErrorModal,
  colors,
} from '@workspace/ui';
import { supabase } from '@workspace/db';
import { RootStackParamList } from '../../navigation';

type SignScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Sign'
>;

export function Sign() {
  const navigation = useNavigation<SignScreenNavigationProp>();

  // Estados dos inputs
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [hidePass, setHidePass] = useState(true);

  // Estados de feedback visual
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRegister() {
    if (!name || !phone || !email || !pass || !confirmPass) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (pass !== confirmPass) {
      setErrorMsg('As palavras-passe não coincidem. Tente novamente.');
      return;
    }

    if (pass.length < 6) {
      setErrorMsg('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (phone.length < 15) {
      setErrorMsg('Por favor, digite um número de telefone válido com o DDD.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: pass,
        options: {
          data: {
            name: name,
            phone: phone,
            role: 'donor',
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        // O AuthContext detecta a sessão e navega para a Home automaticamente.
      } else {
        setErrorMsg(
          'Registo realizado! Verifique a sua caixa de entrada para confirmar o email.',
        );
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Ocorreu um erro ao realizar o registo.');
    } finally {
      setLoading(false);
    }
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
      {loading && <Loading message="A criar conta..." />}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Criar Conta</Text>
        </View>

        <View style={styles.dataContainer}>
          <Text style={styles.title}>Seja um Doador</Text>

          <InputIcon
            label="Nome Completo *"
            placeholder="Digite o seu nome"
            value={name}
            onChangeText={setName}
            icon="account-outline"
          />

          <InputIconMask
            label="Telefone *"
            mask="(99) 99999-9999"
            placeholder="Ex: (16) 99999-9999"
            value={phone}
            onChangeText={(formatted, raw) => {
              setPhone(raw);
            }}
            icon="phone-outline"
            keyboardType="phone-pad"
          />

          <InputIcon
            label="Email *"
            placeholder="Digite um email válido"
            value={email}
            onChangeText={setEmail}
            icon="email-outline"
            keyboardType="email-address"
          />

          <InputIcon
            label="Palavra-passe *"
            placeholder="Crie uma palavra-passe forte"
            value={pass}
            onChangeText={setPass}
            icon={hidePass ? 'eye-outline' : 'eye-off-outline'}
            btn={true}
            cb={() => setHidePass(!hidePass)}
            secureTextEntry={hidePass}
          />

          <InputIcon
            label="Confirmar Palavra-passe *"
            placeholder="Digite a palavra-passe novamente"
            value={confirmPass}
            onChangeText={setConfirmPass}
            icon={hidePass ? 'eye-outline' : 'eye-off-outline'}
            secureTextEntry={hidePass}
          />

          <View style={styles.spacer} />

          <ButtonDefault
            title="Registar"
            fun={handleRegister}
            color={colors.primary}
            textColor={colors.textLight}
            width={0.8}
          />

          <View style={styles.smallSpacer} />

          <ButtonDefault
            title="Já tenho conta (Voltar)"
            fun={() => navigation.goBack()}
            color="transparent"
            textColor={colors.primary}
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
  scrollContent: { flexGrow: 1 },
  header: {
    height: 150,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 30,
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
    color: colors.text,
  },
  spacer: { height: 25 },
  smallSpacer: { height: 10 },
});
