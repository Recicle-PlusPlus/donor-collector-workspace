// packages/ui/src/components/chat/ChatHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export interface ChatHeaderProps {
  name: string;
  photoUrl?: string | null;
  onBack: () => void;
}

export const ChatHeader = ({ name, photoUrl, onBack }: ChatHeaderProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={colors.textLight}
        />
      </TouchableOpacity>

      <View style={styles.avatarContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatar} />
        ) : (
          <MaterialCommunityIcons
            name="account"
            size={24}
            color={colors.primary}
          />
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 10,
  },
  backButton: { padding: 5 },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 20 },
  name: { color: colors.textLight, fontSize: 18, fontWeight: 'bold', flex: 1 },
});
