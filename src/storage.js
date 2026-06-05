import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { Alert } from 'react-native';

const USUARIOS_KEY = '@usuarios_cadastrados';
const BIOMETRIA_VINCULADA_KEY = '@biometria_vinculada';


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

export const desvincularBiometria = async () => {
  try {
    await AsyncStorage.removeItem(BIOMETRIA_VINCULADA_KEY);
  } catch (e) {
    console.log("Erro ao desvincular biometria", e);
  }
};

export const buscarUsuarioPorEmail = async (email) => {
  try {
    const jsonValue = await AsyncStorage.getItem(USUARIOS_KEY);
    const usuarios = jsonValue != null ? JSON.parse(jsonValue) : [];
    const usuario = usuarios.find(u => u.email === email);
    return usuario || null;
  } catch (e) {
    return null;
  }
};

export const criarEnvelope = async ({ nome, categoria, orcamento }) => {
  try {
    const envelopesRef = ref(db, 'envelopes');
    const createdAt = new Date().toISOString();
    const saldo = orcamento;
    
    const newRef = await push(envelopesRef, { 
      nome, 
      categoria, 
      reciboUri: null, 
      localizacao: null, 
      createdAt,
      orcamento,
      saldo
    });
    return newRef.key;
  } catch (error) {
    Alert.alert('Erro', 'Erro ao criar envelope. Tente novamente.');
    throw error;
  }
};

export const ouvirEnvelopes = (callback) => {
  try {
    const envelopesRef = ref(db, 'envelopes');
    
    const unsubscribe = onValue(envelopesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        
        if (!data) {
          callback([]);
          return;
        }
        
        const envelopesList = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .reverse();
        
        callback(envelopesList);
      } catch (error) {
        Alert.alert('Erro', 'Erro ao processar envelopes. Tente novamente.');
      }
    }, (error) => {
      Alert.alert('Erro', 'Erro ao carregar envelopes. Tente novamente.');
    });
    
    return unsubscribe;
  } catch (error) {
    Alert.alert('Erro', 'Erro ao carregar envelopes. Tente novamente.');
    return () => {};
  }
};

export const atualizarEnvelope = async (id, campos) => {
  try {
    const envelopeRef = ref(db, `envelopes/${id}`);
    await update(envelopeRef, campos);
  } catch (error) {
    Alert.alert('Erro', 'Erro ao atualizar envelope. Tente novamente.');
    throw error;
  }
};

export const removerEnvelope = async (id) => {
  try {
    const envelopeRef = ref(db, `envelopes/${id}`);
    await remove(envelopeRef);
  } catch (error) {
    Alert.alert('Erro', 'Erro ao remover envelope. Tente novamente.');
    throw error;
  }
};

export const registrarDespesa = async (id, valorDespesa, saldoAtual, reciboUri) => {
  try {
    const envelopeRef = ref(db, `envelopes/${id}`);
    await update(envelopeRef, {
      saldo: saldoAtual - valorDespesa,
      valorDespesa,
      reciboUri,
    });
  } catch (error) {
    Alert.alert('Erro', 'Erro ao registrar despesa. Tente novamente.');
    throw error;
  }
};

export const transferirSaldo = async (origemId, destinoId, valor, saldoOrigem, saldoDestino) => {
  try {
    await update(ref(db), {
      [`envelopes/${origemId}/saldo`]: saldoOrigem - valor,
      [`envelopes/${destinoId}/saldo`]: saldoDestino + valor,
    });
  } catch (error) {
    Alert.alert('Erro', 'Erro ao transferir saldo. Tente novamente.');
    throw error;
  }
};
