import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { criarConta, ouvirContas, atualizarConta, removerConta } from './storage';
import { buscarContasLocais } from './database';
import { colors, typography, spacing, radius, shadow } from './theme';

const TIPOS = ['Corrente', 'Poupança', 'Cartão', 'Dinheiro'];

const ICONE_TIPO = {
  Corrente:  '🏦',
  Poupança:  '💰',
  Cartão:    '💳',
  Dinheiro:  '💵',
};

// ─── Formulário de adicionar ──────────────────────────────────────────────────
function FormConta({ onAdicionar }) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Corrente');
  const [saldo, setSaldo] = useState('');
  const [vencimento, setVencimento] = useState('');

  const handleAdd = () => {
    if (nome.trim() === '') {
      Alert.alert('Atenção', 'Informe um nome para a conta.');
      return;
    }
    const saldoNum = Number(saldo.replace(',', '.'));
    if (isNaN(saldoNum)) {
      Alert.alert('Atenção', 'Saldo inválido. Use apenas números.');
      return;
    }
    const diaNum = vencimento.trim() !== '' ? Number(vencimento) : null;
    if (diaNum !== null && (isNaN(diaNum) || diaNum < 1 || diaNum > 31)) {
      Alert.alert('Atenção', 'Dia de vencimento inválido (1–31).');
      return;
    }
    onAdicionar({ nome: nome.trim(), tipo, saldo: saldoNum, vencimento: diaNum });
    setNome('');
    setSaldo('');
    setVencimento('');
  };

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Nome da conta (ex: Nubank, Bradesco)"
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.chipLabel}>Tipo</Text>
      <View style={styles.chips}>
        {TIPOS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, tipo === t && styles.chipAtivo]}
            onPress={() => setTipo(t)}
          >
            <Text style={[styles.chipTexto, tipo === t && styles.chipTextoAtivo]}>
              {ICONE_TIPO[t]} {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Saldo atual (ex: 1500.00)"
        value={saldo}
        onChangeText={setSaldo}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Dia do vencimento — opcional (ex: 10)"
        value={vencimento}
        onChangeText={setVencimento}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.botaoAdicionar} onPress={handleAdd}>
        <Text style={styles.botaoAdicionarTexto}>Adicionar Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Modal de edição ──────────────────────────────────────────────────────────
function ModalEditar({ conta, onSalvar, onFechar }) {
  const [nome, setNome] = useState(conta?.nome ?? '');
  const [tipo, setTipo] = useState(conta?.tipo ?? 'Corrente');
  const [saldo, setSaldo] = useState(conta?.saldo != null ? String(conta.saldo) : '');
  const [vencimento, setVencimento] = useState(conta?.vencimento != null ? String(conta.vencimento) : '');

  const handleSalvar = () => {
    if (nome.trim() === '') {
      Alert.alert('Atenção', 'Informe um nome para a conta.');
      return;
    }
    const saldoNum = Number(saldo.replace(',', '.'));
    if (isNaN(saldoNum)) {
      Alert.alert('Atenção', 'Saldo inválido.');
      return;
    }
    const diaNum = vencimento.trim() !== '' ? Number(vencimento) : null;
    if (diaNum !== null && (isNaN(diaNum) || diaNum < 1 || diaNum > 31)) {
      Alert.alert('Atenção', 'Dia de vencimento inválido (1–31).');
      return;
    }
    onSalvar({ nome: nome.trim(), tipo, saldo: saldoNum, vencimento: diaNum });
  };

  return (
    <Modal visible={conta !== null} transparent animationType="slide" onRequestClose={onFechar}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitulo}>Editar Conta</Text>

          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome" />

          <Text style={styles.chipLabel}>Tipo</Text>
          <View style={styles.chips}>
            {TIPOS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, tipo === t && styles.chipAtivo]}
                onPress={() => setTipo(t)}
              >
                <Text style={[styles.chipTexto, tipo === t && styles.chipTextoAtivo]}>
                  {ICONE_TIPO[t]} {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={saldo}
            onChangeText={setSaldo}
            placeholder="Saldo"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={vencimento}
            onChangeText={setVencimento}
            placeholder="Dia do vencimento (opcional)"
            keyboardType="numeric"
          />

          <View style={styles.modalBotoes}>
            <TouchableOpacity style={[styles.modalBotao, styles.botaoCancelar]} onPress={onFechar}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBotao, styles.botaoConfirmar]} onPress={handleSalvar}>
              <Text style={styles.botaoConfirmarTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Card de conta ────────────────────────────────────────────────────────────
function CardConta({ conta, onEditar, onDeletar }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardEsquerda}>
          <Text style={styles.cardIcone}>{ICONE_TIPO[conta.tipo] ?? '🏦'}</Text>
          <View>
            <Text style={styles.cardNome}>{conta.nome}</Text>
            <Text style={styles.cardTipo}>{conta.tipo}</Text>
          </View>
        </View>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => onDeletar(conta)}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.saldoRow}>
        <View>
          <Text style={styles.saldoLabel}>Saldo</Text>
          <Text style={[styles.saldoValor, { color: conta.saldo < 0 ? colors.danger : colors.brand }]}>
            R$ {Number(conta.saldo).toFixed(2)}
          </Text>
        </View>
        {conta.vencimento != null && (
          <View style={styles.vencimentoBadge}>
            <Text style={styles.vencimentoTexto}>Vence dia {conta.vencimento}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.botaoEditar} onPress={() => onEditar(conta)}>
        <Text style={styles.botaoEditarTexto}>✏️ Editar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function Contas() {
  const [contas, setContas] = useState([]);
  const [contaEditando, setContaEditando] = useState(null);

  const recarregarContas = () => buscarContasLocais().then(setContas);

  useEffect(() => {
    const unsub = ouvirContas(setContas);
    return () => unsub();
  }, []);

  const handleAdicionar = async (dados) => {
    try {
      await criarConta(dados);
      recarregarContas();
    } catch (e) {
      console.log('Erro ao criar conta', e);
    }
  };

  const handleSalvarEdicao = async (campos) => {
    try {
      await atualizarConta(contaEditando.id, campos);
      recarregarContas();
      setContaEditando(null);
    } catch (e) {
      console.log('Erro ao editar conta', e);
    }
  };

  const handleDeletar = (conta) => {
    Alert.alert('Excluir conta', `Excluir "${conta.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removerConta(conta.id);
            recarregarContas();
          } catch (e) { console.log(e); }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={contas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={<FormConta onAdicionar={handleAdicionar} />}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioIcone}>🏦</Text>
            <Text style={styles.vazioTexto}>Nenhuma conta ainda.</Text>
            <Text style={styles.vazioSub}>Adicione uma conta acima.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <CardConta
            conta={item}
            onEditar={setContaEditando}
            onDeletar={handleDeletar}
          />
        )}
      />

      {contaEditando && (
        <ModalEditar
          conta={contaEditando}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setContaEditando(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  lista: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  // ── Formulário ──
  form: {
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: {
    backgroundColor: colors.brandLight,
    borderColor: colors.brand,
  },
  chipTexto: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  chipTextoAtivo: {
    color: colors.brandDark,
    fontWeight: typography.bold,
  },
  botaoAdicionar: {
    backgroundColor: colors.brand,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  botaoAdicionarTexto: {
    color: colors.textOnDark,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },

  // ── Card ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIcone: {
    fontSize: 28,
  },
  cardNome: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  cardTipo: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  deleteText: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontWeight: typography.bold,
  },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  saldoLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  saldoValor: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  vencimentoBadge: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  vencimentoTexto: {
    fontSize: typography.xs,
    color: colors.accent,
    fontWeight: typography.semibold,
  },
  botaoEditar: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  botaoEditarTexto: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
  },

  // ── Modal de edição ──
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.modal,
  },
  modalTitulo: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalBotao: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  botaoCancelar: {
    backgroundColor: colors.gray200,
  },
  botaoCancelarTexto: {
    color: colors.textSecondary,
    fontWeight: typography.semibold,
  },
  botaoConfirmar: {
    backgroundColor: colors.brand,
  },
  botaoConfirmarTexto: {
    color: colors.textOnDark,
    fontWeight: typography.bold,
  },

  // ── Estado vazio ──
  vazio: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  vazioIcone: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  vazioTexto: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  vazioSub: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
