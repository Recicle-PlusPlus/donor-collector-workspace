import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { LoginScreen } from '@workspace/ui/src/screens/LoginScreen';

export function Login() {
  const navigation = useNavigation<any>();
  const { signInWithPassword } = useAuth();

  return (
    <LoginScreen
      onNavigateToRegister={() => navigation.navigate('Sign')}
      onLogin={signInWithPassword}
    />
  );
}
