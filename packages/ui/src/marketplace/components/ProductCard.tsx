import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { colors } from '../../theme/colors';

interface ProductCardProps {
  image_url: string;
  name: string;
  price: number;
  userBalance: number;
  onRedeem: () => void;
}

export const ProductCard = ({
  image_url,
  name,
  price,
  userBalance,
  onRedeem,
}: ProductCardProps) => {
  const canAfford = userBalance >= price;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.price}>{price.toLocaleString('pt-BR')} pts</Text>

        <Button
          mode="contained"
          onPress={onRedeem}
          disabled={!canAfford}
          style={[styles.button, !canAfford && styles.buttonDisabled]}
          buttonColor={colors.primary}
          textColor="#FFF"
          labelStyle={styles.buttonText}>
          {canAfford ? 'Resgatar' : 'Saldo Insuficiente'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
  },
  imageContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  image: { width: '100%', height: '100%', borderRadius: 8 },
  content: { padding: 12, flex: 1, justifyContent: 'space-between' },
  name: { fontSize: 13, fontWeight: '500', color: '#333', marginBottom: 5 },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  button: { borderRadius: 10, paddingVertical: 2 },
  buttonDisabled: { backgroundColor: '#ddd' },
  buttonText: { fontSize: 11, fontWeight: 'bold' },
});
