import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { BellRing, BellOff } from 'lucide-react-native';
import { colors } from '../theme/colors';

type PermissionState = 'undetermined' | 'granted' | 'denied';

interface NotificationPermissionDialogProps {
  forceOpen?: boolean;
  onForceClose?: () => void;
}

export const NotificationPermissionDialog = ({
  forceOpen = false,
  onForceClose,
}: NotificationPermissionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState>('undetermined');
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [permissionRequesting, setPermissionRequesting] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const readPermissionStatus = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (!active) {
          return;
        }
        setPermissionStatus(status as PermissionState);
        setPermissionChecked(true);

        if (status === 'undetermined' && attempts < 3) {
          attempts += 1;
          timeout = setTimeout(readPermissionStatus, 1200);
        }
      } catch (error) {
        console.error(
          '[NotificationPermissionDialog] Failed to read permission status:',
          error,
        );
        setPermissionChecked(true);
      }
    };

    void readPermissionStatus();

    return () => {
      active = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const evaluateVisibility = () => {
      if (forceOpen) {
        return;
      }

      if (!permissionChecked) {
        return;
      }

      const shouldOpen = Device.isDevice && permissionStatus === 'denied';

      if (shouldOpen) {
        timeout = setTimeout(() => {
          if (active) {
            setOpen(true);
          }
        }, 600);
      } else if (active) {
        setOpen(false);
      }
    };

    evaluateVisibility();

    return () => {
      active = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [forceOpen, permissionChecked, permissionStatus]);

  const handleEnable = async () => {
    try {
      setPermissionRequesting(true);
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status as PermissionState);
      setPermissionChecked(true);
      setOpen(false);

      if (status !== 'granted') {
        Alert.alert(
          'Notificações desativadas',
          'Para receber alertas em tempo real, permita as notificações nas configurações do dispositivo.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Erro ao ativar notificações',
        'Não foi possível atualizar a permissão agora. Tente novamente.',
      );
    } finally {
      setPermissionRequesting(false);
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    if (forceOpen) {
      onForceClose?.();
    }
  };

  return (
    <Modal visible={forceOpen || open} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleDismiss} />

        <View style={styles.dialog}>
          <View style={styles.iconWrapper}>
            <BellRing size={36} color={colors.primary} strokeWidth={2} />
            <View style={styles.pulseDot} />
          </View>

          <Text style={styles.title}>Nao perca nenhuma coleta</Text>
          <Text style={styles.description}>
            Ative as notificacoes para saber na hora quando um coletor aceitar
            sua doacao ou estiver a caminho.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                permissionRequesting && styles.primaryButtonDisabled,
              ]}
              onPress={handleEnable}
              disabled={permissionRequesting}>
              <BellRing size={18} color={colors.textLight} />
              <Text style={styles.primaryButtonText}>Ativar notificacoes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleDismiss}>
              <BellOff size={16} color={colors.textSecondary} />
              <Text style={styles.secondaryButtonText}>
                Continuar sem notificacoes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dialog: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    elevation: 8,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45,125,70,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  pulseDot: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.textLight,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
});
