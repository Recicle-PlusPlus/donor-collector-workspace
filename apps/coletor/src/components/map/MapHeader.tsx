import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MapHeaderProps {
  onFilterAvailable: (available: boolean) => void;
  isAvailableActive: boolean;
}

export function MapHeader({
  onFilterAvailable,
  isAvailableActive,
}: MapHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { top: insets.top + 56 }]}>
      <TouchableOpacity
        onPress={() => onFilterAvailable(!isAvailableActive)}
        style={[
          styles.mainButton,
          isAvailableActive ? styles.buttonActive : styles.buttonInactive,
        ]}
        activeOpacity={0.8}>
        <Feather
          name="clock"
          size={16}
          color={isAvailableActive ? '#FFFFFF' : '#059669'}
        />
        <Text
          style={[
            styles.buttonText,
            isAvailableActive ? styles.textWhite : styles.textGreen,
          ]}>
          {isAvailableActive
            ? 'Mostrando: Coletas Disponíveis Agora'
            : 'Filtrar: Coletas Disponíveis Agora'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 1,
  },
  buttonInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#e2e8f0',
  },
  buttonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  textGreen: {
    color: '#059669',
  },
  textWhite: {
    color: '#FFFFFF',
  },
});
