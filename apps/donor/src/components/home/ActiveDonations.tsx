import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@workspace/ui';
import { DonationCard } from '@workspace/ui/src/components/DonationCard';

export const ActiveDonations = ({
  donations,
  loading,
}: {
  donations: any[];
  loading: boolean;
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doações Ativas</Text>

      <View style={styles.list}>
        {donations.length === 0 ? (
          <Text style={styles.emptyText}>
            Você não tem doações em andamento no momento.
          </Text>
        ) : (
          donations.map(d => (
            <DonationCard
              key={d.id}
              donation={d}
              onPress={() =>
                navigation.navigate('DonationDetails', { donationId: d.id })
              }
            />
          ))
        )}
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
  list: { gap: 12 },
  emptyText: { color: colors.textSecondary, fontStyle: 'italic' },
});
