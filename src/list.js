import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors, typography, spacing, radius, shadow, healthColor } from './theme';

// ─── Barra de progresso ────────────────────────────────────────────────────────
function ProgressBar({ orcamento, saldo }) {
  if (orcamento == null || orcamento <= 0) return null;

  const gasto = orcamento - saldo;
  const pct = Math.min(Math.max(gasto / orcamento, 0), 1);
  const hc = healthColor(saldo, orcamento);

  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${pct * 100}%`, backgroundColor: hc.border },
        ]}
      />
    </View>
  );
}

// ─── Modal de confirmação de delete ───────────────────────────────────────────
function DeleteModal({ visivel, nomePasta, onConfirm, onCancel }) {
  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.deleteOverlay}>
        <View style={styles.deleteCard}>
          <View style={styles.deleteIconWrap}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </View>
          <Text style={styles.deleteTitulo}>Excluir envelope</Text>
          <Text style={styles.deleteDescricao}>
            Tem certeza que deseja excluir{' '}
            <Text style={styles.deleteNome}>"{nomePasta}"</Text>?{'\n'}
            Essa ação não pode ser desfeita.
          </Text>
          <View style={styles.deleteBotoes}>
            <TouchableOpacity
              style={[styles.deleteBotao, styles.deleteCancelar]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBotao, styles.deleteConfirmar]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteConfirmarTexto}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function ListEnvelopes({
  sections,
  deleteEnvelope,
  openCamera,
}) {
  const [colapsados, setColapsados] = useState({});
  const [deleteAlvo, setDeleteAlvo] = useState(null); // { id, nome }

  const togglePasta = (title) => {
    setColapsados((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const seccoesFiltradas = sections.map((seccao) => ({
    ...seccao,
    data: colapsados[seccao.title] ? [] : seccao.data,
  }));

  const pedirDelete = (id, nome) => setDeleteAlvo({ id, nome });

  const confirmarDelete = () => {
    if (deleteAlvo) {
      deleteEnvelope(deleteAlvo.id);
      setDeleteAlvo(null);
    }
  };

  return (
    <View style={styles.listContainer}>
      <SectionList
        sections={seccoesFiltradas}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section: { title } }) => {
          const estaFechado = colapsados[title];
          const totalItens = sections.find((s) => s.title === title).data.length;

          return (
            <TouchableOpacity
              style={styles.headerPasta}
              activeOpacity={0.7}
              onPress={() => togglePasta(title)}
            >
              <Text style={styles.chevron}>{estaFechado ? '›' : '⌄'}</Text>
              <Text style={styles.textoPasta}>{title}</Text>
              <View style={styles.contadorBadge}>
                <Text style={styles.contador}>{totalItens}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        renderItem={({ item }) => {
          const hc = healthColor(item.saldo ?? 0, item.orcamento);
          const saldoFormatado =
            item.saldo != null ? Number(item.saldo).toFixed(2) : '—';
          const orcamentoFormatado =
            item.orcamento != null ? Number(item.orcamento).toFixed(2) : '—';

          return (
            <View
              style={[
                styles.card,
                { borderLeftColor: hc.border },
              ]}
            >
              {/* Cabeçalho do card */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardNome} numberOfLines={1}>
                  {item.nome}
                </Text>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => pedirDelete(item.id, item.nome)}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Saldo e orçamento */}
              <View style={styles.valoresRow}>
                <View style={styles.valorBloco}>
                  <Text style={styles.valorLabel}>Disponível</Text>
                  <Text style={[styles.valorNumero, { color: hc.text }]}>
                    R$ {saldoFormatado}
                  </Text>
                </View>
                <View style={styles.valorDivisor} />
                <View style={styles.valorBloco}>
                  <Text style={styles.valorLabel}>Orçamento</Text>
                  <Text style={styles.valorNumeroNeutro}>
                    R$ {orcamentoFormatado}
                  </Text>
                </View>
              </View>

              {/* Barra de progresso */}
              <ProgressBar orcamento={item.orcamento} saldo={item.saldo ?? 0} />

              {/* Ações */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.btnAction}
                  onPress={() => openCamera(item.id)}
                >
                  <Text style={styles.btnActionText}>📷 Recibo</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <DeleteModal
        visivel={deleteAlvo !== null}
        nomePasta={deleteAlvo?.nome ?? ''}
        onConfirm={confirmarDelete}
        onCancel={() => setDeleteAlvo(null)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },

  headerPasta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  chevron: {
    fontSize: typography.md,
    color: colors.textMuted,
    width: 16,
    textAlign: 'center',
  },
  textoPasta: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contadorBadge: {
    backgroundColor: colors.gray200,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  contador: {
    fontSize: typography.xs,
    color: colors.gray600,
    fontWeight: typography.semibold,
  },

  // ── Card ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardNome: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  deleteText: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontWeight: typography.bold,
  },

  // ── Valores ──
  valoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  valorBloco: {
    flex: 1,
    alignItems: 'flex-start',
  },
  valorDivisor: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  valorLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  valorNumero: {
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
  valorNumeroNeutro: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  // ── Progresso ──
  progressTrack: {
    height: 4,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  // ── Ações ──
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
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

  // ── Modal de delete ──
  deleteOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  deleteCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.modal,
  },
  deleteIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  deleteIcon: {
    fontSize: 26,
  },
  deleteTitulo: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  deleteDescricao: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  deleteNome: {
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  deleteBotoes: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  deleteBotao: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  deleteCancelar: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteCancelarTexto: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  deleteConfirmar: {
    backgroundColor: colors.danger,
  },
  deleteConfirmarTexto: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textOnDark,
  },
});
