import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { Loading } from '@workspace/ui';

import { MainTabs } from './MainTabs';
import { Login } from '../screens/auth/Login';
import { Home } from '../screens/app/Home';
import { Sign } from '../screens/auth/Sign';
import { DonationDetailsScreen } from '../screens/app/DonationDetails';
import { DonationStep1 } from '../screens/app/DonationStep1';
import { DonationStep2 } from '../screens/app/DonationStep2';

// Tipagem das rotas
export type RootStackParamList = {
  Login: undefined;
  Sign: undefined;
  Main: { refresh?: boolean; snackbarMessage?: string } | undefined;
  DonationDetails: { donationId: string };
  DonationStep1: undefined;
  DonationStep2: { address: any; materials: any[] };
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
              name="DonationDetails"
              component={DonationDetailsScreen}
            />
            <Stack.Screen
              name="DonationStep1"
              component={DonationStep1}
              options={{ title: 'Nova Coleta' }}
            />
            <Stack.Screen
              name="DonationStep2"
              component={DonationStep2}
              options={{ title: 'Agendamento' }}
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
