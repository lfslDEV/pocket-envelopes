import React from 'react';
import { StyleSheet, Button, FlatList, TouchableOpacity, View, Text } from 'react-native';

export default function ListEnvelopes(props) {
    return (
        <View style={styles.listContainer}>
            <FlatList
                data={props.envelopes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View>
                        <TouchableOpacity style={styles.opacity}>
                            <Text style={styles.textoItem}>
                                {item.nome}
                            </Text>
                            <Button
                                title="Deletar"
                                color="#c0392b"
                                onPress={() => {
                                    props.deleteEnvelope(item.id);
                                }}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    listContainer: {
        flex: 1, 
    },
    opacity: {
        padding: 15,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginTop: 10,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2, 
    },
    textoItem: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    }
});