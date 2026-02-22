import React from 'react';
import { View, Text } from 'react-native';
import { ButtonDefault, colors } from '@workspace/ui';
import { supabase } from '@workspace/db';

export function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Bem-vindo à Home!</Text>
      <ButtonDefault
        title="Sair (Logout)"
        color={colors.error}
        fun={() => supabase.auth.signOut()}
      />
    </View>
  );
}
