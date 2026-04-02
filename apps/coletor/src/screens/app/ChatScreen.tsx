import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

import { supabase, useChat } from '@workspace/db';
import { colors, ChatHeader, ChatBubble, ChatInput } from '@workspace/ui';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';

export function ChatScreen() {
  const [hasKeyboardOpened, setHasKeyboardOpened] = useState(false);

  const route = useRoute<any>();
  const navigation = useNavigation();
  const { donationId } = route.params;
  const { user } = useAuth();

  const insets = useSafeAreaInsets();
  const {
    messages,
    sendMessage,
    loading: chatLoading,
  } = useChat(donationId, user?.id);

  const [otherPerson, setOtherPerson] = useState({
    name: 'Carregando...',
    photoUrl: null,
  });
  const [isChatDisabled, setIsChatDisabled] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(true);

  // Montar o cabeçalho e checar o status da doação
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

        const collector = Array.isArray(data.collector)
          ? data.collector[0]
          : data.collector;
        const donor = Array.isArray(data.donor) ? data.donor[0] : data.donor;

        // Se eu sou o doador, mostro os dados do coletor. E vice-versa.
        if (user.id === data.donor_id && collector) {
          setOtherPerson({
            name: collector.name,
            photoUrl: collector.photo_url,
          });
        } else if (user.id === data.collector_id && donor) {
          setOtherPerson({ name: donor.name, photoUrl: donor.photo_url });
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

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior="height">
        <ChatHeader
          name={otherPerson.name}
          photoUrl={otherPerson.photoUrl}
          onBack={() => navigation.goBack()}
        />

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
            backgroundColor: '#E5DDD5',
          }}>
          <ChatInput onSend={sendMessage} disabled={isChatDisabled} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E5DDD5',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: { paddingVertical: 10 },
});
