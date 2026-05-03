import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
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

    // Listener
    const subscription = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // ouve INSERTs e UPDATEs
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [
              payload.new as NotificationItem,
              ...prev,
            ]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n =>
                n.id === payload.new.id ? (payload.new as NotificationItem) : n,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  return { notifications, loading, markAsRead };
}
