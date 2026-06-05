import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
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
import { ouvirEnvelopes, criarEnvelope, atualizarEnvelope, removerEnvelope, vincularBiometria, checarBiometriaVinculada, desvincularBiometria, buscarUsuarioPorEmail, registrarDespesa, transferirSaldo } from './src/storage';
import { DURACAO_TOAST } from './src/config';

export function Painel({ userEmail, onLogout }) {
  const [envelopes, setEnvelopes] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const [cameraVisivel, setCameraVisivel] = useState(false);
  const [envelopeParaFoto, setEnvelopeParaFoto] = useState(null);

  const [mapaVisivel, setMapaVisivel] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState(null);

  const [modalValorVisivel, setModalValorVisivel] = useState(false);
  const [inputValorDespesa, setInputValorDespesa] = useState('');
  const [envelopeParaDespesa, setEnvelopeParaDespesa] = useState(null);
  const [valorDespesaTemp, setValorDespesaTemp] = useState(null);

  const [modalTransferenciaVisivel, setModalTransferenciaVisivel] = useState(false);
  const [envelopeOrigem, setEnvelopeOrigem] = useState(null);
  const [envelopeDestino, setEnvelopeDestino] = useState(null);
  const [inputValorTransferencia, setInputValorTransferencia] = useState('');

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

  const addEnvelope = async (nome, categoria, orcamento) => {
    if (nome === '') {
      Toast.show({ type: 'error', text1: 'Nome Vazio', visibilityTime: DURACAO_TOAST });
      return;
    }

    try {
      const pushKey = await criarEnvelope({ nome, categoria, orcamento });
      Toast.show({ type: 'success', text1: 'Envelope criado!', visibilityTime: DURACAO_TOAST });

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

  const deleteEnvelope = (id) => {
    const envelope = envelopes.find(e => e.id === id);
    const nome = envelope ? envelope.nome : 'este envelope';

    Alert.alert(
      'Excluir envelope',
      `Excluir o envelope "${nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerEnvelope(id);
            } catch (error) {
              console.log('Erro ao remover envelope', error);
            }
          },
        },
      ]
    );
  };

  const abrirModalValor = (idEnvelope) => {
    const envelope = envelopes.find(e => e.id === idEnvelope);
    setEnvelopeParaDespesa(envelope);
    setInputValorDespesa('');
    setModalValorVisivel(true);
  };

  const confirmarValor = () => {
    const valor = Number(inputValorDespesa);
    if (isNaN(valor)) {
      Alert.alert('Erro', 'Valor inválido. Digite um número.');
      return;
    }
    if (valor <= 0) {
      Alert.alert('Erro', 'O valor da despesa deve ser maior que zero.');
      return;
    }
    setValorDespesaTemp(valor);
    setModalValorVisivel(false);
    setEnvelopeParaFoto(envelopeParaDespesa.id);
    setCameraVisivel(true);
  };

  const salvarDespesaNoEnvelope = async (photoUri) => {
    try {
      await registrarDespesa(envelopeParaFoto, valorDespesaTemp, envelopeParaDespesa.saldo, photoUri);
      setCameraVisivel(false);
      setEnvelopeParaFoto(null);
      setValorDespesaTemp(null);
      setEnvelopeParaDespesa(null);
      Toast.show({ type: 'success', text1: 'Recibo salvo!', visibilityTime: DURACAO_TOAST });
    } catch {
      // erro já tratado em storage.js
    }
  };

  const abrirMapa = (localizacao) => {
    setLocalSelecionado(localizacao);
    setMapaVisivel(true);
  };

  const abrirTransferencia = (envelope) => {
    setEnvelopeOrigem(envelope);
    setEnvelopeDestino(null);
    setInputValorTransferencia('');
    setModalTransferenciaVisivel(true);
  };

  const confirmarTransferencia = async () => {
    const valor = Number(inputValorTransferencia);
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Erro', 'Informe um valor válido maior que zero.');
      return;
    }
    if (!envelopeDestino) {
      Alert.alert('Erro', 'Selecione um envelope de destino.');
      return;
    }
    if (envelopeOrigem.id === envelopeDestino.id) {
      Alert.alert('Erro', 'Origem e destino não podem ser o mesmo envelope.');
      return;
    }
    if (valor > (envelopeOrigem.saldo ?? 0)) {
      Toast.show({ type: 'error', text1: 'Saldo insuficiente', visibilityTime: DURACAO_TOAST });
      return;
    }
    try {
      await transferirSaldo(
        envelopeOrigem.id,
        envelopeDestino.id,
        valor,
        envelopeOrigem.saldo ?? 0,
        envelopeDestino.saldo ?? 0,
      );
      Toast.show({ type: 'success', text1: 'Transferência realizada!', visibilityTime: DURACAO_TOAST });
      setModalTransferenciaVisivel(false);
    } catch {
      // erro já tratado em storage.js
    }
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
          onUserUpdate={(usuarioAtualizado) => setUserData(usuarioAtualizado)}
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
            openCamera={abrirModalValor}
            openMapa={abrirMapa}
            openTransferencia={abrirTransferencia}
          />
        </View>
      )}

      <CameraComponent 
        visivel={cameraVisivel} 
        onClose={() => setCameraVisivel(false)} 
        onSavePhoto={salvarDespesaNoEnvelope} 
      />
      <MapaComponent 
        visivel={mapaVisivel} 
        onClose={() => setMapaVisivel(false)} 
        localizacao={localSelecionado} 
      />

      <Modal
        visible={modalValorVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalValorVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>{envelopeParaDespesa?.nome}</Text>
            <Text style={styles.modalSaldo}>
              Saldo disponível: R$ {envelopeParaDespesa?.saldo ?? '—'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Valor da despesa (ex: 50.00)"
              value={inputValorDespesa}
              onChangeText={setInputValorDespesa}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={[styles.modalBotao, styles.modalBotaoCancelar]}
                onPress={() => setModalValorVisivel(false)}
              >
                <Text style={styles.modalBotaoTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBotao, styles.modalBotaoConfirmar]}
                onPress={confirmarValor}
              >
                <Text style={styles.modalBotaoTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalTransferenciaVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalTransferenciaVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Transferir Saldo</Text>

            <Text style={styles.modalLabel}>Origem</Text>
            <ScrollView style={styles.pickerLista} nestedScrollEnabled>
              {envelopes.map(env => (
                <TouchableOpacity
                  key={env.id}
                  style={[
                    styles.pickerItem,
                    envelopeOrigem?.id === env.id && styles.pickerItemSelecionado,
                  ]}
                  onPress={() => setEnvelopeOrigem(env)}
                >
                  <Text style={styles.pickerItemTexto}>
                    {env.nome} — R$ {env.saldo ?? 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Destino</Text>
            <ScrollView style={styles.pickerLista} nestedScrollEnabled>
              {envelopes.map(env => (
                <TouchableOpacity
                  key={env.id}
                  style={[
                    styles.pickerItem,
                    envelopeDestino?.id === env.id && styles.pickerItemSelecionado,
                  ]}
                  onPress={() => setEnvelopeDestino(env)}
                >
                  <Text style={styles.pickerItemTexto}>
                    {env.nome} — R$ {env.saldo ?? 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder="Valor a transferir (ex: 50.00)"
              value={inputValorTransferencia}
              onChangeText={setInputValorTransferencia}
              keyboardType="numeric"
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={[styles.modalBotao, styles.modalBotaoCancelar]}
                onPress={() => setModalTransferenciaVisivel(false)}
              >
                <Text style={styles.modalBotaoTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBotao, styles.modalBotaoConfirmar]}
                onPress={confirmarTransferencia}
              >
                <Text style={styles.modalBotaoTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      text2: 'Agora faça login para acessar.',
      visibilityTime: DURACAO_TOAST,
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
      text2: 'Até logo!',
      visibilityTime: DURACAO_TOAST,
    });
  };

  const pedirBiometria = async () => {
    const temHardware = await LocalAuthentication.hasHardwareAsync();
    if (!temHardware) {
      Toast.show({ type: 'error', text1: 'Dispositivo sem biometria', visibilityTime: DURACAO_TOAST });
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
      Toast.show({ type: 'error', text1: 'Autenticação falhou', visibilityTime: DURACAO_TOAST });
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    elevation: 4,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  modalSaldo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBotao: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  modalBotaoCancelar: {
    backgroundColor: '#95a5a6',
  },
  modalBotaoConfirmar: {
    backgroundColor: '#27ae60',
  },
  modalBotaoTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 4, marginTop: 8 },
  pickerLista: { maxHeight: 110, borderWidth: 1, borderColor: '#eee', borderRadius: 6, marginBottom: 6 },
  pickerItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pickerItemSelecionado: { backgroundColor: '#e8f8f0' },
  pickerItemTexto: { fontSize: 14, color: '#333' },
});