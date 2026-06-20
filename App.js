import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import MapaComponent from './src/map';
import AddEnvelope from './src/add';
import ListEnvelopes from './src/list';
import CameraComponent from './src/camera';
import Login from './src/login';
import Register from './src/register';
import Profile from './src/profile';
import Dashboard from './src/dashboard';
import Contas from './src/contas';
import Transacoes from './src/transacoes';
import { ouvirEnvelopes, criarEnvelope, atualizarEnvelope, removerEnvelope, vincularBiometria, checarBiometriaVinculada, desvincularBiometria, buscarUsuarioPorEmail, registrarDespesa, transferirSaldo } from './src/storage';
import { initDB, buscarEnvelopesLocais } from './src/database';
import { sincronizar } from './src/sync';
import { setCurrentUser, getCurrentUser } from './src/userKey';
import { DURACAO_TOAST } from './src/config';
import { colors, typography, spacing, radius, shadow } from './src/theme';

const TABS = [
  { id: 'dashboard',   icone: '🏠', label: 'Início' },
  { id: 'envelopes',  icone: '📋', label: 'Envelopes' },
  { id: 'contas',     icone: '🏦', label: 'Contas' },
  { id: 'transacoes', icone: '📊', label: 'Histórico' },
  { id: 'perfil',     icone: '👤', label: 'Perfil' },
];

const TITULOS = {
  dashboard:   'Visão Geral',
  envelopes:   'Envelopes',
  contas:      'Contas',
  transacoes:  'Transações',
  perfil:      '',
};

export function Painel({ userEmail, onLogout }) {
  const [telaAtual, setTelaAtual] = useState('envelopes');
  const [envelopes, setEnvelopes] = useState([]);
  const [userData, setUserData] = useState(null);

  const recarregarEnvelopes = () => buscarEnvelopesLocais().then(setEnvelopes);

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
    buscarUsuarioPorEmail(userEmail).then(setUserData);
    const unsubscribe = ouvirEnvelopes(setEnvelopes);
    return () => unsubscribe();
  }, [userEmail]);

  const addEnvelope = async (nome, categoria, orcamento) => {
    if (nome === '') {
      Toast.show({ type: 'error', text1: 'Nome Vazio', visibilityTime: DURACAO_TOAST });
      return;
    }
    try {
      const id = await criarEnvelope({ nome, categoria, orcamento });
      recarregarEnvelopes();
      Toast.show({ type: 'success', text1: 'Envelope criado!', visibilityTime: DURACAO_TOAST });
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getLastKnownPositionAsync({});
          if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await atualizarEnvelope(id, {
            localizacao: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          });
          recarregarEnvelopes();
        }
      } catch (e) {
        console.log('Erro ao buscar GPS', e);
      }
    } catch (e) {
      console.log('Erro ao criar envelope', e);
    }
  };

  const deleteEnvelope = (id) => {
    const nome = envelopes.find(e => e.id === id)?.nome ?? 'este envelope';
    Alert.alert('Excluir envelope', `Excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removerEnvelope(id);
            recarregarEnvelopes();
          } catch (e) { console.log(e); }
        },
      },
    ]);
  };

  const abrirModalValor = (idEnvelope) => {
    setEnvelopeParaDespesa(envelopes.find(e => e.id === idEnvelope));
    setInputValorDespesa('');
    setModalValorVisivel(true);
  };

  const confirmarValor = () => {
    const valor = Number(inputValorDespesa);
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Erro', 'Informe um valor maior que zero.');
      return;
    }
    setValorDespesaTemp(valor);
    setModalValorVisivel(false);
    setEnvelopeParaFoto(envelopeParaDespesa.id);
    setCameraVisivel(true);
  };

  const salvarDespesaNoEnvelope = async (reciboBase64) => {
    try {
      await registrarDespesa(envelopeParaFoto, valorDespesaTemp, envelopeParaDespesa.saldo, reciboBase64);
      recarregarEnvelopes();
      setCameraVisivel(false);
      setEnvelopeParaFoto(null);
      setValorDespesaTemp(null);
      setEnvelopeParaDespesa(null);
      Toast.show({ type: 'success', text1: 'Recibo salvo!', visibilityTime: DURACAO_TOAST });
    } catch {
      // erro já tratado em storage.js
    }
  };

  const fecharCameraComAviso = () => {
    if (valorDespesaTemp !== null) {
      Alert.alert(
        'Despesa não salva',
        'O valor digitado foi descartado. Nenhum gasto foi registrado.',
        [{ text: 'OK', onPress: () => {
          setCameraVisivel(false);
          setValorDespesaTemp(null);
          setEnvelopeParaDespesa(null);
          setEnvelopeParaFoto(null);
        }}]
      );
    } else {
      setCameraVisivel(false);
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
        envelopeOrigem.id, envelopeDestino.id, valor,
        envelopeOrigem.saldo ?? 0, envelopeDestino.saldo ?? 0,
      );
      recarregarEnvelopes();
      Toast.show({ type: 'success', text1: 'Transferência realizada!', visibilityTime: DURACAO_TOAST });
      setModalTransferenciaVisivel(false);
    } catch {
      // erro já tratado em storage.js
    }
  };

  const prepararSeccoes = () => {
    const grupos = envelopes.reduce((acc, e) => {
      const cat = e.categoria || 'Geral';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(e);
      return acc;
    }, {});
    return Object.keys(grupos).map(cat => ({ title: cat, data: grupos[cat] }));
  };

  const categoriasExistentes = [...new Set(envelopes.map(e => e.categoria || 'Geral'))];

  const renderConteudo = () => {
    switch (telaAtual) {
      case 'dashboard':
        return <Dashboard envelopes={envelopes} userData={userData} />;

      case 'envelopes':
        return (
          <View style={styles.innerPainel}>
            <AddEnvelope addEnvelope={addEnvelope} categorias={categoriasExistentes} />
            <ListEnvelopes
              sections={prepararSeccoes()}
              deleteEnvelope={deleteEnvelope}
              openCamera={abrirModalValor}
              openMapa={abrirMapa}
              openTransferencia={abrirTransferencia}
            />
          </View>
        );

      case 'contas':
        return <Contas />;

      case 'transacoes':
        return <Transacoes />;

      case 'perfil':
        return (
          <Profile
            user={userData}
            onBack={() => setTelaAtual('envelopes')}
            onLogout={onLogout}
            onUserUpdate={(u) => setUserData(u)}
          />
        );
    }
  };

  const mostrarHeader = telaAtual !== 'perfil';

  return (
    <SafeAreaView style={styles.painelContainer}>
      {mostrarHeader && (
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>{TITULOS[telaAtual]}</Text>
          <TouchableOpacity
            style={styles.profileAvatarButton}
            onPress={() => setTelaAtual('perfil')}
            activeOpacity={0.8}
          >
            {userData?.fotoUri ? (
              <Image source={{ uri: userData.fotoUri }} style={styles.profileAvatarImage} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.profileAvatarText}>
                  {userData?.nome ? userData.nome.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.conteudo}>
        {renderConteudo()}
      </View>

      <CameraComponent
        visivel={cameraVisivel}
        onClose={fecharCameraComAviso}
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
                <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
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
                  style={[styles.pickerItem, envelopeOrigem?.id === env.id && styles.pickerItemSelecionado]}
                  onPress={() => setEnvelopeOrigem(env)}
                >
                  <Text style={styles.pickerItemTexto}>{env.nome} — R$ {env.saldo ?? 0}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.modalLabel}>Destino</Text>
            <ScrollView style={styles.pickerLista} nestedScrollEnabled>
              {envelopes.map(env => (
                <TouchableOpacity
                  key={env.id}
                  style={[styles.pickerItem, envelopeDestino?.id === env.id && styles.pickerItemSelecionado]}
                  onPress={() => setEnvelopeDestino(env)}
                >
                  <Text style={styles.pickerItemTexto}>{env.nome} — R$ {env.saldo ?? 0}</Text>
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
                <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
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

      <View style={styles.bottomNav}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setTelaAtual(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcone}>{tab.icone}</Text>
            <Text style={[styles.tabLabel, telaAtual === tab.id && styles.tabLabelAtiva]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
      if (emailSalvo) {
        setCurrentUser(emailSalvo);
        await initDB(getCurrentUser());
        sincronizar().catch(() => {});
      }
      setEmailVinculado(emailSalvo);
      setIsCarregando(false);
    }
    iniciarApp();

    const unsubNetInfo = NetInfo.addEventListener(estado => {
      if (estado.isConnected && getCurrentUser()) sincronizar().catch(() => {});
    });
    return () => unsubNetInfo();
  }, []);

  const handleLoginSuccess = async (email) => {
    setCurrentUser(email);
    await initDB(getCurrentUser());
    await vincularBiometria(email);
    setEmailVinculado(email);
    setCofreAberto(true);
    sincronizar().catch(() => {});
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
    setCurrentUser(null);
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
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painelContainer: {
    flex: 1,
    width: '100%',
  },
  conteudo: {
    flex: 1,
  },
  innerPainel: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.brand,
  },
  // ── Bottom nav ──
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 2,
  },
  tabIcone: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: typography.medium,
  },
  tabLabelAtiva: {
    color: colors.brand,
    fontWeight: typography.bold,
  },
  profileAvatarButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadow.card,
  },
  profileAvatarImage: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
  },
  profileAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: colors.textOnDark,
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
  textoAviso: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  textoSubAviso: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg + spacing.md,
    marginTop: spacing.xs,
  },
  botao: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    ...shadow.card,
  },
  textoBotao: {
    color: colors.textOnDark,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },

  // ── Modais ──
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.modal,
  },
  modalTitulo: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSaldo: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.base,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.base,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.lg,
  },
  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalBotao: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  modalBotaoCancelar: {
    backgroundColor: colors.gray200,
  },
  modalBotaoConfirmar: {
    backgroundColor: colors.brand,
  },
  modalBotaoTexto: {
    color: colors.textOnDark,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  modalBotaoCancelarTexto: {
    color: colors.textSecondary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  modalLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  pickerLista: {
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  pickerItem: {
    padding: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerItemSelecionado: {
    backgroundColor: colors.brandLight,
  },
  pickerItemTexto: {
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
});