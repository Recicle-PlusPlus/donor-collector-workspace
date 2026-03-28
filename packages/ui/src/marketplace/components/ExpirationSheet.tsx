import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { PointLot } from '../hooks/useMarketplace';

interface ExpirationSheetProps {
  open: boolean;
  onClose: () => void;
  lots: PointLot[];
}

export const ExpirationSheet = ({
  open,
  onClose,
  lots,
}: ExpirationSheetProps) => (
  <Modal
    visible={open}
    transparent
    animationType="slide"
    onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.title}>Validade dos Pontos</Text>
        </View>
        <Text style={styles.description}>
          Confira quando seus lotes de pontos expiram.
        </Text>

        <View style={styles.list}>
          {lots.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum ponto a expirar no momento.
            </Text>
          ) : (
            lots.map((lot, i) => (
              <View key={i} style={styles.lotItem}>
                <Text style={styles.lotPoints}>
                  {lot.points.toLocaleString('pt-BR')} pts
                </Text>
                <Text style={styles.lotDate}>expiram em {lot.expiresAt}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.footerNote}>
          Os pontos são consumidos automaticamente do lote mais antigo para o
          mais novo.
        </Text>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  description: { color: colors.textSecondary, marginBottom: 20 },
  list: { marginBottom: 20 },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  lotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  lotPoints: { fontWeight: 'bold', color: colors.text, fontSize: 16 },
  lotDate: { color: colors.textSecondary, fontSize: 14 },
  footerNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  closeBtnText: { fontWeight: 'bold', color: colors.text },
});
