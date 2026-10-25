import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  FlatList,
  ActivityIndicator,
  Keyboard,
  ImageBackground,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

import { supabase, useChat } from '@workspace/db';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { colors } from '../theme/colors';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { ReportModal } from '../components/ReportModal';

export function ChatScreen() {
  const [hasKeyboardOpened, setHasKeyboardOpened] = useState(false);

  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { donationId } = route.params;
  const { user } = useAuth();

  const insets = useSafeAreaInsets();
  const {
    messages,
    sendMessage,
    loading: chatLoading,
  } = useChat(donationId, user?.id);

  const [otherPerson, setOtherPerson] = useState({
    id: '',
    name: 'Carregando...',
    photoUrl: null,
    role: null as 'donor' | 'collector' | null,
  });
  const [isChatDisabled, setIsChatDisabled] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(true);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [donationStatus, setDonationStatus] = useState<string>('');

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setHasKeyboardOpened(true);
    });

    async function fetchDonationDetails() {
      if (!user || !donationId) return;

      const { data: rawData, error } = await supabase
        .from('donations')
        .select(
          `
          status,
          donor_id,
          collector_id,
          donor:users!donor_id(name, photo_url),
          collector:users!collector_id(name, photo_url)
        `,
        )
        .eq('id', donationId)
        .single();

      if (rawData) {
        const data = rawData as any;
        setDonationStatus(data.status);

        const collector = Array.isArray(data.collector)
          ? data.collector[0]
          : data.collector;
        const donor = Array.isArray(data.donor) ? data.donor[0] : data.donor;

        // Se eu sou o doador, mostro os dados do coletor. E vice-versa.
        if (user.id === data.donor_id && collector) {
          setOtherPerson({
            id: data.collector_id,
            name: collector.name,
            photoUrl: collector.photo_url,
            role: 'collector',
          });
        } else if (user.id === data.collector_id && donor) {
          setOtherPerson({
            id: data.donor_id,
            name: donor.name,
            photoUrl: donor.photo_url,
            role: 'donor',
          });
        }

        // O chat só permite digitação se a coleta estiver "accepted"
        if (data.status !== 'accepted') {
          setIsChatDisabled(true);
        }
      }
      setFetchingDetails(false);
    }

    fetchDonationDetails();
    return () => {
      showSubscription.remove();
    };
  }, [donationId, user]);

  const renderItem = ({ item }: { item: any }) => {
    const isMine = item.sender_id === user?.id;
    const time = new Date(item.created_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <ChatBubble
        text={item.content}
        isMine={isMine}
        time={time}
        status={item.status}
      />
    );
  };

  if (fetchingDetails || chatLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const submitReport = async (reason: string) => {
    if (!user?.id || !otherPerson.id) return;
    setIsReporting(true);

    const { error } = await supabase.from('user_reports').insert({
      reporter_id: user.id,
      reported_id: otherPerson.id,
      donation_id: donationId,
      reason: reason,
    });

    setIsReporting(false);
    setReportModalVisible(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível enviar a denúncia.');
    } else {
      Alert.alert(
        'Denúncia Enviada',
        'Sua denúncia foi registrada. Você deseja também BLOQUEAR este usuário e cancelar a coleta atual?',
        [
          { text: 'Não é necessário', style: 'cancel' },
          {
            text: 'Sim, Bloquear',
            style: 'destructive',
            onPress: submitBlockOnly,
          },
        ],
      );
    }
  };

  const submitBlockOnly = async () => {
    if (!user?.id || !otherPerson.id) return;

    await supabase.from('user_blocks').insert({
      blocker_id: user.id,
      blocked_id: otherPerson.id,
    });

    if (donationStatus === 'accepted' || donationStatus === 'pending') {
      await supabase
        .from('donations')
        .update({ status: 'cancelled' })
        .eq('id', donationId);
      navigation.navigate('Main', {
        refresh: true,
        snackbarMessage: 'Usuário bloqueado e coleta cancelada.',
      });
    } else {
      navigation.navigate('Main', {
        refresh: true,
        snackbarMessage: 'Usuário bloqueado para futuras coletas.',
      });
    }
  };

  const handleOptionsPress = () => {
    Alert.alert('Opções de Segurança', 'O que deseja fazer?', [
      { text: 'Denunciar', onPress: () => setReportModalVisible(true) },
      {
        text: 'Bloquear e Cancelar Coleta',
        style: 'destructive',
        onPress: startBlockProcess,
      },
      { text: 'Voltar', style: 'cancel' },
    ]);
  };

  const startBlockProcess = () => {
    const alertMessage =
      donationStatus === 'accepted' || donationStatus === 'pending'
        ? 'A coleta atual será CANCELADA e vocês não poderão mais interagir. Tem certeza?'
        : 'Vocês não poderão mais interagir ou ver as coletas um do outro no futuro. Tem certeza?';

    Alert.alert('Bloquear Usuário', alertMessage, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, Bloquear',
        style: 'destructive',
        onPress: async () => {
          await supabase
            .from('user_blocks')
            .insert({ blocker_id: user?.id, blocked_id: otherPerson.id });

          if (donationStatus === 'accepted' || donationStatus === 'pending') {
            await supabase
              .from('donations')
              .update({ status: 'cancelled' })
              .eq('id', donationId);
          }

          Alert.alert(
            'Usuário Bloqueado',
            'O comportamento deste usuário violou nossas regras? Deseja enviar uma denúncia para a equipe?',
            [
              {
                text: 'Não',
                onPress: () => navigation.navigate('Main', { refresh: true }),
              },
              {
                text: 'Sim, Denunciar',
                onPress: () => setReportModalVisible(true),
              },
            ],
          );
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="height">
      <ChatHeader
        name={otherPerson.name}
        photoUrl={otherPerson.photoUrl}
        onBack={() => navigation.goBack()}
        onProfilePress={() => {
          if (otherPerson.id && otherPerson.role) {
            navigation.navigate('ChatUserProfile', {
              userId: otherPerson.id,
              profileRole: otherPerson.role,
            });
          }
        }}
        onOptionsPress={handleOptionsPress}
      />

      <ImageBackground
        source={require('../assets/images/background.png')}
        style={{ flex: 1 }}
        resizeMode="cover">
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        <View
          style={{
            paddingBottom: hasKeyboardOpened ? 0 : insets.bottom,
            backgroundColor: '#ffffff',
          }}>
          <ChatInput onSend={sendMessage} disabled={isChatDisabled} />
        </View>
      </ImageBackground>

      <ReportModal
        visible={reportModalVisible}
        title={`Denunciar ${otherPerson.name}`}
        subtitle="Por que você está denunciando este usuário no chat? Detalhe o ocorrido (mínimo 20 caracteres)."
        isLoading={isReporting}
        onClose={() => {
          setReportModalVisible(false);
          if (isChatDisabled) navigation.navigate('Main', { refresh: true });
        }}
        onSubmit={submitReport}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E5DDD5',
  },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: { paddingVertical: 10 },
});
