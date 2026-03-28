import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@workspace/db';

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_points: number;
}

export interface PointLot {
  points: number;
  expiresAt: string;
}

export interface Transaction {
  id: string;
  type: 'earned' | 'spent';
  title: string;
  date: string;
  month: string;
  points: number;
}

export function useMarketplace(userId: string | undefined) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [lots, setLots] = useState<PointLot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [productsRes, balanceRes, lotsRes, historyRes] = await Promise.all([
        supabase
          .from('marketplace_products')
          .select('*')
          .eq('is_active', true)
          .order('price_points', { ascending: true }),
        supabase
          .from('user_points_balance')
          .select('total_points')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase.from('user_expiring_points').select('*').eq('user_id', userId),
        supabase.from('user_points_history').select('*').eq('user_id', userId),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (balanceRes.error) throw balanceRes.error;
      if (lotsRes.error) throw lotsRes.error;
      if (historyRes.error) throw historyRes.error;

      setProducts(productsRes.data || []);
      setBalance(balanceRes.data?.total_points || 0);

      // Formata os Lotes de Vencimento
      setLots(
        (lotsRes.data || []).map(lot => ({
          points: lot.points_expiring,
          expiresAt: new Date(lot.expires_at).toLocaleDateString('pt-BR'),
        })),
      );

      // Formata o Extrato
      setTransactions(
        (historyRes.data || []).map(tx => {
          const d = new Date(tx.created_at);
          const monthName = d.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          });
          return {
            id: tx.id,
            type: tx.transaction_type,
            title: tx.title,
            date: d.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Ex: "Março de 2026"
            points: tx.points,
          };
        }),
      );
    } catch (err: any) {
      console.error('Erro ao carregar marketplace:', err);
      setError('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, balance, lots, transactions, loading, refetch: fetchData };
}
