import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@workspace/ui';

interface AddressCardProps {
  address: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const AddressCard = ({
  address,
  onEdit,
  onDelete,
}: AddressCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="map-marker-radius"
          size={28}
          color={colors.primary}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>
          {address.street}, {address.num}
        </Text>
        <Text style={styles.subtitle}>
          {address.neighborhood} - {address.city}
        </Text>
        {address.complement ? (
          <Text style={styles.complement}>{address.complement}</Text>
        ) : null}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={22}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={22}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  iconContainer: {
    marginRight: 16,
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 50,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  complement: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});
