import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { LoginScreen } from '@workspace/ui/src/screens/LoginScreen';

export function Login() {
  const navigation = useNavigation<any>();

  return (
    <LoginScreen onNavigateToRegister={() => navigation.navigate('Sign')} />
  );
}
