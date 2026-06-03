import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@workspace/db';

export function useGetRecentDonations(donorId?: string) {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchDonations = useCallback(async () => {
    if (!donorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('donations')
      .select(
        `
        id,
        status,
        donor_reviewed,
        created_at,
        completed_at,
        addresses ( street, num, neighborhood ),
        collector:users!collector_id ( name ),
        donation_items ( materials ( name ) ),
        donation_schedules ( day_of_week, start_time, end_time )
      `,
      )
      .eq('donor_id', donorId)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('Erro ao buscar histórico de doações:', fetchError);
      setError(fetchError);
    } else {
      setDonations(data || []);
    }
    setLoading(false);
  }, [donorId]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  return { donations, loading, error, refetch: fetchDonations };
}
