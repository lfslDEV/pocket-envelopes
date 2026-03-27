import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const ENVELOPES_KEY = '@meus_envelopes';
const USUARIOS_KEY = '@usuarios_cadastrados';
const BIOMETRIA_VINCULADA_KEY = '@biometria_vinculada';

export const buscarEnvelopes = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(ENVELOPES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    Toast.show({ type: 'error', text1: 'Erro ao ler envelopes' });
    return [];
  }
};

export const salvarEnvelopes = async (envelopes) => {
  try {
    const jsonValue = JSON.stringify(envelopes);
    await AsyncStorage.setItem(ENVELOPES_KEY, jsonValue);
  } catch (e) {
    Toast.show({ type: 'error', text1: 'Erro ao salvar envelopes' });
  }
};

export const cadastrarUsuario = async (nome, email, senha) => {
  try {
    const jsonValue = await AsyncStorage.getItem(USUARIOS_KEY);
    const usuarios = jsonValue != null ? JSON.parse(jsonValue) : [];
    const usuarioExiste = usuarios.find(u => u.email === email);
    if (usuarioExiste) {
      return { sucesso: false, erro: 'Este e-mail já está cadastrado.' };
    }

    const novoUsuario = { nome, email, senha };
    usuarios.push(novoUsuario);
    
    await AsyncStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
    return { sucesso: true, usuario: novoUsuario };
  } catch (e) {
    return { sucesso: false, erro: 'Erro ao cadastrar usuário.' };
  }
};

export const fazerLogin = async (email, senha) => {
  try {
    const jsonValue = await AsyncStorage.getItem(USUARIOS_KEY);
    const usuarios = jsonValue != null ? JSON.parse(jsonValue) : [];

    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    if (usuario) {
      return { sucesso: true, usuario };
    } else {
      return { sucesso: false, erro: 'E-mail ou senha incorretos.' };
    }
  } catch (e) {
    return { sucesso: false, erro: 'Erro ao fazer login.' };
  }
};

export const vincularBiometria = async (email) => {
  try {
    await AsyncStorage.setItem(BIOMETRIA_VINCULADA_KEY, email);
  } catch (e) {
    console.log("Erro ao vincular biometria", e);
  }
};

export const checarBiometriaVinculada = async () => {
  try {
    const email = await AsyncStorage.getItem(BIOMETRIA_VINCULADA_KEY);
    return email;
  } catch (e) {
    return null;
  }
};