import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, SectionTitle, PrimaryButton } from './Ui';
import { colors } from './Theme';
import { INITIAL_MATRIX, MATRIX_COLS, INITIAL_PRODUTIVIDADE } from './Data';
import { calcularLeontief } from './Matrix2';

export default function MatrizLeontiefScreen() {
  const [matrix, setMatrix] = useState(INITIAL_MATRIX);
  const [produtividade] = useState(INITIAL_PRODUTIVIDADE);

  const C = useMemo(() => matrix.map((r) => r.valores), [matrix]);
  const d = useMemo(() => matrix.map((r) => r.demanda), [matrix]);

  const leontiefRes = useMemo(() => calcularLeontief(C, d), [C, d]);

  const handleValoresChange = (text, rowIndex, colIndex) => {
    const val = parseFloat(text) || 0;
    setMatrix((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[rowIndex].valores[colIndex] = Math.min(0.99, Math.max(0, val));
      return copy;
    });
  };

  const handleDemandaChange = (text, rowIndex) => {
    const val = parseFloat(text) || 0;
    setMatrix((prev) => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], demanda: Math.max(0, val) };
      return copy;
    });
  };

  const resetMatrix = () => {
    setMatrix(JSON.parse(JSON.stringify(INITIAL_MATRIX)));
  };

  const optimizeMatrix = () => {
    setMatrix((prev) =>
      prev.map((row) => ({
        ...row,
        valores: row.valores.map((v) => +Math.max(0, v * 0.9).toFixed(2)),
        eficiencia: Math.min(99, row.eficiencia + 5),
      }))
    );
    Alert.alert('Otimização Concluída', 'Coeficientes reduzidos em 10% e eficiência setorizada aumentada.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <SectionTitle
        kicker="Núcleo de Inteligência"
        title="Matriz de Insumo-Produto"
        subtitle="Interdependência setorial via modelo de Wassily Leontief e validação de Hawkins-Simons."
      />

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Coeficientes Técnicos (Matriz C)</Text>
          <View style={styles.btnRow}>
            <PrimaryButton title="Reset" onPress={resetMatrix} color="#374151" />
            <PrimaryButton title="Otimizar" onPress={optimizeMatrix} color={colors.primaryDark} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <View style={styles.tableRow}>
              <Text style={[styles.th, { width: 140 }]}>Setor \ Insumo</Text>
              {MATRIX_COLS.map((c, i) => (
                <Text key={i} style={[styles.th, styles.thCol]}>{c}</Text>
              ))}
              <Text style={[styles.th, { width: 90, textAlign: 'right' }]}>Demanda (d)</Text>
            </View>

            {matrix.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.td, { width: 140, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                  <MaterialCommunityIcons name={row.icon} size={16} color={colors.primary} />
                  <Text style={styles.rowLabel} numberOfLines={1}>{row.nome}</Text>
                </View>

                {row.valores.map((val, j) => (
                  <View key={j} style={[styles.td, { width: 70, alignItems: 'center' }]}>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={val.toString()}
                      onChangeText={(t) => handleValoresChange(t, i, j)}
                    />
                  </View>
                ))}

                <View style={[styles.td, { width: 90, alignItems: 'flex-end' }]}>
                  <TextInput
                    style={[styles.input, { width: 75, textAlign: 'right' }]}
                    keyboardType="numeric"
                    value={row.demanda.toString()}
                    onChangeText={(t) => handleDemandaChange(t, i)}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.resultBox}>
          {leontiefRes.status === 'success' ? (
            <>
              <View style={styles.resultHeader}>
                <Text style={styles.resultLabel}>Produção Total Calculada (X):</Text>
                <Text style={styles.resultValue}>
                  {leontiefRes.producaoTotal.reduce((a, b) => a + b, 0).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.formulaText}>
                Fórmula: X = (I - C)⁻¹ · d  | Det(I-C) = {leontiefRes.determinante}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2, fontWeight: '700' }}>
                ✓ Teorema de Hawkins-Simons atendido
              </Text>
            </>
          ) : (
            <Text style={{ color: colors.danger, fontWeight: '700' }}>⚠️ {leontiefRes.message}</Text>
          )}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Indicadores de Produtividade</Text>
        {produtividade.map((item, idx) => (
          <View key={idx} style={styles.listRow}>
            <View>
              <Text style={styles.listTitle}>{item.nome}</Text>
              <Text style={styles.listSub}>{item.setor}</Text>
            </View>
            <Text style={[styles.listVal, { color: item.valor >= 0 ? colors.primary : colors.danger }]}>
              {item.valor > 0 ? '+' : ''}{item.valor}%
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  cardTitle: { color: colors.primary, fontWeight: '700', fontSize: 15, marginBottom: 8 },
  btnRow: { flexDirection: 'row', gap: 6 },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingVertical: 8 },
  th: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  thCol: { width: 70, textAlign: 'center', color: colors.primary, fontFamily: 'monospace' },
  td: { justifyContent: 'center' },
  rowLabel: { color: colors.text, fontSize: 13, fontWeight: '500' },
  input: {
    width: 55,
    backgroundColor: '#1e293b',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    color: colors.primary,
    fontFamily: 'monospace',
    fontSize: 12,
    textAlign: 'center',
  },
  resultBox: { marginTop: 16, padding: 12, backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { color: colors.muted, fontSize: 12 },
  resultValue: { color: colors.primary, fontSize: 20, fontWeight: '800', fontFamily: 'monospace' },
  formulaText: { color: colors.muted, fontSize: 11, marginTop: 4 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 10, borderRadius: 8, marginBottom: 8 },
  listTitle: { color: colors.text, fontSize: 13, fontWeight: '500' },
  listSub: { color: colors.muted, fontSize: 11 },
  listVal: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
});
