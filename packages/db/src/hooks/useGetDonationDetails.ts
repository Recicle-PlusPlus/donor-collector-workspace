import { useEffect, useState } from 'react';
import { supabase } from '../client';

export function useGetDonationDetails(donationId: string) {
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!donationId) {
      setDonation(null);
      setError(null);
      setLoading(false);
      return;
    }

    async function fetchDetails() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('donations')
        .select(
          `
          id, status, created_at, accepted_at, completed_at, notes,
          donor_id, collector_id, donor_reviewed, collector_reviewed,
          address:addresses ( street, num, neighborhood, city, state, cep, complement ),
          donor:users!donor_id ( id, name, photo_url, phone ),
          collector:users!collector_id ( id, name, photo_url, phone ),
          items:donation_items ( weight_kg, material:materials ( name ) ),
          schedules:donation_schedules ( day_of_week, start_time, end_time )
        `,
        )
        .eq('id', donationId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar detalhes da doação:', fetchError);
        setDonation(null);
        setError(fetchError);
      } else {
        setDonation(data);
      }

      setLoading(false);
    }

    fetchDetails();
  }, [donationId]);

  return { donation, loading, error };
}
