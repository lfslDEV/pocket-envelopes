import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { cadastrarUsuario } from './storage';

export default function Register({ onRegisterSuccess, onNavigateToLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleRegister = async () => {
    Keyboard.dismiss();
    
    if (!nome || !email || !senha || !confirmarSenha) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos!' });
      return;
    }

    if (senha !== confirmarSenha) {
      Toast.show({ 
        type: 'error', 
        text1: 'Senhas não coincidem',
        text2: 'As senhas digitadas são diferentes.'
      });
      return;
    }

    if (senha.length < 6) {
      Toast.show({ 
        type: 'error', 
        text1: 'Senha fraca',
        text2: 'A senha deve ter pelo menos 6 caracteres.'
      });
      return;
    }

    const res = await cadastrarUsuario(nome, email, senha);
    if (res.sucesso) {
      onRegisterSuccess();
    } else {
      Toast.show({ type: 'error', text1: 'Erro no Cadastro', text2: res.erro });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Criar Nova Conta</Text>
        <Text style={styles.subtitle}>Cadastre-se para proteger seus envelopes.</Text>

        <TextInput
          style={styles.input}
          placeholder="Seu Nome"
          value={nome}
          onChangeText={setNome}
        />

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

        <TextInput
          style={styles.input}
          placeholder="Confirmar Senha"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleButton} onPress={onNavigateToLogin}>
          <Text style={styles.toggleText}>
            Já tenho conta. Fazer Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
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
