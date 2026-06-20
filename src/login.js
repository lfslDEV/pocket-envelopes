import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, Keyboard } from 'react-native';
import Toast from 'react-native-toast-message';
import { fazerLogin } from './storage';
import { DURACAO_TOAST } from './config';

export default function Login({ onLoginSuccess, onNavigateToRegister }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !senha) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos!', visibilityTime: DURACAO_TOAST });
      return;
    }

    const res = await fazerLogin(email, senha);
    if (res.sucesso) {
      Toast.show({ type: 'success', text1: 'Login aprovado!', visibilityTime: DURACAO_TOAST });
      onLoginSuccess(email);
    } else {
      Toast.show({ type: 'error', text1: 'Erro no Login', text2: res.erro, visibilityTime: DURACAO_TOAST });
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Acessar Cofre</Text>
      <Text style={styles.subtitle}>Entre com seu e-mail e senha.</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toggleButton} onPress={onNavigateToRegister}>
        <Text style={styles.toggleText}>
          Não tem conta? Cadastre-se aqui
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
  },
  logo: {
    width: 130,
    height: 130,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: '#2980b9',
    fontWeight: '600',
  }
});
