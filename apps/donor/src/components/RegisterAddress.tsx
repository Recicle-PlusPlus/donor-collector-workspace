import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
} from 'react-native';
import { supabase } from '@workspace/db';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import {
  colors,
  Loading,
  InputIcon,
  InputIconMask,
  ButtonDefault,
} from '@workspace/ui';

interface RegisterAddressProps {
  addressToEdit: any;
  closeFunc: () => void;
  onSaveCallback: (isEditing: boolean) => void;
}

export const RegisterAddress = ({
  addressToEdit,
  closeFunc,
  onSaveCallback,
}: RegisterAddressProps) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [num, setNum] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');

  const [head, setHead] = useState('Cadastro de Endereço');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = !!(addressToEdit && addressToEdit.id);

  useEffect(() => {
    if (isEditing) {
      setTitle(addressToEdit.title || '');
      setCep(addressToEdit.cep || '');
      setStreet(addressToEdit.street || '');
      setNum(addressToEdit.num || '');
      setNeighborhood(addressToEdit.neighborhood || '');
      setCity(addressToEdit.city || '');
      setState(addressToEdit.state || '');
      setComplement(addressToEdit.complement || '');
      setHead('Edição de Endereço');
    } else {
      setHead('Cadastro de Endereço');
    }
  }, [addressToEdit, isEditing]);

  function validation() {
    if (!title || !street || !num || !state || !city || !cep) {
      setErrorMsg('Preencha todos os campos obrigatórios (*)');
      return false;
    }
    if (cep.replace(/[^0-9]/g, '').length !== 8) {
      setErrorMsg('CEP inválido');
      return false;
    }
    setErrorMsg('');
    return true;
  }

  // Busca os dados do ViaCEP
  function getCepInf() {
    const nCep = cep.replace(/[^0-9]/gi, '');
    if (nCep.length !== 8) return;

    fetch(`https://viacep.com.br/ws/${nCep}/json/`)
      .then(response => response.json())
      .then(data => {
        if (!data.erro) {
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setStreet(data.logradouro || '');
          setState(data.uf || '');
        }
      })
      .catch(() => console.log('Erro ao buscar CEP'));
  }

  async function confirmPressed() {
    if (!validation()) return;
    if (!user) return;

    setLoading(true);
    try {
      const addressData = {
        title: title.trim(),
        cep: cep.replace(/[^0-9]/g, ''),
        street: street.trim(),
        num: num.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        complement: complement.trim(),
        user_id: user.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', addressToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('addresses').insert(addressData);
        if (error) throw error;
      }

      onSaveCallback(isEditing);
    } catch (err: any) {
      setErrorMsg('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.overlay}>
      {loading && <Loading />}

      {/* Clicar fora fecha o modal */}
      <TouchableOpacity
        style={styles.backgroundTouch}
        onPress={closeFunc}
        activeOpacity={1}
      />

      <View style={styles.modalContent}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{head}</Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <InputIcon
            label="Título *"
            placeholder="Ex: Casa, Trabalho"
            value={title}
            onChangeText={setTitle}
            icon="label-outline"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputIconMask
                label="CEP *"
                placeholder="00000-000"
                value={cep}
                onChangeText={setCep}
                mask="99999-999"
                keyboardType="number-pad"
                icon="map-search-outline"
                onBlur={getCepInf} // Dispara o ViaCEP ao sair do campo
              />
            </View>
            <View style={{ flex: 0.6 }}>
              <InputIcon
                label="Nº *"
                placeholder="123"
                value={num}
                onChangeText={setNum}
                icon="pound"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <InputIcon
            label="Rua *"
            placeholder="Nome da rua"
            value={street}
            onChangeText={setStreet}
            icon="road-variant"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputIcon
                label="Estado *"
                placeholder="Ex: SP"
                value={state}
                onChangeText={setState}
                icon="map-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputIcon
                label="Cidade *"
                placeholder="Sua cidade"
                value={city}
                onChangeText={setCity}
                icon="city"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputIcon
                label="Bairro"
                placeholder="Seu bairro"
                value={neighborhood}
                onChangeText={setNeighborhood}
                icon="home-group"
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputIcon
                label="Complemento"
                placeholder="Ex: Ap. 62"
                value={complement}
                onChangeText={setComplement}
                icon="home-plus-outline"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={closeFunc} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <ButtonDefault
                title="Salvar Endereço"
                color={colors.primaryLight}
                textColor={colors.textLight}
                textSize={15}
                width={0.4}
                radius={20}
                fun={confirmPressed}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escurecido estilo modal
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 15,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
