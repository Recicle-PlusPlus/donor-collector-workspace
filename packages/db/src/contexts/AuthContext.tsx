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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, photo_url, account_status')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(
          `[AuthContext - ERROR] Falha no banco ao buscar perfil (${userId}):`,
          error.message,
          error.details,
        );
        setProfile(null);
        return;
      }

      if (!data) {
        console.warn(
          `[AuthContext - WARN] Usuário autenticado, mas nenhum perfil encontrado na tabela 'users' para o ID: ${userId}`,
        );
        setProfile(null);
        return;
      }

      setProfile({
        name: data.name,
        photo_url: data.photo_url,
        account_status: data.account_status,
      });
    } catch (err: any) {
      console.error(
        '[AuthContext - FATAL] Exceção não tratada ao buscar perfil:',
        err.message || err,
      );
      setProfile(null);
    }
  };

  useEffect(() => {
    let montado = true;

    const fallbackTimeout = setTimeout(() => {
      if (montado) {
        console.warn(
          '[AuthContext - TIMEOUT] A inicialização demorou muito. Forçando destravamento da tela para evitar congelamento.',
        );
        setIsLoading(false);
      }
    }, 5000);

    const carregarSessaoInicial = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            '[AuthContext - ERROR] Falha ao ler a sessão local no getSession:',
            error.message,
          );
        }

        if (montado) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (err: any) {
        console.error(
          '[AuthContext - FATAL] Erro catastrófico no carregamento da sessão. Verifique AsyncStorage/Polyfills:',
          err.message || err,
        );
      } finally {
        if (montado) {
          clearTimeout(fallbackTimeout);
          setIsLoading(false);
        }
      }
    };

    carregarSessaoInicial();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED')
          console.log('[AuthContext - INFO] Token JWT renovado com sucesso.');

        if (event === 'INITIAL_SESSION') return;

        if (montado) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          setIsLoading(false);
        }
      },
    );

    return () => {
      montado = false;
      clearTimeout(fallbackTimeout);
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
