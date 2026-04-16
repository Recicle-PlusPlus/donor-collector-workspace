import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@workspace/db';

export interface UserProfile {
  name: string;
  photo_url: string | null;
  account_status: 'pending' | 'active' | 'blocked';
}

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    console.log('[DEBUG] 3. fetchProfile iniciado para o ID:', userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, photo_url, account_status')
        .eq('id', userId)
        .single();

      console.log(
        '[DEBUG] 4. Retorno do Supabase em fetchProfile. Tem erro?',
        !!error,
      );

      if (data && !error) {
        setProfile({
          name: data.name,
          photo_url: data.photo_url,
          account_status: data.account_status,
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[DEBUG] ERRO CATCH no fetchProfile:', err);
      setProfile(null);
    }
    console.log('[DEBUG] 5. fetchProfile finalizado.');
  };

  useEffect(() => {
    console.log(
      '[DEBUG] 1. AuthContext useEffect montado. Buscando sessão inicial...',
    );

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        setIsLoading(false);
      })
      .catch(erro => {
        console.log('[DEBUG] erro de inicialização');

        setIsLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[DEBUG] 7. onAuthStateChange disparado. Evento: ${event}`);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[DEBUG] 8. Buscando perfil via onAuthStateChange...');
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        console.log(
          '[DEBUG] 9. setando isLoading para FALSE (via onAuthStateChange)',
        );
        setIsLoading(false);
      },
    );

    return () => {
      console.log('[DEBUG] 10. Limpando listener de auth');
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
