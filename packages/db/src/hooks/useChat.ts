import { useEffect, useState } from 'react';
import { supabase } from '../client';

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

  // Função interna para marcar mensagens recebidas como lidas
  const markAsRead = async (msgs: Message[]) => {
    if (!myUserId) return;

    // Filtra mensagens que não são minhas e que ainda não estão 'read'
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

  useEffect(() => {
    if (!donationId || !myUserId) return;

    // 1. Busca inicial do histórico de mensagens
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('donation_id', donationId)
        .order('created_at', { ascending: false }); // Falso para listar as mais novas embaixo (Inverted FlatList)

      if (data) {
        setMessages(data);
        markAsRead(data); // Ao abrir a tela, já marca as pendentes como lidas
      }
      setLoading(false);
    };

    fetchMessages();

    // 2. Inscrever-se nos WebSockets (Realtime)
    const channel = supabase
      .channel(`chat_${donationId}`)
      // Escuta NOVAS mensagens
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
          // Adiciona a nova mensagem no topo do array
          setMessages((prev: Message[]) => [newMessage, ...prev]);

          // Se recebi uma mensagem com a tela aberta, já aviso o banco que li
          if (newMessage.sender_id !== myUserId) {
            markAsRead([newMessage]);
          }
        },
      )
      // Escuta ATUALIZAÇÕES (Ex: a outra pessoa leu a minha mensagem)
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
          // Atualiza o status da mensagem específica no array (para mudar a cor do tique)
          setMessages((prev: Message[]) =>
            prev.map((msg: Message) =>
              msg.id === updatedMessage.id ? updatedMessage : msg,
            ),
          );
        },
      )
      .subscribe();

    // Limpeza ao sair da tela
    return () => {
      supabase.removeChannel(channel);
    };
  }, [donationId, myUserId]);

  // Função exportada para a tela enviar uma nova mensagem
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
