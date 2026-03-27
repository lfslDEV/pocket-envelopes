import React, { useState } from 'react';
import { StyleSheet, Button, TextInput, View, Text, Keyboard } from "react-native";

export default function AddEnvelope(props) {
    const [nome, setNome] = useState('');

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Nome do Novo Envelope</Text>
            <TextInput
                value={nome}
                placeholder="Ex: Investimento, Lazer, Contas"
                onChangeText={(textVal) => {
                    setNome(textVal);
                }}
                style={styles.input}
            />
            <Button
                color="#27ae60"
                title="Criar Envelope"
                onPress={() => {
                    props.addEnvelope(nome);
                    setNome(''); 
                    Keyboard.dismiss(); 
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    input: {
        borderBottomColor: '#27ae60',
        borderBottomWidth: 2,
        backgroundColor: '#f4f4f4',
        marginVertical: 10,
        padding: 10,
        fontSize: 16,
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333'
    }
});