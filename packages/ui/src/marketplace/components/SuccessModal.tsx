import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { colors } from '../../theme/colors';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  code: string;
}

export const SuccessModal = ({
  open,
  onClose,
  productName,
  code,
}: SuccessModalProps) => {
  const copyCode = () => {
    Alert.alert(
      'Código Copiado!',
      `Use o código ${code} para retirar seu prêmio.`,
    );
  };

  return (
    <Modal visible={open} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="party-popper"
              size={40}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>Resgate Concluído!</Text>
          <Text style={styles.subtitle}>
            Você resgatou <Text style={styles.bold}>{productName}</Text>
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Código:</Text>
            <Text style={styles.codeValue}>{code}</Text>
            <TouchableOpacity onPress={copyCode}>
              <MaterialCommunityIcons
                name="content-copy"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            onPress={onClose}
            style={styles.closeButton}
            buttonColor={colors.primary}>
            Fechar
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  bold: { fontWeight: 'bold', color: '#111' },
  codeBox: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  codeLabel: { fontSize: 14, color: '#666' },
  codeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  closeButton: { width: '100%', borderRadius: 12, paddingVertical: 5 },
});
