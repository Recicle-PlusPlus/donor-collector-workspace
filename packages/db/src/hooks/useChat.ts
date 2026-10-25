import { useCallback, useState } from 'react';
import { supabase } from '../client';
import { useFocusEffect } from '@react-navigation/native';

export interface Message {
  id: string;
  donation_id: string;
  sender_id: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

export function useChat(donationId: string, myUserId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const markAsRead = async (msgs: Message[]) => {
    if (!myUserId) return;

    const unreadIds = msgs
      .filter(m => m.sender_id !== myUserId && m.status !== 'read')
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .in('id', unreadIds);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!donationId || !myUserId) return;

      let channel: ReturnType<typeof supabase.channel>;

      const setupRealtime = async () => {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('donation_id', donationId)
          .order('created_at', { ascending: false });

        if (data) {
          setMessages(data);
          markAsRead(data);
        }
        
        setLoading(false);

        channel = supabase
          .channel(`chat_${donationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `donation_id=eq.${donationId}`,
            },
            payload => {
              const newMessage = payload.new as Message;
              setMessages(prev => [newMessage, ...prev]);

              if (newMessage.sender_id !== myUserId) {
                markAsRead([newMessage]);
              }
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `donation_id=eq.${donationId}`,
            },
            payload => {
              const updatedMessage = payload.new as Message;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === updatedMessage.id ? updatedMessage : msg,
                ),
              );
            },
          )
          .subscribe();
      };

      setupRealtime();

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }, [donationId, myUserId])
  );

  const sendMessage = async (content: string) => {
    if (!content.trim() || !myUserId) return;

    const { error } = await supabase.from('messages').insert({
      donation_id: donationId,
      sender_id: myUserId,
      content: content.trim(),
      status: 'sent',
    });

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  return { messages, sendMessage, loading };
}
