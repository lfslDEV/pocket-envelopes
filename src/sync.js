import { ref, set, get, child, remove } from 'firebase/database';
import { db as rtdb } from '../firebaseConfig';
import {
  buscarFila,
  removerDaFila,
  upsertEnvelopeDoFirebase,
} from './database';

async function enviarFilaParaFirebase() {
  const fila = await buscarFila();
  for (const item of fila) {
    const payload = JSON.parse(item.payload);
    const envelopeRef = ref(rtdb, `envelopes/${payload.id}`);
    try {
      if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
        await set(envelopeRef, payload);
      } else if (item.operation === 'DELETE') {
        await remove(envelopeRef);
      }
      await removerDaFila(item.id);
    } catch {
      break;
    }
  }
}

async function buscarFirebaseParaLocal() {
  try {
    const snapshot = await get(child(ref(rtdb), 'envelopes'));
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    for (const key of Object.keys(data)) {
      await upsertEnvelopeDoFirebase({ id: key, ...data[key] });
    }
  } catch (e) {
    console.log('Erro ao buscar do Firebase:', e);
  }
}

export async function sincronizar() {
  await enviarFilaParaFirebase();
  await buscarFirebaseParaLocal();
}
