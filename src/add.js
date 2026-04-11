import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';

export default function AddEnvelope({ addEnvelope, categorias }) {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');

  const handleAdd = () => {
    const pastaFinal = categoria.trim() === '' ? 'Geral' : categoria;
    addEnvelope(nome, pastaFinal);
    setNome('');
    setCategoria('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome do Envelope (ex: Internet)"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="Pasta/Categoria (ex: Contas)"
        value={categoria}
        onChangeText={setCategoria}
      />

      {categorias.length > 0 && (
        <View style={styles.chipsContainer}>
          <Text style={styles.chipsLabel}>Toque para selecionar uma pasta existente:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollChips}>
            {categorias.map((cat, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.chip}
                onPress={() => setCategoria(cat)}
              >
                <Text style={styles.chipText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity style={styles.botao} onPress={handleAdd}>
        <Text style={styles.botaoTexto}>Adicionar Novo Envelope</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 20 
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16
  },
  chipsContainer: {
    marginBottom: 15,
  },
  chipsLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
    marginLeft: 4,
  },
  scrollChips: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#e8f4f8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  chipText: {
    color: '#2980b9',
    fontSize: 13,
    fontWeight: 'bold',
  },
  botao: { 
    backgroundColor: '#2ecc71', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 5,
  },
  botaoTexto: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});