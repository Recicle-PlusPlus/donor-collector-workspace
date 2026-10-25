import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { supabase } from '@workspace/db';
import { colors } from '../theme/colors';

const COUNTDOWN_SECONDS = 20;

export function DeleteAccountButton() {
  const navigation = useNavigation<any>();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (modalVisible) {
      setCountdown(COUNTDOWN_SECONDS);
      setUnderstood(false);
      timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [modalVisible]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user.id) {
        const { data: files } = await supabase.storage
          .from('avatars')
          .list(session.user.id);
        if (files && files.length > 0) {
          const filesToRemove = files.map(x => `${session.user.id}/${x.name}`);
          await supabase.storage.from('avatars').remove(filesToRemove);
        }
      }

      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      console.info(
        `[AccountDeletion] Conta excluída com sucesso. Data: ${new Date().toISOString()}`,
      );

      setModalVisible(false);
      await supabase.auth.signOut();

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Sign' }],
        }),
      );
    } catch (error) {
      console.error('[DeleteAccount]', error);
      Alert.alert(
        'Erro',
        'Não foi possível excluir sua conta. Tente novamente mais tarde.',
      );
      setLoading(false);
      setModalVisible(false);
    }
  };

  const isButtonDisabled = countdown > 0 || !understood || loading;

  return (
    <>
      {/* BOTÃO DISCRETO NA TELA DE PERFIL */}
      <View style={styles.triggerContainer}>
        <TouchableOpacity
          style={styles.triggerButton}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.triggerText}>Excluir minha conta</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE FRICÇÃO INTENCIONAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !loading && setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name="alert-decagram"
                size={32}
                color={colors.error}
              />
            </View>

            <Text style={styles.modalTitle}>Excluir Conta?</Text>
            <Text style={styles.modalSubtitle}>
              Esta é uma ação irreversível. Ao prosseguir:
            </Text>

            <View style={styles.bulletContainer}>
              <Text style={styles.bullet}>
                • Suas doações em andamento serão canceladas.
              </Text>
              <Text style={styles.bullet}>
                • Seu perfil e endereço serão anonimizados.
              </Text>
              <Text style={styles.bullet}>
                • Seu histórico de doações e pontos será apagado.
              </Text>
            </View>

            {/* CHECKBOX DE CONFIRMAÇÃO */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              activeOpacity={0.8}
              onPress={() => setUnderstood(!understood)}
              disabled={loading}>
              <MaterialCommunityIcons
                name={understood ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={understood ? colors.error : colors.textSecondary}
              />
              <Text style={styles.checkboxText}>
                Eu entendo que não poderei recuperar meus dados após a exclusão.
              </Text>
            </TouchableOpacity>

            {/* BOTÕES DE AÇÃO */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={loading}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isButtonDisabled && styles.confirmButtonDisabled,
                ]}
                onPress={handleDelete}
                disabled={isButtonDisabled}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {countdown > 0 ? `Aguarde ${countdown}s` : 'Excluir Conta'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  triggerButton: {
    padding: 10,
  },
  triggerText: {
    color: '#94A3B8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    elevation: 5,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  bulletContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  bullet: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingRight: 10,
  },
  checkboxText: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
  },
  confirmButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
