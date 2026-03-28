import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { useMarketplace, Transaction } from './hooks/useMarketplace';

export const ExtractScreen = ({ userId }: { userId: string }) => {
  const navigation = useNavigation();
  const { transactions, loading } = useMarketplace(userId);

  // Agrupa as transações pelo campo "month" para criar as seções (Ex: "Março 2026")
  const groupedTransactions = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (!acc[tx.month]) acc[tx.month] = [];
        acc[tx.month].push(tx);
        return acc;
      },
      {} as Record<string, Transaction[]>,
    );
  }, [transactions]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER DE NAVEGAÇÃO */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Extrato</Text>
        <View style={{ width: 40 }} /* Espaçador para centralizar o título */ />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="text-box-search-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Seu extrato está vazio.</Text>
            <Text style={styles.emptySubtext}>
              Conclua coletas para ganhar pontos!
            </Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([month, txs]) => (
            <View key={month} style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>

              <View style={styles.transactionsList}>
                {txs.map(tx => {
                  const isGain = tx.type === 'earned';
                  return (
                    <View key={tx.id} style={styles.txCard}>
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: isGain
                              ? 'rgba(76, 175, 80, 0.1)'
                              : '#f0f0f0',
                          },
                        ]}>
                        <MaterialCommunityIcons
                          name={isGain ? 'leaf' : 'shopping-outline'}
                          size={20}
                          color={isGain ? colors.primary : colors.textSecondary}
                        />
                      </View>

                      <View style={styles.txInfo}>
                        <Text style={styles.txTitle} numberOfLines={1}>
                          {tx.title}
                        </Text>
                        <Text style={styles.txDate}>{tx.date}</Text>
                      </View>

                      <Text
                        style={[
                          styles.txPoints,
                          {
                            color: isGain
                              ? colors.primary
                              : colors.error || '#d32f2f',
                          },
                        ]}>
                        {isGain ? '+' : '−'} {tx.points.toLocaleString('pt-BR')}{' '}
                        pts
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: colors.surface || '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  scrollContent: { padding: 20, paddingBottom: 40 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
  },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 5 },
  monthSection: { marginBottom: 25 },
  monthTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 5,
  },
  transactionsList: { gap: 10 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface || '#FFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: { flex: 1, marginRight: 10 },
  txTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  txDate: { fontSize: 11, color: colors.textSecondary },
  txPoints: { fontSize: 14, fontWeight: 'bold' },
});
