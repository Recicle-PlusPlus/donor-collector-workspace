import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { RegisterScreen } from '@workspace/ui/src/screens/RegisterScreen';

export function Sign() {
  const navigation = useNavigation<any>();

  return (
    <RegisterScreen
      role="collector"
      onNavigateToLogin={() => navigation.goBack()}
    />
  );
}
