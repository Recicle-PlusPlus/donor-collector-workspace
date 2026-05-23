import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../client';
import { usePushNotifications } from '../hooks/usePushNotifications';

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
  signInWithPassword: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signInWithPassword: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { expoPushToken, saveTokenToDatabase } = usePushNotifications();
  useEffect(() => {
    if (user?.id && expoPushToken) {
      saveTokenToDatabase(user.id, expoPushToken);
    }
  }, [user?.id, expoPushToken]);

  const fetchProfile = useCallback(async (userId: string) => {
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
        return null;
      }

      if (!data) {
        console.warn(
          `[AuthContext - WARN] Usuário autenticado, mas nenhum perfil encontrado na tabela 'users' para o ID: ${userId}`,
        );
        return null;
      }

      return {
        name: data.name,
        photo_url: data.photo_url,
        account_status: data.account_status,
      };
    } catch (err: any) {
      console.error(
        '[AuthContext - FATAL] Exceção não tratada ao buscar perfil:',
        err.message || err,
      );
      return null;
    }
  }, []);

  const syncSessionState = useCallback(
    (nextSession: Session | null, source: string, nextUser?: User | null) => {
      console.log(
        `[AuthContext] Aplicando sessão via ${source}. Autenticado: ${Boolean(
          nextUser ?? nextSession?.user,
        )}`,
      );

      setSession(nextSession);
      setProfile(null);
      setUser(nextUser ?? nextSession?.user ?? null);
      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    let active = true;

    if (!user?.id) {
      setProfile(null);
      return;
    }

    console.log(`[AuthContext] Buscando perfil para ${user.id}.`);

    const carregarPerfil = async () => {
      const nextProfile = await fetchProfile(user.id);

      if (!active) {
        return;
      }

      setProfile(nextProfile);
    };

    void carregarPerfil();

    return () => {
      active = false;
    };
  }, [fetchProfile, user?.id]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      console.log('[AuthContext][Login] Iniciando signInWithPassword.');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log(
          '[AuthContext][Login] Falha ao autenticar no Supabase:',
          error.message,
        );
        throw error;
      }

      console.log(
        `[AuthContext][Login] Login bem-sucedido. Sessao imediata: ${Boolean(
          data.session,
        )}, usuario: ${data.user?.id ?? 'sem-id'}`,
      );

      syncSessionState(
        data.session ?? null,
        'login',
        data.user ?? data.session?.user ?? null,
      );
    },
    [syncSessionState],
  );

  useEffect(() => {
    let montado = true;

    const carregarSessaoInicial = async () => {
      try {
        console.log('[AuthContext] Carregando sessao inicial.');
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
          syncSessionState(session, 'getSession', session?.user ?? null);
        }
      } catch (err: any) {
        console.error(
          '[AuthContext - FATAL] Erro catastrófico no carregamento da sessão. Verifique AsyncStorage/Polyfills:',
          err.message || err,
        );
      } finally {
        if (montado) {
          setIsLoading(false);
        }
      }
    };

    carregarSessaoInicial();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(
          `[AuthContext] onAuthStateChange disparado: ${event}. Usuario: ${session?.user?.id ?? 'null'}`,
        );

        if (event === 'TOKEN_REFRESHED')
          console.log('[AuthContext - INFO] Token JWT renovado com sucesso.');

        if (event === 'INITIAL_SESSION') return;

        if (montado) syncSessionState(session, event, session?.user ?? null);
      },
    );

    return () => {
      montado = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signInWithPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
