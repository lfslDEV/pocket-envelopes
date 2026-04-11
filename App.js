import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';
import { v4 as uuidv4 } from 'uuid';
import "react-native-get-random-values";
import * as Location from 'expo-location';
import MapaComponent from './src/map';
import AddEnvelope from './src/add';
import ListEnvelopes from './src/list';
import CameraComponent from './src/camera';
import Login from './src/login';
import Profile from './src/profile';
import { buscarEnvelopes, salvarEnvelopes, vincularBiometria, checarBiometriaVinculada, desvincularBiometria, buscarUsuarioPorEmail } from './src/storage';

export function Painel({ userEmail, onLogout }) {
  const [envelopes, setEnvelopes] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const [cameraVisivel, setCameraVisivel] = useState(false);
  const [envelopeParaFoto, setEnvelopeParaFoto] = useState(null);

  const [mapaVisivel, setMapaVisivel] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      const dados = await buscarEnvelopes();
      setEnvelopes(dados);
      
      const user = await buscarUsuarioPorEmail(userEmail);
      setUserData(user);
    };
    carregarDados();
  }, [userEmail]);

  useEffect(() => {
    salvarEnvelopes(envelopes);
  }, [envelopes]);

  const addEnvelope = async (nome) => {
    if (nome === '') {
      Toast.show({ type: 'error', text1: 'Nome Vazio' });
      return;
    }

    const idNovo = uuidv4();
    const novo = { 
      id: idNovo, 
      nome, 
      reciboUri: null, 
      localizacao: null
    };
    
    setEnvelopes(prev => [novo, ...prev]);
    Toast.show({ type: 'success', text1: 'Envelope criado!' });

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getLastKnownPositionAsync({});
        
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }

        const localizacaoAtual = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setEnvelopes(prevEnvelopes => 
          prevEnvelopes.map(env => 
            env.id === idNovo ? { ...env, localizacao: localizacaoAtual } : env
          )
        );
      }
    } catch (error) {
      console.log("Erro ao buscar GPS em segundo plano", error);
    }
  };

  const deleteEnvelope = (id) => {
    const filtrados = envelopes.filter((item) => item.id !== id);
    setEnvelopes(filtrados);
  };

  const abrirCamera = (idEnvelope) => {
    setEnvelopeParaFoto(idEnvelope);
    setCameraVisivel(true);
  };

  const salvarFotoNoEnvelope = (photoUri) => {
    const listaAtualizada = envelopes.map(env => {
      if (env.id === envelopeParaFoto) return { ...env, reciboUri: photoUri };
      return env;
    });
    setEnvelopes(listaAtualizada);
    setCameraVisivel(false);
    setEnvelopeParaFoto(null);
    Toast.show({ type: 'success', text1: 'Recibo salvo!' });
  };

  const abrirMapa = (localizacao) => {
    setLocalSelecionado(localizacao);
    setMapaVisivel(true);
  };

  return (
    <SafeAreaView style={styles.painelContainer}>
      {showProfile ? (
        <Profile 
          user={userData}
          onBack={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      ) : (
        <View style={styles.innerPainel}>
          <View style={styles.header}>
            <Text style={styles.sectionTitle}>Gestão de Envelopes</Text>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => setShowProfile(true)}
            >
              <Text style={styles.profileButtonText}>Perfil</Text>
            </TouchableOpacity>
          </View>
          <AddEnvelope addEnvelope={addEnvelope} />
          
          <ListEnvelopes 
            envelopes={envelopes} 
            deleteEnvelope={deleteEnvelope} 
            openCamera={abrirCamera}
            openMapa={abrirMapa} 
          />
        </View>
      )}

      <CameraComponent 
        visivel={cameraVisivel} 
        onClose={() => setCameraVisivel(false)} 
        onSavePhoto={salvarFotoNoEnvelope} 
      />
      <MapaComponent 
        visivel={mapaVisivel} 
        onClose={() => setMapaVisivel(false)} 
        localizacao={localSelecionado} 
      />
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

  const handleLogout = async () => {
    await desvincularBiometria();
    setEmailVinculado(null);
    setCofreAberto(false);
    Toast.show({
      type: 'success',
      text1: 'Logout realizado',
      text2: 'Até logo!'
    });
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
        <Painel userEmail={emailVinculado} onLogout={handleLogout} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  profileButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
