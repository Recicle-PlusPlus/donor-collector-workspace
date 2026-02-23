import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { Loading } from '@workspace/ui';

import { Login } from '../screens/auth/Login';
import { Sign } from '../screens/auth/Sign';
import { DonationAccept } from '../screens/app/DonationAccept';
import { MainTabs } from './MainTabs';
import { ChatScreen } from '../screens/app/ChatScreen';

export type RootStackParamList = {
  Login: undefined;
  Sign: undefined;
  Main: { refresh?: boolean } | undefined;
  DonationAccept: { donationId: string };
  Profile: undefined;
  Chat: { donationId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  // Contexto que está escutando o Supabase
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Carregando..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Usuário logado
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DonationAccept"
              component={DonationAccept}
              options={{ headerShown: true, title: 'Detalhes da Coleta' }}
            />
          </Stack.Group>
        ) : (
          // Usuário não logado
          <Stack.Group>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Sign" component={Sign} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
