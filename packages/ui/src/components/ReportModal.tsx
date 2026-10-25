import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ReportModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const MIN_CHARS = 20;

export function ReportModal({
  visible,
  title,
  subtitle,
  isLoading,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const handleSubmit = () => {
    if (reason.trim().length >= MIN_CHARS) {
      onSubmit(reason.trim());
      setReason('');
    }
  };

  const isValid = reason.trim().length >= MIN_CHARS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="shield-alert-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                disabled={isLoading}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* Textos */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Descreva o que aconteceu em detalhes..."
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={500}
                value={reason}
                onChangeText={setReason}
                editable={!isLoading}
                autoFocus
              />
              <Text
                style={[
                  styles.charCount,
                  !isValid && reason.length > 0 ? { color: '#EF4444' } : {},
                ]}>
                {reason.length}/{MIN_CHARS} caracteres mínimos
              </Text>
            </View>

            {/* Botão Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                !isValid ? styles.submitBtnDisabled : {},
              ]}
              onPress={handleSubmit}
              disabled={!isValid || isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Enviar Denúncia</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    backgroundColor: `${colors.primary}15`,
    padding: 10,
    borderRadius: 12,
  },
  closeBtn: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: { marginBottom: 24 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#334155',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: '#EF4444',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
