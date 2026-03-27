import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import Toast from 'react-native-toast-message';
import { cadastrarUsuario, fazerLogin } from './storage';

export default function Login({ onLoginSuccess }) {
  const [isCadastro, setIsCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleAuth = async () => {
    Keyboard.dismiss();
    if (!email || !senha || (isCadastro && !nome)) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos!' });
      return;
    }

    if (isCadastro) {
      const res = await cadastrarUsuario(nome, email, senha);
      if (res.sucesso) {
        Toast.show({ type: 'success', text1: 'Conta criada com sucesso!' });
        onLoginSuccess(email);
      } else {
        Toast.show({ type: 'error', text1: 'Erro no Cadastro', text2: res.erro });
      }
    } else {
      const res = await fazerLogin(email, senha);
      if (res.sucesso) {
        Toast.show({ type: 'success', text1: 'Login aprovado!' });
        onLoginSuccess(email);
      } else {
        Toast.show({ type: 'error', text1: 'Erro no Login', text2: res.erro });
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isCadastro ? 'Criar Nova Conta' : 'Acessar Cofre'}</Text>
      <Text style={styles.subtitle}>
        {isCadastro ? 'Cadastre-se para proteger seus envelopes.' : 'Entre com seu e-mail e senha.'}
      </Text>

      {isCadastro && (
        <TextInput
          style={styles.input}
          placeholder="Seu Nome"
          value={nome}
          onChangeText={setNome}
        />
      )}

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

      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>{isCadastro ? 'Cadastrar' : 'Entrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toggleButton} onPress={() => setIsCadastro(!isCadastro)}>
        <Text style={styles.toggleText}>
          {isCadastro ? 'Já tenho conta. Fazer Login' : 'Não tem conta? Cadastre-se aqui'}
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