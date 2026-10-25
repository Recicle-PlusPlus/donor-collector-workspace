import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface LegalModalProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export function LegalModal({
  visible,
  title,
  content,
  onClose,
}: LegalModalProps) {
  const renderFormattedText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <Text key={index} style={styles.boldText}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <Text style={styles.text}>{renderFormattedText(content)}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
              <Text style={styles.acceptButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  closeButton: { padding: 4 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  acceptButton: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  text: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
});
