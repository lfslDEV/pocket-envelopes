import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { getCurrentUser } from './userKey';
import { Alert } from 'react-native';
import {
  gerarId,
  inserirEnvelopeLocal,
  buscarEnvelopesLocais,
  atualizarEnvelopeLocal,
  deletarEnvelope,
  buscarEnvelopePorId,
  upsertEnvelopeDoFirebase,
  adicionarNaFila,
  envelopeParaPayload,
  inserirContaLocal,
  buscarContasLocais,
  atualizarContaLocal,
  deletarConta,
  buscarContaPorId,
  upsertContaDoFirebase,
  contaParaPayload,
  inserirTransacaoLocal,
  buscarTransacoesLocais,
  deletarTransacao,
  upsertTransacaoDoFirebase,
  transacaoParaPayload,
} from './database';
import { sincronizar } from './sync';

const USUARIOS_KEY = '@usuarios_cadastrados';
const BIOMETRIA_VINCULADA_KEY = '@biometria_vinculada';

// ─── Usuários (AsyncStorage — inalterado) ─────────────────────────────────────

export const cadastrarUsuario = async (nome, email, senha) => {
  try {
    const jsonValue = await AsyncStorage.getItem(USUARIOS_KEY);
    const usuarios = jsonValue != null ? JSON.parse(jsonValue) : [];
    if (usuarios.find(u => u.email === email)) {
      return { sucesso: false, erro: 'Este e-mail já está cadastrado.' };
    }
    const novoUsuario = { nome, email, senha };
    usuarios.push(novoUsuario);
    await AsyncStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
    return { sucesso: true, usuario: novoUsuario };
  } catch {
    return { sucesso: false, erro: 'Erro ao cadastrar usuário.' };
  }
};

export const fazerLogin = async (email, senha) => {
  try {
    const jsonValue = await AsyncStorage.getItem(USUARIOS_KEY);
    const usuarios = jsonValue != null ? JSON.parse(jsonValue) : [];
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    if (usuario) return { sucesso: true, usuario };
    return { sucesso: false, erro: 'E-mail ou senha incorretos.' };
  } catch {
    return { sucesso: false, erro: 'Erro ao fazer login.' };
  }
};

export const vincularBiometria = async (email) => {
  try {
    await AsyncStorage.setItem(BIOMETRIA_VINCULADA_KEY, email);
  } catch (e) {
    console.log('Erro ao vincular biometria', e);
  }
};

export const checarBiometriaVinculada = async () => {
  try {
    return await AsyncStorage.getItem(BIOMETRIA_VINCULADA_KEY);
  } catch {
    return null;
  }
};

export const desvincularBiometria = async () => {
  try {
    await AsyncStorage.removeItem(BIOMETRIA_VINCULADA_KEY);
  } catch (e) {
    console.log('Erro ao desvincular biometria', e);
  }
};

export const buscarUsuarioPorEmail = async (email) => {
  try {
    const jsonValue = await AsyncStorage.getItem(USUARIOS_KEY);
    const usuarios = jsonValue != null ? JSON.parse(jsonValue) : [];
    return usuarios.find(u => u.email === email) || null;
  } catch {
    return null;
  }
};

export const atualizarFotoUsuario = async (email, fotoUri) => {
  try {
    const jsonValue = await AsyncStorage.getItem(USUARIOS_KEY);
    const usuarios = jsonValue != null ? JSON.parse(jsonValue) : [];
    const index = usuarios.findIndex(u => u.email === email);
    if (index === -1) return { sucesso: false, erro: 'Usuário não encontrado.' };
    usuarios[index] = { ...usuarios[index], fotoUri: fotoUri ?? null };
    await AsyncStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
    return { sucesso: true, usuario: usuarios[index] };
  } catch {
    return { sucesso: false, erro: 'Erro ao atualizar foto.' };
  }
};

// ─── Envelopes (SQLite + sync_queue + RTDB) ───────────────────────────────────

export const criarEnvelope = async ({ nome, categoria, orcamento }) => {
  const now = new Date().toISOString();
  const id = gerarId();
  const envelope = {
    id,
    nome,
    categoria: categoria ?? 'Geral',
    orcamento,
    saldo: orcamento,
    valor_despesa: null,
    recibo_base64: null,
    localizacao: null,
    deleted: 0,
    synced: 0,
    created_at: now,
    updated_at: now,
  };
  await inserirEnvelopeLocal(envelope);
  await adicionarNaFila('CREATE', envelopeParaPayload(envelope));
  sincronizar().catch(() => {});
  return id;
};

export const ouvirEnvelopes = (callback) => {
  buscarEnvelopesLocais().then(callback).catch(() => callback([]));

  const userKey = getCurrentUser();
  const unsubscribe = onValue(
    ref(db, `users/${userKey}/envelopes`),
    async (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          for (const key of Object.keys(data)) {
            await upsertEnvelopeDoFirebase({ id: key, ...data[key] });
          }
        }
        const local = await buscarEnvelopesLocais();
        callback(local);
      } catch {
        buscarEnvelopesLocais().then(callback).catch(() => callback([]));
      }
    },
    () => {
      buscarEnvelopesLocais().then(callback).catch(() => callback([]));
    }
  );

  return unsubscribe;
};

export const atualizarEnvelope = async (id, campos) => {
  try {
    await atualizarEnvelopeLocal(id, campos);
    const row = await buscarEnvelopePorId(id);
    if (row) {
      await adicionarNaFila('UPDATE', envelopeParaPayload(row));
      sincronizar().catch(() => {});
    }
  } catch (error) {
    Alert.alert('Erro', 'Erro ao atualizar envelope. Tente novamente.');
    throw error;
  }
};

export const removerEnvelope = async (id) => {
  try {
    await deletarEnvelope(id);
    await adicionarNaFila('DELETE', { id });
    sincronizar().catch(() => {});
  } catch (error) {
    Alert.alert('Erro', 'Erro ao remover envelope. Tente novamente.');
    throw error;
  }
};

// REMOVIDO — sem efeito com saldo derivado. UI e importação serão removidos no Passo 6.
export const transferirSaldo = async () => {
  console.warn('[storage] transferirSaldo removida — será reimplementada como moverOrcamento no item 10');
};

// ─── Transações ───────────────────────────────────────────────────────────────

export const criarTransacao = async ({ envelope_id, valor, descricao, recibo_base64, localizacao }) => {
  try {
    const now = new Date().toISOString();
    const id = gerarId();
    const transacao = {
      id,
      envelope_id,
      valor,
      descricao: descricao ?? null,
      recibo_base64: recibo_base64 ?? null,
      localizacao: localizacao ?? null,
      synced: 0,
      created_at: now,
      updated_at: now,
    };
    await inserirTransacaoLocal(transacao);
    await adicionarNaFila('CREATE', transacaoParaPayload(transacao));
    sincronizar().catch(() => {});
    return id;
  } catch (error) {
    Alert.alert('Erro', 'Erro ao registrar transação. Tente novamente.');
    throw error;
  }
};

export const removerTransacao = async (id) => {
  try {
    await deletarTransacao(id);
    await adicionarNaFila('DELETE', { tabela: 'transacoes', id });
    sincronizar().catch(() => {});
  } catch (error) {
    Alert.alert('Erro', 'Erro ao remover transação. Tente novamente.');
    throw error;
  }
};

export const ouvirTransacoes = (callback) => {
  buscarTransacoesLocais().then(callback).catch(() => callback([]));

  // guarda (c): path computado UMA VEZ no momento do registro, não a cada callback
  const userKey = getCurrentUser();
  const unsubscribe = onValue(
    ref(db, `users/${userKey}/transacoes`),
    async (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          for (const key of Object.keys(data)) {
            await upsertTransacaoDoFirebase({ id: key, ...data[key] });
          }
        }
        const local = await buscarTransacoesLocais();
        callback(local);
      } catch {
        buscarTransacoesLocais().then(callback).catch(() => callback([]));
      }
    },
    () => {
      buscarTransacoesLocais().then(callback).catch(() => callback([]));
    }
  );

  return unsubscribe;
};

// ─── Contas ───────────────────────────────────────────────────────────────────

export const criarConta = async ({ nome, tipo, saldo, vencimento }) => {
  const now = new Date().toISOString();
  const id = gerarId();
  const conta = {
    id,
    nome,
    tipo: tipo ?? 'Corrente',
    saldo: saldo ?? 0,
    vencimento: vencimento ?? null,
    synced: 0,
    created_at: now,
    updated_at: now,
  };
  await inserirContaLocal(conta);
  await adicionarNaFila('CREATE', contaParaPayload(conta));
  sincronizar().catch(() => {});
  return id;
};

export const ouvirContas = (callback) => {
  buscarContasLocais().then(callback).catch(() => callback([]));

  const userKey = getCurrentUser();
  const unsubscribe = onValue(
    ref(db, `users/${userKey}/contas`),
    async (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          for (const key of Object.keys(data)) {
            await upsertContaDoFirebase({ id: key, ...data[key] });
          }
        }
        const local = await buscarContasLocais();
        callback(local);
      } catch {
        buscarContasLocais().then(callback).catch(() => callback([]));
      }
    },
    () => {
      buscarContasLocais().then(callback).catch(() => callback([]));
    }
  );

  return unsubscribe;
};

export const atualizarConta = async (id, campos) => {
  try {
    await atualizarContaLocal(id, campos);
    const row = await buscarContaPorId(id);
    if (row) {
      await adicionarNaFila('UPDATE', contaParaPayload(row));
      sincronizar().catch(() => {});
    }
  } catch (error) {
    Alert.alert('Erro', 'Erro ao atualizar conta. Tente novamente.');
    throw error;
  }
};

export const removerConta = async (id) => {
  try {
    await deletarConta(id);
    await adicionarNaFila('DELETE', { tabela: 'contas', id });
    sincronizar().catch(() => {});
  } catch (error) {
    Alert.alert('Erro', 'Erro ao remover conta. Tente novamente.');
    throw error;
  }
};
