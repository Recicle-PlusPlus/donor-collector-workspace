import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RadioButton, Button, List } from 'react-native-paper';

import { supabase } from '@workspace/db';
import { colors } from '@workspace/ui';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DonationStep1'
>;

export function DonationStep1() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [materialsList, setMaterialsList] = useState<any[]>([]);

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [weight, setWeight] = useState('');

  // Busca os endereços do usuário e os materiais
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);
      if (addressData) setAddresses(addressData);

      const { data: materialData } = await supabase
        .from('materials')
        .select('*')
        .eq('active', true);
      if (materialData) setAllMaterials(materialData);
    }
    fetchData();
  }, [user]);

  const handleSaveMaterial = () => {
    if (selectedMaterial && weight) {
      // Verifica se já existe e atualiza, senão adiciona novo
      const existingIndex = materialsList.findIndex(
        m => m.materialId === selectedMaterial.id,
      );
      let newList = [...materialsList];

      if (existingIndex >= 0) {
        newList[existingIndex].weight = parseFloat(weight);
      } else {
        newList.push({
          materialId: selectedMaterial.id,
          materialName: selectedMaterial.name,
          weight: parseFloat(weight),
        });
      }

      setMaterialsList(newList);
      setModalVisible(false);
      setSelectedMaterial(null);
      setWeight('');
    }
  };

  const handleRemoveMaterial = (materialId: string) => {
    setMaterialsList(prev => prev.filter(m => m.materialId !== materialId));
  };

  const handleNextStep = () => {
    const selectedAddressObj = addresses.find(a => a.id === selectedAddressId);
    // Passa o bastão para a Etapa 2!
    navigation.navigate('DonationStep2', {
      address: selectedAddressObj,
      materials: materialsList,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onde será a coleta?</Text>
      {addresses.length === 0 ? (
        <Text style={styles.emptyText}>
          Nenhum endereço cadastrado no seu perfil.
        </Text>
      ) : (
        <RadioButton.Group
          onValueChange={setSelectedAddressId}
          value={selectedAddressId}>
          {addresses.map(addr => (
            <View key={addr.id} style={styles.radioItem}>
              <RadioButton value={addr.id} color={colors.primary} />
              <Text
                style={
                  styles.radioLabel
                }>{`${addr.street}, ${addr.num} - ${addr.neighborhood}`}</Text>
            </View>
          ))}
        </RadioButton.Group>
      )}

      <Text style={styles.title}>O que você quer doar?</Text>
      <FlatList
        data={materialsList}
        keyExtractor={item => item.materialId}
        renderItem={({ item }) => (
          <List.Item
            title={`${item.materialName}`}
            description={`${item.weight} kg`}
            titleStyle={{ color: colors.text, fontWeight: 'bold' }}
            descriptionStyle={{ color: colors.textSecondary, fontSize: 14 }}
            right={() => (
              <TouchableOpacity
                onPress={() => handleRemoveMaterial(item.materialId)}
                style={{ justifyContent: 'center' }}>
                <List.Icon icon="delete" color={colors.error} />
              </TouchableOpacity>
            )}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum material adicionado.</Text>
        }
      />

      <Button
        icon="plus"
        mode="contained"
        onPress={() => setModalVisible(true)}
        buttonColor={colors.primary}
        textColor={colors.textLight}>
        Adicionar Material
      </Button>

      <Button
        style={styles.navButton}
        mode="contained"
        onPress={handleNextStep}
        disabled={!selectedAddressId || materialsList.length === 0}
        buttonColor={colors.primaryDark}
        textColor={colors.textLight}>
        Avançar
      </Button>

      {/* MODAL */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Adicionar Material</Text>
            {allMaterials.map(mat => (
              <TouchableOpacity
                key={mat.id}
                onPress={() => setSelectedMaterial(mat)}
                style={
                  selectedMaterial?.id === mat.id
                    ? styles.selectedMaterial
                    : styles.materialItem
                }>
                <Text
                  style={{
                    color:
                      selectedMaterial?.id === mat.id
                        ? colors.primaryDark
                        : colors.text,
                  }}>
                  {mat.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.input}
              placeholder="Peso estimado (kg)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
            <Button onPress={handleSaveMaterial} textColor={colors.primary}>
              Salvar
            </Button>
            <Button
              onPress={() => setModalVisible(false)}
              textColor={colors.textSecondary}>
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: colors.primaryDark,
  },
  radioItem: { flexDirection: 'row', alignItems: 'center' },
  radioLabel: { flex: 1, color: colors.text },
  navButton: { marginTop: 20, marginBottom: 20 },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  materialItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedMaterial: {
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 10,
  },
});
