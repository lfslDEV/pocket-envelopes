import React, { useState } from 'react';
import { StyleSheet, View, Text, SectionList, TouchableOpacity, Image } from 'react-native';

export default function ListEnvelopes({ sections, deleteEnvelope, openCamera, openMapa }) {
  const [colapsados, setColapsados] = useState({});

  const togglePasta = (title) => {
    setColapsados(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const seccoesFiltradas = sections.map(seccao => ({
    ...seccao,
    data: colapsados[seccao.title] ? [] : seccao.data
  }));

  return (
    <View style={styles.listContainer}>
      <SectionList
        sections={seccoesFiltradas}
        keyExtractor={(item) => item.id}
        
        renderSectionHeader={({ section: { title, data } }) => {
          const estaFechado = colapsados[title];
          const totalItens = sections.find(s => s.title === title).data.length;

          return (
            <TouchableOpacity 
              style={styles.headerPasta} 
              activeOpacity={0.7}
              onPress={() => togglePasta(title)}
            >
              <Text style={styles.textoPasta}>
                {estaFechado ? '📁' : '📂'} {title} <Text style={styles.contador}>({totalItens})</Text>
              </Text>
            </TouchableOpacity>
          );
        }}

        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.textoItem}>{item.nome}</Text>
              <TouchableOpacity onPress={() => deleteEnvelope(item.id)}>
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsContainer}>
              <View style={styles.reciboWrapper}>
                {item.reciboUri && <Image source={{ uri: item.reciboUri }} style={styles.miniatura} />}
                <TouchableOpacity style={styles.btnAction} onPress={() => openCamera(item.id)}>
                  <Text style={styles.btnActionText}>📷 Recibo</Text>
                </TouchableOpacity>
              </View>

              {item.localizacao && (
                <TouchableOpacity style={styles.btnMapa} onPress={() => openMapa(item.localizacao)}>
                  <Text style={styles.btnMapaText}>📍 Local</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: { flex: 1, paddingBottom: 20 },
  headerPasta: {
    backgroundColor: '#e1e8ed',
    padding: 12,
    marginTop: 15,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textoPasta: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textTransform: 'uppercase'
  },
  contador: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: 'normal'
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  textoItem: {
    fontSize: 18,
    fontWeight: '500'
  },
  deleteText: {
    color: '#e74c3c'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reciboWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  miniatura: {
    width: 35,
    height: 35,
    borderRadius: 4
  },
  btnAction: {
    backgroundColor: '#f1f2f6',
    padding: 8,
    borderRadius: 6
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: '600'
  },
  btnMapa: {
    backgroundColor: '#e8f4f8',
    padding: 8,
    borderRadius: 6
  },
  btnMapaText: {
    color: '#2980b9',
    fontSize: 12,
    fontWeight: 'bold'
  }
});