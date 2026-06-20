import { ref, set, get, child, remove } from 'firebase/database';
import { db as rtdb } from '../firebaseConfig';
import {
  buscarFila,
  removerDaFila,
  upsertEnvelopeDoFirebase,
  removerEnvelopesAusentesDoFirebase,
  upsertContaDoFirebase,
  removerContasAusentesDoFirebase,
} from './database';
import { getCurrentUser } from './userKey';

async function enviarFilaParaFirebase(userKey) {
  const fila = await buscarFila();
  for (const item of fila) {
    const payload = JSON.parse(item.payload);
    // tabela ausente no payload = envelope (compatibilidade com registros antigos)
    const tabela = payload.tabela ?? 'envelopes';
    const path = `users/${userKey}/${tabela}/${payload.id}`;
    const itemRef = ref(rtdb, path);
    try {
      if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
        await set(itemRef, payload);
      } else if (item.operation === 'DELETE') {
        await remove(itemRef);
      }
      await removerDaFila(item.id);
    } catch (e) {
      console.warn('[sync] erro ao enviar para o RTDB:', path, e);
      break;
    }
  }
}

async function buscarEnvelopesDoFirebase(userKey) {
  try {
    const snapshot = await get(child(ref(rtdb), `users/${userKey}/envelopes`));
    const idsProtegidos = new Set();

    const filaPendente = await buscarFila();
    for (const item of filaPendente) {
      const payload = JSON.parse(item.payload);
      if ((payload.tabela ?? 'envelopes') === 'envelopes') {
        idsProtegidos.add(payload.id);
      }
    }

    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key of Object.keys(data)) {
        await upsertEnvelopeDoFirebase({ id: key, ...data[key] });
        idsProtegidos.add(key);
      }
    }

    await removerEnvelopesAusentesDoFirebase(idsProtegidos);
  } catch (e) {
    console.log('Erro ao buscar envelopes do Firebase:', e);
  }
}

async function buscarContasDoFirebase(userKey) {
  try {
    const snapshot = await get(child(ref(rtdb), `users/${userKey}/contas`));
    const idsProtegidos = new Set();

    const filaPendente = await buscarFila();
    for (const item of filaPendente) {
      const payload = JSON.parse(item.payload);
      if (payload.tabela === 'contas') {
        idsProtegidos.add(payload.id);
      }
    }

    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key of Object.keys(data)) {
        await upsertContaDoFirebase({ id: key, ...data[key] });
        idsProtegidos.add(key);
      }
    }

    await removerContasAusentesDoFirebase(idsProtegidos);
  } catch (e) {
    console.log('Erro ao buscar contas do Firebase:', e);
  }
}

export async function sincronizar() {
  const userKey = getCurrentUser();
  if (!userKey) return;
  await enviarFilaParaFirebase(userKey);
  await buscarEnvelopesDoFirebase(userKey);
  await buscarContasDoFirebase(userKey);
}
