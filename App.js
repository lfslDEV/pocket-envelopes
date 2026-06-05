import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import MapaComponent from './src/map';
import AddEnvelope from './src/add';
import ListEnvelopes from './src/list';
import CameraComponent from './src/camera';
import Login from './src/login';
import Register from './src/register';
import Profile from './src/profile';
import { ouvirEnvelopes, criarEnvelope, atualizarEnvelope, removerEnvelope, vincularBiometria, checarBiometriaVinculada, desvincularBiometria, buscarUsuarioPorEmail } from './src/storage';

export function Painel({ userEmail, onLogout }) {
  const [envelopes, setEnvelopes] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const [cameraVisivel, setCameraVisivel] = useState(false);
  const [envelopeParaFoto, setEnvelopeParaFoto] = useState(null);

  const [mapaVisivel, setMapaVisivel] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState(null);

  useEffect(() => {
    const carregarUsuario = async () => {
      const user = await buscarUsuarioPorEmail(userEmail);
      setUserData(user);
    };
    carregarUsuario();

    const unsubscribe = ouvirEnvelopes((envelopesAtualizados) => {
      setEnvelopes(envelopesAtualizados);
    });

    return () => unsubscribe();
  }, [userEmail]);

  const addEnvelope = async (nome, categoria) => {
    if (nome === '') {
      Toast.show({ type: 'error', text1: 'Nome Vazio' });
      return;
    }

    try {
      const pushKey = await criarEnvelope({ nome, categoria });
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

          await atualizarEnvelope(pushKey, { localizacao: localizacaoAtual });
        }
      } catch (error) {
        console.log("Erro ao buscar GPS em segundo plano", error);
      }
    } catch (error) {
      console.log("Erro ao criar envelope", error);
    }
  };

  const deleteEnvelope = async (id) => {
    try {
      await removerEnvelope(id);
    } catch (error) {
      console.log("Erro ao remover envelope", error);
    }
  };

  const abrirCamera = (idEnvelope) => {
    setEnvelopeParaFoto(idEnvelope);
    setCameraVisivel(true);
  };

  const salvarFotoNoEnvelope = async (photoUri) => {
    try {
      await atualizarEnvelope(envelopeParaFoto, { reciboUri: photoUri });
      setCameraVisivel(false);
      setEnvelopeParaFoto(null);
      Toast.show({ type: 'success', text1: 'Recibo salvo!' });
    } catch (error) {
      console.log("Erro ao salvar recibo", error);
    }
  };

  const abrirMapa = (localizacao) => {
    setLocalSelecionado(localizacao);
    setMapaVisivel(true);
  };

  const prepararSeccoes = () => {
    const grupos = envelopes.reduce((acc, current) => {
      const cat = current.categoria || 'Geral'; 
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(current);
      return acc;
    }, {});

    return Object.keys(grupos).map(cat => ({
      title: cat,
      data: grupos[cat]
    }));
  };

  const categoriasExistentes = [...new Set(envelopes.map(env => env.categoria || 'Geral'))];

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
          <AddEnvelope addEnvelope={addEnvelope} categorias={categoriasExistentes} />
          
          <ListEnvelopes 
            sections={prepararSeccoes()} 
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
  const [showRegister, setShowRegister] = useState(false);

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

  const handleRegisterSuccess = () => {
    Toast.show({ 
      type: 'success', 
      text1: 'Cadastro realizado!',
      text2: 'Agora faça login para acessar.'
    });
    setShowRegister(false);
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
          {showRegister ? (
            <View style={{ width: '100%', paddingHorizontal: 20 }}>
              <Register 
                onRegisterSuccess={handleRegisterSuccess}
                onNavigateToLogin={() => setShowRegister(false)}
              />
            </View>
          ) : !emailVinculado ? (
            <View style={{ width: '100%', paddingHorizontal: 20 }}>
              <Login 
                onLoginSuccess={handleLoginSuccess}
                onNavigateToRegister={() => setShowRegister(true)}
              />
            </View>
          ) : (
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