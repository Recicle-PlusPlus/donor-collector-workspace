import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@workspace/ui';

import { Home } from '../screens/app/Home';
import { Profile } from '../screens/app/Profile';
import { MarketplaceScreen } from '@workspace/ui/src/marketplace/MarketplaceScreen';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: '#eee',
          elevation: 5,
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="recycle" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      {process.env.EXPO_PUBLIC_ENABLE_MARKETPLACE === 'true' && (
        <Tab.Screen
          name="Marketplace"
          options={{
            title: 'Recompensas',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="storefront-outline"
                color={color}
                size={size}
              />
            ),
          }}>
          {() => <MarketplaceScreen userId={user?.id || ''} />}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  );
}
