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
import { useAuth } from '@workspace/db/src/contexts/AuthContext';

import { supabase } from '@workspace/db';
import {
  colors,
  Loading,
  InputIcon,
  InputIconMask,
  ButtonDefault,
  UserReviewsSection,
} from '@workspace/ui';

export function Profile() {
  const { user } = useAuth();

  const [editProf, setEditProf] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    isError: false,
  });

  useEffect(() => {
    async function loadFreshData() {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('users')
        .select('name, phone, photo_url, created_at')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setName(profileData.name || '');
        setPhone(profileData.phone || '');
        setPhotoUrl(profileData.photo_url || null);
        setCreatedAt(profileData.created_at || null);
      }
    }

    loadFreshData();
  }, [user]);

  const showSnackbar = (message: string, isError = false) => {
    setSnackbar({ visible: true, message, isError });
  };

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;

      await supabase
        .from('users')
        .update({ photo_url: publicUrl })
        .eq('id', user.id);
      await supabase.auth.updateUser({ data: { photo_url: publicUrl } });

      setPhotoUrl(publicUrl);
      showSnackbar('Imagem de perfil atualizada!');
    } catch (err: any) {
      showSnackbar('Erro ao subir imagem: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  }

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

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Data não disponível';

  return (
    <View style={styles.container}>
      {loading && <Loading />}

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* CABEÇALHO */}
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

        {user && (
          <View style={styles.reviewsContainer}>
            <UserReviewsSection userId={user.id} />
          </View>
        )}

        {/* FORMULÁRIO */}
        <View style={styles.formContainer}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Meus Dados</Text>
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
              label="Contato (WhatsApp)"
              placeholder="Digite seu contato"
              value={phone}
              onChangeText={setPhone}
              icon="whatsapp"
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
                  title="Salvar"
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

        <View style={styles.accountInfoContainer}>
          <MaterialCommunityIcons
            name="calendar-account"
            size={22}
            color={colors.primary}
          />
          <View>
            <Text style={styles.accountInfoLabel}>Membro desde</Text>
            <Text style={styles.accountInfoValue}>{memberSince}</Text>
          </View>
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
    bottom: 5,
    right: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 6,
  },
  formContainer: { paddingHorizontal: 20, marginBottom: 20 },
  reviewsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  accountInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 4,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  accountInfoLabel: { fontSize: 12, color: colors.textSecondary },
  accountInfoValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primaryDark },
});
