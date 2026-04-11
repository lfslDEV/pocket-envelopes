import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import "react-native-get-random-values";
import Toast from 'react-native-toast-message';
import AddEnvelope from './src/add';
import ListEnvelopes from './src/list';
import Profile from './src/profile';

export function Painel({ user, onLogout }) {
  const [acess, setAcess] = useState(false);
  const [envelopes, setEnvelopes] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    (async () => {
      const authentication = await LocalAuthentication.authenticateAsync();
      if (authentication.success) {
        setAcess(true);
      } else {
        setAcess(false);
      }
    })();
  }, []);

  const addEnvelope = (nome) => {
    if (nome === '') {
      Toast.show({
        type: 'error',
        text1: 'Nome Vazio',
        text2: 'Por favor, digite um nome para o envelope.'
      });
    } else {
      const novoEnvelope = {
        id: uuidv4(),
        nome: nome,
      };
      setEnvelopes([novoEnvelope, ...envelopes]);
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Envelope criado!'
      });
    }
  };

  const deleteEnvelope = (id) => {
    const novaLista = envelopes.filter((item) => item.id !== id);
    setEnvelopes(novaLista);
    Toast.show({
      type: 'success',
      text1: 'Sucesso',
      text2: 'Envelope deletado!'
    });
  };

  return (
    <SafeAreaView style={styles.painelContainer}>
      {showProfile ? (
        <Profile 
          user={user}
          onBack={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      ) : acess ? (
        <View style={styles.innerPainel}>
          <View style={styles.header}>
            <Text style={styles.sectionTitle}>Meus Envelopes</Text>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => setShowProfile(true)}
            >
              <Text style={styles.profileButtonText}>Perfil</Text>
            </TouchableOpacity>
          </View>
          <AddEnvelope addEnvelope={addEnvelope} />
          <ListEnvelopes deleteEnvelope={deleteEnvelope} envelopes={envelopes} />
        </View>
      ) : (
        <View style={styles.centerContent}>
          <Text style={styles.textoErro}>A Autenticação Falhou</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  const [biometria, setBiometria] = useState(false);
  const [render, setRender] = useState(false);
  const [currentUser, setCurrentUser] = useState({ nome: 'Usuário Padrão', email: 'usuario@exemplo.com' });
  
  const changeRender = () => setRender(true);
  
  const handleLogout = () => {
    setRender(false);
    Toast.show({
      type: 'success',
      text1: 'Logout realizado',
      text2: 'Até logo!'
    });
  };

  useEffect(() => {
    (async () => {
      const compativel = await LocalAuthentication.hasHardwareAsync();
      setBiometria(compativel);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {render ? (
        <Painel user={currentUser} onLogout={handleLogout} />
      ) : (
        <View style={styles.centerContent}>
          <Text style={styles.textoAviso}>
            {biometria
              ? 'Faça o login com biometria'
              : 'Dispositivo não compatível com biometria'
            }
          </Text>

          <TouchableOpacity style={styles.botao} onPress={changeRender}>
            <Text style={styles.textoBotao}>Entrar</Text>
          </TouchableOpacity>
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
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  botao: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textoErro: {
    fontSize: 18,
    color: '#c0392b',
    fontWeight: 'bold'
  }
});