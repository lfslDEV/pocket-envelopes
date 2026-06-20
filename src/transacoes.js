import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, typography, spacing, radius, shadow } from './theme';
import { ouvirTransacoes, removerTransacao } from './storage';
import { buscarTransacoesLocais } from './database';

function formatarValor(valor) {
  return '- R$ ' + Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarData(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

// ─── Modal de recibo em tela cheia ────────────────────────────────────────────
function ModalRecibo({ uri, onFechar }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.reciboOverlay}>
        <TouchableOpacity style={styles.reciboFechar} onPress={onFechar} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.reciboFecharTexto}>✕</Text>
        </TouchableOpacity>
        <Image source={{ uri }} style={styles.reciboFullscreen} resizeMode="contain" />
      </View>
    </Modal>
  );
}

// ─── Card de transação ────────────────────────────────────────────────────────
function CardTransacao({ item, onAbrirRecibo, onAbrirMapa, onExcluir }) {
  const reciboUri = item.recibo_base64
    ? (item.recibo_base64.startsWith('data:') || item.recibo_base64.startsWith('file:')
      ? item.recibo_base64
      : `data:image/jpeg;base64,${item.recibo_base64}`)
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.envelopeNome} numberOfLines={1}>
          {item.envelope_nome ?? 'Envelope removido'}
        </Text>
        <View style={styles.headerDireita}>
          <Text style={styles.valor}>{formatarValor(item.valor)}</Text>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onExcluir(item)}
          >
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.data}>{formatarData(item.created_at)}</Text>
      {item.descricao ? (
        <Text style={styles.descricao}>{item.descricao}</Text>
      ) : null}

      <View style={styles.actionsRow}>
        <View style={styles.reciboWrapper}>
          {reciboUri ? (
            <TouchableOpacity onPress={() => onAbrirRecibo(reciboUri)} activeOpacity={0.8}>
              <Image source={{ uri: reciboUri }} style={styles.miniatura} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.semRecibo}>Sem recibo</Text>
          )}
        </View>

        {item.localizacao ? (
          <TouchableOpacity
            style={[styles.btnAction, styles.btnMapa]}
            onPress={() => onAbrirMapa(item.localizacao)}
          >
            <Text style={[styles.btnActionText, styles.btnMapaText]}>📍 Local</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function Transacoes({ onAbrirMapa, onGastoAlterado }) {
  const [transacoes, setTransacoes] = useState([]);
  const [reciboModal, setReciboModal] = useState(null);

  const recarregarTransacoes = () => buscarTransacoesLocais().then(setTransacoes);

  useEffect(() => {
    const unsub = ouvirTransacoes(setTransacoes);
    return () => unsub();
  }, []);

  const handleExcluir = (item) => {
    Alert.alert(
      'Excluir transação',
      `Excluir despesa de ${formatarValor(item.valor)} em "${item.envelope_nome ?? 'envelope removido'}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerTransacao(item.id);
              recarregarTransacoes();
              onGastoAlterado?.();
            } catch (e) {
              console.log('Erro ao excluir transação', e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={transacoes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioIcone}>📋</Text>
            <Text style={styles.vazioTexto}>Nenhuma transação registrada ainda.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <CardTransacao
            item={item}
            onAbrirRecibo={setReciboModal}
            onAbrirMapa={onAbrirMapa}
            onExcluir={handleExcluir}
          />
        )}
      />

      <ModalRecibo uri={reciboModal} onFechar={() => setReciboModal(null)} />
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
    gap: spacing.sm,
  },

  // ── Card ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  envelopeNome: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  valor: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.danger,
  },
  deleteText: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontWeight: typography.bold,
  },
  data: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  descricao: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  // ── Ações ──
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  reciboWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniatura: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  semRecibo: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  btnAction: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnActionText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  btnMapa: {
    backgroundColor: colors.accentLight,
    borderColor: '#BFDBFE',
  },
  btnMapaText: {
    color: colors.accent,
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
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Modal de recibo fullscreen ──
  reciboOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reciboFullscreen: {
    width: '100%',
    height: '80%',
  },
  reciboFechar: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  reciboFecharTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
