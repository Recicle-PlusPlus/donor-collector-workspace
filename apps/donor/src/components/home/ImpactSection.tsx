import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@workspace/ui';

interface ImpactSectionProps {
  statistics: any;
  loading: boolean;
  pointsBalance?: number; // Para usarmos no futuro com o seu sistema de pontos
}

export const ImpactSection = ({
  statistics,
  loading,
  pointsBalance = 0,
}: ImpactSectionProps) => {
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Soma todos os kg de materiais reciclados
  const totalKg =
    statistics?.materialTotals?.reduce(
      (acc: number, curr: any) => acc + curr.totalKg,
      0,
    ) || 0;

  const impactData = [
    {
      label: 'Material Reciclado',
      value: `${totalKg.toFixed(1)} kg`,
      icon: 'package-variant-closed',
      color: colors.primary,
      bg: 'rgba(76, 175, 80, 0.15)', // Verde clarinho
    },
    {
      label: 'Pontos Ganhos',
      value: pointsBalance.toLocaleString('pt-BR'),
      icon: 'star-four-points-circle-outline',
      color: '#d97706', // Dourado
      bg: 'rgba(245, 158, 11, 0.15)', // Laranja clarinho
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Impacto</Text>
      <View style={styles.grid}>
        {impactData.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={22}
                color={item.color}
              />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 30 },
  centered: { alignItems: 'center', justifyContent: 'center', height: 100 },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: { fontSize: 22, fontWeight: 'bold', color: colors.text },
});
