import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';

export function Painel() {
  const [acess, setAcess] = useState(false);

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

  return (
    <View style={styles.container}>
      {acess ? (
        <Text style={styles.textoSucesso}>Acesso Permitido</Text>
      ) : (
        <Text style={styles.textoErro}>A Autenticação Falhou</Text>
      )}
    </View>
  );
}

export default function App() {
  const [biometria, setBiometria] = useState(false);
  const [render, setRender] = useState(false);
  
  const changeRender = () => setRender(true);

  useEffect(() => {
    (async () => {
      const compativel = await LocalAuthentication.hasHardwareAsync();
      setBiometria(compativel);
    })();
  }, []);

  if (render) {
    return (
      <Painel />
    );
  } else {
    return (
      <View style={styles.container}>
        <Text style={styles.textoAviso}>
          {biometria
            ? 'Faça o login com biometria'
            : 'Aparelho não compativel com biometria'
          }
        </Text>

        <TouchableOpacity style={styles.botao} onPress={changeRender}>
          <Text style={styles.textoBotao}>Entrar</Text>
        </TouchableOpacity>
        
        <StatusBar style="auto" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
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
  textoSucesso: {
    fontSize: 20,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  textoErro: {
    fontSize: 18,
    color: '#c0392b',
  }
});