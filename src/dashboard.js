import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radius, shadow, healthColor } from './theme';

function CartaoResumo({ label, valor, cor }) {
  return (
    <View style={[styles.cartao, { borderLeftColor: cor }]}>
      <Text style={styles.cartaoLabel}>{label}</Text>
      <Text style={[styles.cartaoValor, { color: cor }]}>
        R$ {Number(valor).toFixed(2)}
      </Text>
    </View>
  );
}

function BarraProgresso({ gasto, total }) {
  if (!total || total <= 0) return null;
  const pct = Math.min(Math.max(gasto / total, 0), 1);
  const hc = healthColor(total - gasto, total);
  return (
    <View style={styles.barraTrack}>
      <View style={[styles.barraFill, { width: `${pct * 100}%`, backgroundColor: hc.border }]} />
    </View>
  );
}

export default function Dashboard({ envelopes, userData }) {
  const totalOrcado = envelopes.reduce((s, e) => s + (e.orcamento ?? 0), 0);
  const totalDisponivel = envelopes.reduce((s, e) => s + (e.saldo ?? 0), 0);
  const totalGasto = totalOrcado - totalDisponivel;
  const qtdEnvelopes = envelopes.length;
  const qtdEstourados = envelopes.filter(e => (e.saldo ?? 0) <= 0 && (e.orcamento ?? 0) > 0).length;
  const qtdAlerta = envelopes.filter(e => {
    const s = e.saldo ?? 0;
    const o = e.orcamento ?? 0;
    return o > 0 && s > 0 && s < o * 0.2;
  }).length;

  const pctUsado = totalOrcado > 0 ? Math.round((totalGasto / totalOrcado) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={require('../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.saudacao}>
        Olá{userData?.nome ? `, ${userData.nome.split(' ')[0]}` : ''}! 👋
      </Text>
      <Text style={styles.subtitulo}>Aqui está o resumo do seu orçamento</Text>

      <View style={styles.secao}>
        <CartaoResumo label="Total orçado" valor={totalOrcado} cor={colors.textSecondary} />
        <CartaoResumo label="Total disponível" valor={totalDisponivel} cor={colors.brand} />
        <CartaoResumo label="Total gasto" valor={totalGasto} cor={colors.danger} />
      </View>

      <View style={[styles.card, styles.cardProgresso]}>
        <View style={styles.progressoHeader}>
          <Text style={styles.progressoTitulo}>Uso do orçamento</Text>
          <Text style={styles.progressoPct}>{pctUsado}%</Text>
        </View>
        <BarraProgresso gasto={totalGasto} total={totalOrcado} />
        <Text style={styles.progressoRodape}>
          R$ {totalGasto.toFixed(2)} de R$ {totalOrcado.toFixed(2)} utilizados
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.brandLight }]}>
          <Text style={styles.statNum}>{qtdEnvelopes}</Text>
          <Text style={styles.statLabel}>Envelopes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.healthWarnBg }]}>
          <Text style={[styles.statNum, { color: colors.healthWarn }]}>{qtdAlerta}</Text>
          <Text style={styles.statLabel}>Em alerta</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.dangerLight }]}>
          <Text style={[styles.statNum, { color: colors.danger }]}>{qtdEstourados}</Text>
          <Text style={styles.statLabel}>Estourados</Text>
        </View>
      </View>

      {envelopes.length > 0 && (
        <View style={styles.secaoGrafico}>
          <Text style={styles.secaoGraficoTitulo}>Orçado vs Gasto</Text>
          {envelopes.map(item => {
            const gasto = (item.orcamento ?? 0) - (item.saldo ?? 0);
            const orcamento = item.orcamento ?? 0;
            return (
              <View key={item.id} style={styles.graficoItem}>
                <View style={styles.graficoHeader}>
                  <Text style={styles.graficoNome} numberOfLines={1}>{item.nome}</Text>
                  <Text style={styles.graficoValores}>
                    R$ {gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / R$ {orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <BarraProgresso gasto={gasto} total={orcamento} />
              </View>
            );
          })}
        </View>
      )}

      {qtdEnvelopes === 0 && (
        <View style={styles.vazio}>
          <Text style={styles.vazioIcone}>📋</Text>
          <Text style={styles.vazioTexto}>Nenhum envelope ainda.</Text>
          <Text style={styles.vazioSub}>Vá para a aba Envelopes e crie o primeiro!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  logo: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  saudacao: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitulo: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  secao: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    borderLeftWidth: 4,
    ...shadow.card,
  },
  cartaoLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  cartaoValor: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  cardProgresso: {},
  progressoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressoTitulo: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  progressoPct: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textSecondary,
  },
  barraTrack: {
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  barraFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressoRodape: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNum: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.brandDark,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

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
    marginBottom: spacing.xs,
  },
  vazioSub: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },

  secaoGrafico: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  secaoGraficoTitulo: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  graficoItem: {
    marginBottom: spacing.md,
  },
  graficoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  graficoNome: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
    fontWeight: typography.medium,
    marginRight: spacing.sm,
  },
  graficoValores: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
});
