import { ref, set, get, child, remove } from 'firebase/database';
import { db as rtdb } from '../firebaseConfig';
import {
  buscarFila,
  removerDaFila,
  upsertEnvelopeDoFirebase,
  removerEnvelopesAusentesDoFirebase,
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
    const idsNoFirebase = new Set();

    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key of Object.keys(data)) {
        await upsertEnvelopeDoFirebase({ id: key, ...data[key] });
        idsNoFirebase.add(key);
      }
    }

    // Envelopes que sumiram do Firebase foram deletados em outro dispositivo
    await removerEnvelopesAusentesDoFirebase(idsNoFirebase);
  } catch (e) {
    console.log('Erro ao buscar do Firebase:', e);
  }
}

export async function sincronizar() {
  await enviarFilaParaFirebase();
  await buscarFirebaseParaLocal();
}
