import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { Loading } from '@workspace/ui';
import { AccountStatusScreen } from '@workspace/ui/src/screens/AccountStatusScreen';

import { Login } from '../screens/auth/Login';
import { Sign } from '../screens/auth/Sign';
import { DonationAccept } from '../screens/app/DonationAccept';
import { MainTabs } from './MainTabs';
import { ExtractScreen } from '@workspace/ui/src/marketplace/ExtractScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNotificationsScreen } from '../screens/app/AppNotificationsScreen';
import { ChatUserProfileScreen, ChatScreen } from '@workspace/ui';

export type RootStackParamList = {
  Login: undefined;
  Sign: undefined;
  Main: { refresh?: boolean } | undefined;
  DonationAccept: { donationId: string };
  Profile: undefined;
  Chat: { donationId: string };
  Extrato: undefined;
  Notifications: undefined;
  ChatUserProfile: { userId: string };
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                name="DonationAccept"
                component={DonationAccept}
                options={{ headerShown: true, title: 'Detalhes da Coleta' }}
              />
              <Stack.Screen
                name="ChatUserProfile"
                component={ChatUserProfileScreen}
                options={{ headerShown: true, title: 'Perfil do Doador' }}
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
    </GestureHandlerRootView>
  );
}
