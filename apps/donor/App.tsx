import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from '@workspace/db/src/contexts/AuthContext';
import { RootNavigator } from './src/navigation';
import { ScrollView, Text } from 'react-native';
import { useEffect, useState } from 'react';

function DebugLogger() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Guarda o console.log original
    const originalLog = console.log;

    // Sobrescreve o console.log
    console.log = (...args) => {
      // Chama o original para não perder nada
      originalLog(...args);

      // Transforma o log num texto e adiciona na tela
      const message = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');

      // Só pega os nossos logs de [DEBUG] para não poluir
      if (message.includes('[DEBUG]')) {
        setLogs(prev => [...prev, message]);
      }
    };

    return () => {
      console.log = originalLog; // Restaura ao desmontar
    };
  }, []);

  if (logs.length === 0) return null;

  return (
    <SafeAreaView
      style={{
        position: 'absolute',
        top: 50,
        left: 10,
        right: 10,
        height: 300,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        borderRadius: 10,
        padding: 10,
      }}>
      <Text style={{ color: 'yellow', fontWeight: 'bold', marginBottom: 5 }}>
        Log do Sistema:
      </Text>
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
