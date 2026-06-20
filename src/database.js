import * as SQLite from 'expo-sqlite';

let db = null;
let dbUserKey = null;

export async function initDB(userKey) {
  if (db && dbUserKey === userKey) return db;
  db = await SQLite.openDatabaseAsync(`pocket_envelopes_${userKey}.db`);
  dbUserKey = userKey;
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS envelopes (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT DEFAULT 'Geral',
      orcamento REAL DEFAULT 0,
      saldo REAL DEFAULT 0,
      valor_despesa REAL,
      recibo_base64 TEXT,
      localizacao TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS contas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'Corrente',
      saldo REAL DEFAULT 0,
      vencimento TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transacoes (
      id TEXT PRIMARY KEY,
      envelope_id TEXT NOT NULL,
      valor REAL NOT NULL,
      descricao TEXT,
      recibo_base64 TEXT,
      localizacao TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_transacoes_envelope_id ON transacoes(envelope_id);
  `);
  // Migração: remover coluna deleted se vier do schema anterior
  try {
    await db.execAsync('ALTER TABLE envelopes DROP COLUMN deleted;');
  } catch {}
  return db;
}

export function getDB() {
  return db;
}

export function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

export async function inserirEnvelopeLocal(envelope) {
  const d = getDB();
  await d.runAsync(
    `INSERT OR REPLACE INTO envelopes
      (id, nome, categoria, orcamento, saldo, valor_despesa, recibo_base64, localizacao, synced, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      envelope.id,
      envelope.nome,
      envelope.categoria ?? 'Geral',
      envelope.orcamento ?? 0,
      envelope.saldo ?? envelope.orcamento ?? 0,
      envelope.valor_despesa ?? null,
      envelope.recibo_base64 ?? null,
      envelope.localizacao != null ? JSON.stringify(envelope.localizacao) : null,
      envelope.synced ?? 0,
      envelope.created_at ?? new Date().toISOString(),
      envelope.updated_at ?? new Date().toISOString(),
    ]
  );
}

// Saldo é derivado: orcamento − soma das transações do envelope
export async function buscarEnvelopesLocais() {
  const d = getDB();
  const rows = await d.getAllAsync(
    `SELECT e.*,
       (e.orcamento - COALESCE(SUM(t.valor), 0)) AS saldo
     FROM envelopes e
     LEFT JOIN transacoes t ON t.envelope_id = e.id
     GROUP BY e.id
     ORDER BY e.created_at DESC`
  );
  return rows.map(r => ({
    ...r,
    localizacao: r.localizacao ? JSON.parse(r.localizacao) : null,
  }));
}

export async function atualizarEnvelopeLocal(id, campos) {
  const d = getDB();
  const now = new Date().toISOString();
  const mapeados = { ...campos };
  if (mapeados.localizacao != null) {
    mapeados.localizacao = JSON.stringify(mapeados.localizacao);
  }
  const chaves = Object.keys(mapeados);
  const sets = chaves.map(k => `${k} = ?`).join(', ');
  const vals = chaves.map(k => mapeados[k] ?? null);
  await d.runAsync(
    `UPDATE envelopes SET ${sets}, updated_at = ?, synced = 0 WHERE id = ?`,
    [...vals, now, id]
  );
}

export async function deletarEnvelope(id) {
  const d = getDB();
  await d.runAsync(`DELETE FROM envelopes WHERE id = ?`, [id]);
}

export async function buscarEnvelopePorId(id) {
  const d = getDB();
  const row = await d.getFirstAsync(`SELECT * FROM envelopes WHERE id = ?`, [id]);
  if (!row) return null;
  return { ...row, localizacao: row.localizacao ? JSON.parse(row.localizacao) : null };
}

export async function upsertEnvelopeDoFirebase(raw) {
  const d = getDB();
  const local = await d.getFirstAsync(
    `SELECT updated_at FROM envelopes WHERE id = ?`, [raw.id]
  );
  const remoteUpdated = raw.updated_at ?? raw.createdAt ?? '1970-01-01T00:00:00.000Z';
  if (local && new Date(local.updated_at) > new Date(remoteUpdated)) return;

  // saldo não é sincronizado — é derivado via JOIN em buscarEnvelopesLocais
  const envelope = {
    id: raw.id,
    nome: raw.nome ?? '',
    categoria: raw.categoria ?? 'Geral',
    orcamento: raw.orcamento ?? 0,
    saldo: 0, // coluna legada; valor real vem do JOIN
    valor_despesa: null,
    recibo_base64: null,
    localizacao: null,
    synced: 1,
    created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    updated_at: remoteUpdated,
  };
  await inserirEnvelopeLocal(envelope);
}

// Remove localmente envelopes que não existem mais no Firebase (deletados em outro dispositivo)
export async function removerEnvelopesAusentesDoFirebase(idsPresentes) {
  const d = getDB();
  const locais = await d.getAllAsync(`SELECT id FROM envelopes`);
  for (const row of locais) {
    if (!idsPresentes.has(row.id)) {
      await d.runAsync(`DELETE FROM envelopes WHERE id = ?`, [row.id]);
    }
  }
}

export async function adicionarNaFila(operation, payload) {
  const d = getDB();
  await d.runAsync(
    `INSERT INTO sync_queue (operation, payload, created_at) VALUES (?, ?, ?)`,
    [operation, JSON.stringify(payload), new Date().toISOString()]
  );
}

export async function buscarFila() {
  const d = getDB();
  return d.getAllAsync(`SELECT * FROM sync_queue ORDER BY id ASC`);
}

export async function removerDaFila(id) {
  const d = getDB();
  await d.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
}

export function envelopeParaPayload(row) {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    orcamento: row.orcamento,
    // saldo omitido: é derivado de transacoes, não faz sentido sincronizar
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ─── Contas ───────────────────────────────────────────────────────────────────

export async function inserirContaLocal(conta) {
  const d = getDB();
  await d.runAsync(
    `INSERT OR REPLACE INTO contas
      (id, nome, tipo, saldo, vencimento, synced, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conta.id,
      conta.nome,
      conta.tipo ?? 'Corrente',
      conta.saldo ?? 0,
      conta.vencimento ?? null,
      conta.synced ?? 0,
      conta.created_at ?? new Date().toISOString(),
      conta.updated_at ?? new Date().toISOString(),
    ]
  );
}

export async function buscarContasLocais() {
  const d = getDB();
  return d.getAllAsync(`SELECT * FROM contas ORDER BY created_at DESC`);
}

export async function buscarContaPorId(id) {
  const d = getDB();
  return d.getFirstAsync(`SELECT * FROM contas WHERE id = ?`, [id]);
}

export async function atualizarContaLocal(id, campos) {
  const d = getDB();
  const now = new Date().toISOString();
  const chaves = Object.keys(campos);
  const sets = chaves.map(k => `${k} = ?`).join(', ');
  const vals = chaves.map(k => campos[k] ?? null);
  await d.runAsync(
    `UPDATE contas SET ${sets}, updated_at = ?, synced = 0 WHERE id = ?`,
    [...vals, now, id]
  );
}

export async function deletarConta(id) {
  const d = getDB();
  await d.runAsync(`DELETE FROM contas WHERE id = ?`, [id]);
}

export async function upsertContaDoFirebase(raw) {
  const d = getDB();
  const local = await d.getFirstAsync(`SELECT updated_at FROM contas WHERE id = ?`, [raw.id]);
  const remoteUpdated = raw.updated_at ?? '1970-01-01T00:00:00.000Z';
  if (local && new Date(local.updated_at) > new Date(remoteUpdated)) return;
  await inserirContaLocal({ ...raw, synced: 1, updated_at: remoteUpdated });
}

export async function removerContasAusentesDoFirebase(idsPresentes) {
  const d = getDB();
  const locais = await d.getAllAsync(`SELECT id FROM contas`);
  for (const row of locais) {
    if (!idsPresentes.has(row.id)) {
      await d.runAsync(`DELETE FROM contas WHERE id = ?`, [row.id]);
    }
  }
}

export function contaParaPayload(row) {
  return {
    tabela: 'contas',
    id: row.id,
    nome: row.nome,
    tipo: row.tipo,
    saldo: row.saldo,
    vencimento: row.vencimento ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ─── Transações ───────────────────────────────────────────────────────────────

export async function inserirTransacaoLocal(transacao) {
  const d = getDB();
  await d.runAsync(
    `INSERT OR REPLACE INTO transacoes
      (id, envelope_id, valor, descricao, recibo_base64, localizacao, synced, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transacao.id,
      transacao.envelope_id,
      transacao.valor,
      transacao.descricao ?? null,
      transacao.recibo_base64 ?? null,
      transacao.localizacao != null ? JSON.stringify(transacao.localizacao) : null,
      transacao.synced ?? 0,
      transacao.created_at,
      transacao.updated_at,
    ]
  );
}

export async function buscarTransacoesLocais() {
  const d = getDB();
  const rows = await d.getAllAsync(
    `SELECT t.*, e.nome AS envelope_nome
     FROM transacoes t
     LEFT JOIN envelopes e ON e.id = t.envelope_id
     ORDER BY t.created_at DESC`
  );
  return rows.map(r => ({
    ...r,
    localizacao: r.localizacao ? JSON.parse(r.localizacao) : null,
  }));
}

export async function deletarTransacao(id) {
  const d = getDB();
  await d.runAsync(`DELETE FROM transacoes WHERE id = ?`, [id]);
}

export async function upsertTransacaoDoFirebase(raw) {
  const d = getDB();
  const local = await d.getFirstAsync(
    `SELECT updated_at FROM transacoes WHERE id = ?`, [raw.id]
  );
  const remoteUpdated = raw.updated_at ?? '1970-01-01T00:00:00.000Z';
  if (local && new Date(local.updated_at) > new Date(remoteUpdated)) return;
  await inserirTransacaoLocal({
    ...raw,
    synced: 1,
    updated_at: remoteUpdated,
  });
}

export async function removerTransacoesAusentesDoFirebase(idsPresentes) {
  const d = getDB();
  const locais = await d.getAllAsync(`SELECT id FROM transacoes`);
  for (const row of locais) {
    if (!idsPresentes.has(row.id)) {
      await d.runAsync(`DELETE FROM transacoes WHERE id = ?`, [row.id]);
    }
  }
}

export function transacaoParaPayload(row) {
  return {
    tabela: 'transacoes',
    id: row.id,
    envelope_id: row.envelope_id,
    valor: row.valor,
    descricao: row.descricao ?? null,
    recibo_base64: row.recibo_base64 ?? null,
    localizacao: row.localizacao != null
      ? (typeof row.localizacao === 'string' ? JSON.parse(row.localizacao) : row.localizacao)
      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
