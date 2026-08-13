import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@workspace/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RouteActionBarProps {
  selectedCount: number;
  onGenerateRoute: () => void;
}

export function RouteActionBar({
  selectedCount,
  onGenerateRoute,
}: RouteActionBarProps) {
  const insets = useSafeAreaInsets();

  if (selectedCount < 1) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}>
      <View style={styles.card}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>
            {selectedCount}{' '}
            {selectedCount === 1
              ? 'coleta selecionada'
              : 'coletas selecionadas'}
          </Text>
          <Text style={styles.subtitle}>Monte sua rota inteligente</Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={onGenerateRoute}>
          <MaterialCommunityIcons name="routes" size={20} color="#FFF" />
          <Text style={styles.actionText}>Gerar Rota</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 60,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryDark || '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
