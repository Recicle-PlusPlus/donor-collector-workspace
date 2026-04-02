import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Snackbar } from 'react-native-paper';

import { supabase } from '@workspace/db';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';

import { AddressCard } from '../../components/AdrressCard';
import { RegisterAddress } from '../../components/RegisterAddress';

import {
  colors,
  Loading,
  InputIcon,
  InputIconMask,
  ButtonDefault,
} from '@workspace/ui';

export function Profile() {
  const { user } = useAuth();

  const [editProf, setEditProf] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [register, setRegister] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<any>(null);

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    isError: false,
  });

  // Carrega os dados do user
  useEffect(() => {
    async function loadFreshData() {
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('users')
        .select('name, phone, photo_url')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setName(profileData.name || '');
        setPhone(profileData.phone || '');
        setPhotoUrl(profileData.photo_url || null);
      }

      fetchAddresses();
    }

    loadFreshData();
  }, [user]);

  async function fetchAddresses() {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id);
    if (data) setAddresses(data);
  }

  const showSnackbar = (message: string, isError = false) => {
    setSnackbar({ visible: true, message, isError });
  };

  // --- FUNÇÕES DE IMAGEM ---
  async function changeProfileImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled || !user) return;

    setLoading(true);
    try {
      const asset = result.assets[0];
      const fileExt = asset.uri.split('.').pop();
      const filePath = `${user.id}/profile.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: `photo.${fileExt}`,
        type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      } as any);

      // Aviso: Certifique-se que o bucket 'avatars' existe e é público no painel do Supabase!
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;

      // Atualiza a tabela users
      await supabase
        .from('users')
        .update({ photo_url: publicUrl })
        .eq('id', user.id);

      // Atualiza a sessão do Auth para manter sincronizado
      await supabase.auth.updateUser({ data: { photo_url: publicUrl } });

      setPhotoUrl(publicUrl);
      showSnackbar('Imagem de perfil atualizada!');
    } catch (err: any) {
      showSnackbar('Erro ao subir imagem: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÕES DE PERFIL ---
  async function confirmChanges() {
    if (!name || !phone) {
      showSnackbar('Preencha todos os campos', true);
      return;
    }

    setLoading(true);
    try {
      await supabase.from('users').update({ name, phone }).eq('id', user?.id);
      await supabase.auth.updateUser({ data: { name, phone } });

      showSnackbar('Perfil atualizado com sucesso!');
      setEditProf(false);
    } catch (err: any) {
      showSnackbar(err.message, true);
    } finally {
      setLoading(false);
    }
  }

  async function signout() {
    await supabase.auth.signOut();
  }

  // --- FUNÇÕES DE ENDEREÇO ---
  function openAddressModal(addr = null) {
    setAddressToEdit(addr);
    setRegister(true);
  }

  async function removeAddress(addressId: string) {
    setLoading(true);
    try {
      await supabase.from('addresses').delete().eq('id', addressId);
      setAddresses(prev => prev.filter(a => a.id !== addressId));
      showSnackbar('Endereço removido com sucesso!');
    } catch (err: any) {
      showSnackbar('Erro ao remover: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  }

  function handleAddressSaved(isEditing: boolean) {
    setRegister(false); // Fecha o modal
    fetchAddresses(); // Busca os endereços atualizados do banco
    showSnackbar(
      isEditing
        ? 'Endereço alterado com sucesso!'
        : 'Endereço adicionado com sucesso!',
    );
  }

  return (
    <View style={styles.container}>
      {loading && <Loading />}

      {register && (
        <RegisterAddress
          addressToEdit={addressToEdit}
          closeFunc={() => setRegister(false)}
          onSaveCallback={handleAddressSaved}
        />
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={signout} style={styles.logoutBtn}>
            <MaterialCommunityIcons
              name="exit-to-app"
              size={24}
              color={colors.textLight}
            />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* FOTO E NOME */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={changeProfileImage}
            style={styles.imageWrapper}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.image} />
            ) : (
              <MaterialCommunityIcons
                name="camera"
                size={40}
                color={colors.primary}
              />
            )}
            <View style={styles.editIconBadge}>
              <MaterialCommunityIcons
                name="pencil"
                size={16}
                color={colors.textLight}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.formContainer}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            <TouchableOpacity onPress={() => setEditProf(!editProf)}>
              <MaterialCommunityIcons
                name={editProf ? 'close' : 'square-edit-outline'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={{ opacity: editProf ? 1 : 0.6 }}>
            <InputIcon
              label="Nome"
              placeholder="Digite seu nome"
              value={name}
              onChangeText={setName}
              icon="account"
              editable={editProf}
            />
            <InputIconMask
              label="Contato"
              placeholder="Digite seu contato"
              value={phone}
              onChangeText={setPhone}
              icon="cellphone"
              mask="(99) 99999-9999"
              keyboardType="number-pad"
              editable={editProf}
            />

            {editProf && (
              <View
                style={{
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 15,
                }}>
                <ButtonDefault
                  title="Confirmar"
                  color={colors.primary}
                  textColor={colors.textLight}
                  fun={confirmChanges}
                  width={0.5}
                  radius={20}
                />
              </View>
            )}
          </View>
        </View>

        {/* LISTA DE ENDEREÇOS */}
        <View style={styles.addressContainer}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Endereços</Text>
            <TouchableOpacity onPress={() => openAddressModal()}>
              <MaterialCommunityIcons
                name="plus"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum endereço cadastrado.</Text>
          ) : (
            addresses.map(address => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => openAddressModal(address)}
                onDelete={() => removeAddress(address.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{
          backgroundColor: snackbar.isError ? colors.error : colors.success,
          marginBottom: 10,
        }}>
        <Text style={{ color: '#FFFFFF' }}>{snackbar.message}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    height: 120,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logoutBtn: { flexDirection: 'row', alignItems: 'center' },
  logoutText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  profileSection: { alignItems: 'center', marginTop: -70, marginBottom: 20 },
  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: { width: '100%', height: '100%', borderRadius: 70 },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
  },
  formContainer: { paddingHorizontal: 20, marginBottom: 20 },
  addressContainer: { paddingHorizontal: 20 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primaryDark },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 10,
  },
  tempAddressCard: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
});
