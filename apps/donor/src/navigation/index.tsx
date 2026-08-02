import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { Loading } from '@workspace/ui';
import { AccountStatusScreen } from '@workspace/ui/src/screens/AccountStatusScreen';

import { MainTabs } from './MainTabs';
import { Login } from '../screens/auth/Login';
import { Sign } from '../screens/auth/Sign';
import { DonationDetailsScreen } from '../screens/app/DonationDetails';
import { DonationStep1 } from '../screens/app/DonationStep1';
import { DonationStep2 } from '../screens/app/DonationStep2';
import { ExtractScreen } from '@workspace/ui/src/marketplace/ExtractScreen';
import { AppNotificationsScreen } from '../screens/app/AppNotificationsScreen';
import { ChatUserProfileScreen, ChatScreen } from '@workspace/ui';
import { RegisterAddressScreen } from '../screens/app/RegisterAddressScreen';

export type RootStackParamList = {
  Login: undefined;
  Sign: undefined;
  Main: { refresh?: boolean; snackbarMessage?: string } | undefined;
  DonationDetails: { donationId: string };
  DonationStep1: undefined;
  DonationStep2: { address: any; materials: any[] };
  Chat: { donationId: string };
  Extrato: undefined;
  Notifications: undefined;
  ChatUserProfile: {
    userId: string;
    profileRole: 'donor' | 'collector';
  };
  RegisterAddress: { addressToEdit?: any } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Carregando..." />;
  }

  if (user && profile && profile.account_status !== 'active') {
    return (
      <AccountStatusScreen
        status={profile.account_status as 'pending' | 'blocked'}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Usuário logado e AUTORIZADO ('active')
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
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
            <Stack.Screen
              name="ChatUserProfile"
              component={ChatUserProfileScreen}
              options={{ title: 'Perfil do Coletor', headerShown: true }}
            />
            <Stack.Screen
              name="RegisterAddress"
              component={RegisterAddressScreen}
              options={{ headerShown: false }}
            />
            {process.env.EXPO_PUBLIC_ENABLE_MARKETPLACE === 'true' && (
              <Stack.Screen name="Extrato" options={{ headerShown: false }}>
                {() => <ExtractScreen userId={user?.id || ''} />}
              </Stack.Screen>
            )}
            <Stack.Screen
              name="Notifications"
              component={AppNotificationsScreen}
              options={{ headerShown: false }}
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
