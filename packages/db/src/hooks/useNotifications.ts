import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../client';
import { useAuth } from '../contexts/AuthContext';

export type NotificationType = 'donation_accepted' | 'new_message';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const fetchNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          setNotifications(data);
        }
        setLoading(false);
      };

      fetchNotifications();

      return () => {};
    }, [user])
  );

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  return { notifications, loading, markAsRead };
}
