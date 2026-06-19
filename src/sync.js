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
    const idsProtegidos = new Set();

    // IDs com operação pendente na fila nunca são apagados pela reconciliação:
    // o envelope pode ainda não ter subido ao Firebase (CREATE offline, falha parcial),
    // então sua ausência no snapshot não significa que foi deletado remotamente.
    const filaPendente = await buscarFila();
    for (const item of filaPendente) {
      idsProtegidos.add(JSON.parse(item.payload).id);
    }

    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key of Object.keys(data)) {
        await upsertEnvelopeDoFirebase({ id: key, ...data[key] });
        idsProtegidos.add(key);
      }
    }

    // Só remove o que não está no Firebase E não tem operação pendente
    await removerEnvelopesAusentesDoFirebase(idsProtegidos);
  } catch (e) {
    console.log('Erro ao buscar do Firebase:', e);
  }
}

export async function sincronizar() {
  await enviarFilaParaFirebase();
  await buscarFirebaseParaLocal();
}
