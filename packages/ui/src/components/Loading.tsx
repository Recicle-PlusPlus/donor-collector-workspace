import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

export interface LoadingProps {
  message?: string;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
}

export const Loading = ({
  message = 'Carregando...',
  color = colors.primary,
  backgroundColor = colors.background,
  textColor = colors.text,
}: LoadingProps) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActivityIndicator size="large" color={color} />
      {!!message && (
        <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, // Preenche a tela toda (top, bottom, left, right: 0)
    zIndex: 10,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
