import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from '@workspace/db/src/contexts/AuthContext';
import { RootNavigator } from './src/navigation';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';

function DebugLogger() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true); // Controla se está aberto ou fechado

  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      const message = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');
      if (message.includes('[DEBUG]')) {
        setLogs(prev => [...prev, message]);
      }
    };
    return () => {
      console.log = originalLog;
    };
  }, []);

  if (logs.length === 0) return null;

  // Se o usuário fechou, mostra só um botão pequenininho no topo
  if (!isVisible) {
    return (
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={{
          position: 'absolute',
          top: 50,
          right: 10,
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 8,
          borderRadius: 20,
          zIndex: 9999,
        }}>
        <Text style={{ color: 'yellow', fontSize: 10 }}>Abrir Logs</Text>
      </TouchableOpacity>
    );
  }

  // Caixa de log completa com botão de fechar
  return (
    <SafeAreaView
      style={{
        position: 'absolute',
        top: 50,
        left: 10,
        right: 10,
        height: 250,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        borderRadius: 10,
        padding: 10,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}>
        <Text style={{ color: 'yellow', fontWeight: 'bold' }}>
          Log do Sistema:
        </Text>
        <TouchableOpacity
          onPress={() => setIsVisible(false)}
          style={{ padding: 5, backgroundColor: '#333', borderRadius: 5 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
            X FECHAR
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        {logs.map((log, i) => (
          <Text
            key={i}
            style={{ color: 'white', fontSize: 11, marginBottom: 4 }}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  console.log('[DEBUG] 0.3. App montado! Iniciando componentes raiz...');

  return (
    <>
      <DebugLogger />
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </>
  );
}
