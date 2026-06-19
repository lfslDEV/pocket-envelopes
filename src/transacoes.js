import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radius } from './theme';

export default function Transacoes() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icone}>📊</Text>
        <Text style={styles.titulo}>Transações</Text>
        <Text style={styles.descricao}>
          Em breve: histórico completo de despesas e transferências entre envelopes.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
  },
  icone: {
    fontSize: 52,
    marginBottom: spacing.lg,
  },
  titulo: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  descricao: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
