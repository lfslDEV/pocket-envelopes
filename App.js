import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';
import { v4 as uuidv4 } from 'uuid';
import "react-native-get-random-values";
import Login from './src/login';
import AddEnvelope from './src/add';
import ListEnvelopes from './src/list';
import { buscarEnvelopes, salvarEnvelopes, vincularBiometria, checarBiometriaVinculada } from './src/storage';

export function Painel() {
  const [envelopes, setEnvelopes] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      const dados = await buscarEnvelopes();
      setEnvelopes(dados);
    };
    carregarDados();
  }, []);

  useEffect(() => {
    salvarEnvelopes(envelopes);
  }, [envelopes]);

  const addEnvelope = (nome) => {
    if (nome === '') {
      Toast.show({ type: 'error', text1: 'Nome Vazio' });
      return;
    }
    const novo = { id: uuidv4(), nome };
    setEnvelopes([novo, ...envelopes]);
    Toast.show({ type: 'success', text1: 'Envelope criado!' });
  };

  const deleteEnvelope = (id) => {
    const filtrados = envelopes.filter((item) => item.id !== id);
    setEnvelopes(filtrados);
  };

  return (
    <SafeAreaView style={styles.painelContainer}>
      <View style={styles.innerPainel}>
        <Text style={styles.sectionTitle}>Gestão de Envelopes</Text>
        <AddEnvelope addEnvelope={addEnvelope} />
        <ListEnvelopes deleteEnvelope={deleteEnvelope} envelopes={envelopes} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [isCarregando, setIsCarregando] = useState(true);
  const [emailVinculado, setEmailVinculado] = useState(null);
  const [cofreAberto, setCofreAberto] = useState(false);

  useEffect(() => {
    async function iniciarApp() {
      const emailSalvo = await checarBiometriaVinculada();
      setEmailVinculado(emailSalvo);
      setIsCarregando(false);
    }
    iniciarApp();
  }, []);

  const handleLoginSuccess = async (email) => {
    await vincularBiometria(email);
    setEmailVinculado(email);
    setCofreAberto(true);
  };

  const pedirBiometria = async () => {
    const temHardware = await LocalAuthentication.hasHardwareAsync();
    if (!temHardware) {
      Toast.show({ type: 'error', text1: 'Dispositivo sem biometria' });
      return;
    }

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse seu Cofre Financeiro',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });

    if (auth.success) {
      setCofreAberto(true);
    } else {
      Toast.show({ type: 'error', text1: 'Autenticação falhou' });
    }
  };

  if (isCarregando) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cofreAberto ? (
        <Painel />
      ) : (
        <View style={styles.centerContent}>
          {!emailVinculado && (
            <View style={{ width: '100%', paddingHorizontal: 20 }}>
              <Login onLoginSuccess={handleLoginSuccess} />
            </View>
          )}
          {emailVinculado && (
             <View style={{ alignItems: 'center' }}>
               <Text style={styles.textoAviso}>Bem-vindo de volta!</Text>
               <Text style={styles.textoSubAviso}>Conta: {emailVinculado}</Text>
               
               <TouchableOpacity style={styles.botao} onPress={pedirBiometria}>
                 <Text style={styles.textoBotao}>Acessar com Biometria</Text>
               </TouchableOpacity>
             </View>
          )}

        </View>
      )}
      
      <Toast position='top' bottomOffset={20} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painelContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 40,
  },
  innerPainel: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 20,
    marginTop: 10,
  },
  textoAviso: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  textoSubAviso: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    marginTop: 5,
  },
  botao: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});