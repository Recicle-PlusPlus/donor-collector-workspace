import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@workspace/db';
import { colors } from '@workspace/ui';

export interface AccountStatusScreenProps {
  status: 'pending' | 'blocked';
}

export const AccountStatusScreen = ({ status }: AccountStatusScreenProps) => {
  const isPending = status === 'pending';

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Ícone Dinâmico */}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: isPending ? '#FEF3C7' : '#FEE2E2' },
          ]}>
          <MaterialCommunityIcons
            name={isPending ? 'clock-outline' : 'account-cancel-outline'}
            size={60}
            color={isPending ? '#F59E0B' : '#EF4444'}
          />
        </View>

        {/* Textos Dinâmicos */}
        <Text style={styles.title}>
          {isPending ? 'Conta em Análise' : 'Acesso Suspenso'}
        </Text>

        <Text style={styles.description}>
          {isPending
            ? 'Sua solicitação de cadastro como coletor foi recebida com sucesso! Estamos analisando seus dados e em breve liberaremos seu acesso.'
            : 'Sua conta foi suspensa pelo administrador. Entre em contato com o suporte para mais informações.'}
        </Text>

        {/* Botão para deslogar */}
        <TouchableOpacity style={styles.btnOutline} onPress={handleLogout}>
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.btnText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    gap: 10,
  },
  btnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
});
