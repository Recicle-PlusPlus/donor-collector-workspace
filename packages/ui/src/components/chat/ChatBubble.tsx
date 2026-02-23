// packages/ui/src/components/chat/ChatBubble.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export interface ChatBubbleProps {
  text: string;
  isMine: boolean;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export const ChatBubble = ({ text, isMine, time, status }: ChatBubbleProps) => {
  return (
    <View
      style={[
        styles.container,
        isMine ? styles.mineContainer : styles.otherContainer,
      ]}>
      <View
        style={[
          styles.bubble,
          isMine ? styles.mineBubble : styles.otherBubble,
        ]}>
        <Text
          style={[styles.text, isMine ? styles.mineText : styles.otherText]}>
          {text}
        </Text>
        <View style={styles.footer}>
          <Text
            style={[styles.time, isMine ? styles.mineTime : styles.otherTime]}>
            {time}
          </Text>
          {isMine && status && (
            <MaterialCommunityIcons
              name={status === 'sent' ? 'check' : 'check-all'}
              size={14}
              color={status === 'read' ? '#34B7F1' : '#999'}
              style={styles.ticks}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
  },
  mineContainer: { justifyContent: 'flex-end' },
  otherContainer: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 16, elevation: 1 },
  mineBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  text: { fontSize: 15 },
  mineText: { color: colors.textLight },
  otherText: { color: colors.text },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  time: { fontSize: 11 },
  mineTime: { color: 'rgba(255,255,255,0.7)' },
  otherTime: { color: colors.textSecondary },
  ticks: { marginLeft: 4 },
});
