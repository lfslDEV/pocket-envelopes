import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';

export default function ListEnvelopes({ envelopes, deleteEnvelope, openCamera, openMapa }) {
  return (
    <View style={styles.listContainer}>
      <FlatList
        data={envelopes}
        keyExtractor={(item) => item.id}
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
                {item.reciboUri ? (
                  <Image source={{ uri: item.reciboUri }} style={styles.miniatura} />
                ) : null}
                
                <TouchableOpacity style={styles.btnAction} onPress={() => openCamera(item.id)}>
                  <Text style={styles.btnActionText}>
                    📷 {item.reciboUri ? 'Trocar' : 'Recibo'}
                  </Text>
                </TouchableOpacity>
              </View>

              {item.localizacao && (
                <TouchableOpacity 
                  style={[styles.btnAction, { backgroundColor: '#e8f4f8' }]} 
                  onPress={() => openMapa(item.localizacao)}
                >
                  <Text style={[styles.btnActionText, { color: '#2980b9' }]}>
                    📍 Ver Local
                  </Text>
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
  listContainer: { 
    flex: 1, marginTop: 10 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    padding: 15, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    elevation: 2 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    paddingBottom: 10, 
    marginBottom: 10 
  },
  textoItem: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  deleteText: { 
    color: '#c0392b', 
    fontWeight: 'bold' 
  },
  actionsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 5 
  },
  reciboWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  miniatura: { 
    width: 40, 
    height: 40, 
    borderRadius: 6, 
    backgroundColor: '#eee' 
  },
  btnAction: { 
    backgroundColor: '#f1f2f6', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 6 
  },
  btnActionText: { 
    color: '#2f3542', 
    fontWeight: '600', 
    fontSize: 13 
  }
});