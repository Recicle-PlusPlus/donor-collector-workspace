import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@workspace/ui';

export const StatisticItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View style={styles.statisticItem}>
    <Text style={styles.statisticValue}>{value}</Text>
    <Text style={styles.statisticLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  statisticItem: {
    alignItems: 'center',
    margin: 10,
    minWidth: 100,
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
  },
  statisticValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statisticLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
