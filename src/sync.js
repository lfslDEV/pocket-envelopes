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

async function enviarFilaParaFirebase() {
  const fila = await buscarFila();
  for (const item of fila) {
    const payload = JSON.parse(item.payload);
    // tabela ausente no payload = envelope (compatibilidade com registros antigos)
    const tabela = payload.tabela ?? 'envelopes';
    const itemRef = ref(rtdb, `${tabela}/${payload.id}`);
    try {
      if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
        await set(itemRef, payload);
      } else if (item.operation === 'DELETE') {
        await remove(itemRef);
      }
      await removerDaFila(item.id);
    } catch {
      break;
    }
  }
}

async function buscarEnvelopesDoFirebase() {
  try {
    const snapshot = await get(child(ref(rtdb), 'envelopes'));
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

async function buscarContasDoFirebase() {
  try {
    const snapshot = await get(child(ref(rtdb), 'contas'));
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
  await enviarFilaParaFirebase();
  await buscarEnvelopesDoFirebase();
  await buscarContasDoFirebase();
}
