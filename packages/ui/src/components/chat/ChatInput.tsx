import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim().length > 0) {
      onSend(text.trim());
      setText('');
    }
  };

  if (disabled) {
    return (
      <View style={styles.disabledContainer}>
        <MaterialCommunityIcons
          name="lock-outline"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.disabledText}>
          Este chat foi encerrado pois a coleta foi concluída ou cancelada.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite uma mensagem..."
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          text.trim().length === 0 && styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={text.trim().length === 0}>
        <MaterialCommunityIcons
          name="send"
          size={20}
          color={colors.textLight}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: colors.background,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    elevation: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 1,
  },
  sendButtonDisabled: { backgroundColor: '#ccc' },
  disabledContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
    textAlign: 'center',
  },
});
