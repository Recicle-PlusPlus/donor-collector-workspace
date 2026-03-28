import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@workspace/db';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { useMarketplace, MarketplaceProduct } from './hooks/useMarketplace';

import { ProductCard } from './components/ProductCard';
import { SuccessModal } from './components/SuccessModal';
import { ExpirationSheet } from './components/ExpirationSheet';

export const MarketplaceScreen = ({ userId }: { userId: string }) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { products, balance, lots, loading, refetch } = useMarketplace(userId);
  const [redeeming, setRedeeming] = useState(false);
  const [expirationOpen, setExpirationOpen] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    productName: string;
    code: string;
  }>({
    open: false,
    productName: '',
    code: '',
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const rand = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    return `ECO-${rand}`;
  };

  // Processa a compra no banco de dados
  const executeRedemption = async (product: MarketplaceProduct) => {
    setRedeeming(true);
    const newCode = generateCode();

    try {
      const { error } = await supabase.rpc('redeem_marketplace_product', {
        p_user_id: userId,
        p_product_id: product.id,
        p_generated_code: newCode,
      });

      if (error) throw error;

      await refetch();

      // Modal de sucesso
      setModal({ open: true, productName: product.name, code: newCode });
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        'Ops!',
        'Ocorreu um erro ao processar seu resgate. Tente novamente.',
      );
    } finally {
      setRedeeming(false);
    }
  };

  // Confirmação antes de comprar
  const handleRedeemClick = (product: MarketplaceProduct) => {
    if (balance < product.price_points) return;

    Alert.alert(
      'Confirmar Resgate',
      `Deseja usar ${product.price_points.toLocaleString('pt-BR')} pontos para resgatar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, resgatar',
          style: 'default',
          onPress: () => executeRedemption(product),
        },
      ],
    );
  };

  if (loading || redeeming) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER DA CARTEIRA */}
      <View style={styles.header}>
        <View style={styles.banner}>
          <View style={styles.bannerRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name="leaf"
                size={28}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={styles.bannerLabel}>Seu Saldo</Text>
              <Text style={styles.bannerValue}>
                {balance.toLocaleString('pt-BR')}{' '}
                <Text style={styles.bannerValueSmall}>pts</Text>
              </Text>
            </View>
          </View>

          {/* BOTÕES DO BANNER */}
          <View style={styles.bannerActions}>
            <TouchableOpacity
              style={styles.valityBtn}
              onPress={() => setExpirationOpen(true)}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={14}
                color="#FFF"
              />
              <Text style={styles.valityText}>Ver validade dos pontos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.extratoBtn}
              onPress={() => navigation.navigate('Extrato')}>
              <Text style={styles.extratoText}>Ver Extrato</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* GRID DE PRODUTOS */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Produtos disponíveis</Text>

        <View style={styles.grid}>
          {products.map(product => (
            <ProductCard
              key={product.id}
              image_url={product.image_url}
              name={product.name}
              price={product.price_points}
              userBalance={balance}
              onRedeem={() => handleRedeemClick(product)}
            />
          ))}
        </View>
      </ScrollView>

      {/* MODAL DE VENCIMENTOS */}
      <ExpirationSheet
        open={expirationOpen}
        onClose={() => setExpirationOpen(false)}
        lots={lots}
      />

      {/* MODAL DE SUCESSO */}
      <SuccessModal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        productName={modal.productName}
        code={modal.code}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 40, backgroundColor: colors.background },
  banner: {
    backgroundColor: colors.primaryDark || '#1e7b4b',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    elevation: 5,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  bannerValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  bannerValueSmall: { fontSize: 18, fontWeight: '600' },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  valityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  valityText: { color: '#FFF', fontSize: 12 },
  extratoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  extratoText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
