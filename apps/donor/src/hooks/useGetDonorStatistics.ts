import { useState, useEffect } from 'react';
import { supabase } from '@workspace/db';

interface MaterialTotal {
  name: string;
  totalKg: number;
}

interface DynamicStatistic {
  collectionsCompleted: number;
  materialTotals: MaterialTotal[];
}

interface Output {
  statistics: DynamicStatistic | null;
  loading: boolean;
  error: Error | null;
}

export function useGetDonorStatistics(donorId?: string): Output {
  const [statistics, setStatistics] = useState<DynamicStatistic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!donorId) {
      setLoading(false);
      return;
    }

    async function fetchStatistics() {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'get_donor_statistics',
        {
          p_donor_id: donorId,
        },
      );

      if (rpcError) {
        console.error('Erro ao buscar estatísticas dinâmicas:', rpcError);
        setError(rpcError);
        setStatistics(null);
      } else {
        setStatistics(data as DynamicStatistic);
      }
      setLoading(false);
    }

    fetchStatistics();
  }, [donorId]);

  return { statistics, loading, error };
}
