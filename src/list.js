import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';

export default function ListEnvelopes({ envelopes, deleteEnvelope, openCamera }) {
  return (
    <View style={styles.listContainer}>
      <FlatList
        data={envelopes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            
            {/* Cabeçalho do Envelope */}
            <View style={styles.cardHeader}>
              <Text style={styles.textoItem}>{item.nome}</Text>
              <TouchableOpacity onPress={() => deleteEnvelope(item.id)}>
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>

            {/* Área do Recibo da Câmera */}
            <View style={styles.reciboContainer}>
              {item.reciboUri ? (
                <Image source={{ uri: item.reciboUri }} style={styles.miniatura} />
              ) : (
                <Text style={styles.semRecibo}>Nenhum recibo anexado</Text>
              )}
              
              <TouchableOpacity 
                style={styles.btnCamera} 
                onPress={() => openCamera(item.id)} // Chama a função passando o ID do envelope
              >
                <Text style={styles.btnCameraText}>
                  📷 {item.reciboUri ? 'Trocar Recibo' : 'Anexar Recibo'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  textoItem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteText: {
    color: '#c0392b',
    fontWeight: 'bold',
  },
  reciboContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniatura: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  semRecibo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  btnCamera: {
    backgroundColor: '#f1f2f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnCameraText: {
    color: '#2f3542',
    fontWeight: '600',
    fontSize: 14,
  }
});