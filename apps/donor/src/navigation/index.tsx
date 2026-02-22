import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { Loading } from '@workspace/ui';

import { Login } from '../screens/auth/Login';
import { Home } from '../screens/app/Home';
import { Sign } from '../screens/auth/Sign';
import { DonationDetailsScreen } from '../screens/app/DonationDetails';

// Tipagem das rotas
export type RootStackParamList = {
  Login: undefined;
  Sign: undefined;
  Home: { refresh?: boolean; snackbarMessage?: string } | undefined;
  DonationDetails: { donationId: string };
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
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen
              name="DonationDetails"
              component={DonationDetailsScreen}
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
