import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';

export default function Register({ onRegister, onNavigateToLogin, users }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const handleRegister = () => {
        if (nome === '' || email === '' || senha === '' || confirmarSenha === '') {
            Toast.show({
                type: 'error',
                text1: 'Campos vazios',
                text2: 'Por favor, preencha todos os campos.'
            });
            return;
        }

        if (senha !== confirmarSenha) {
            Toast.show({
                type: 'error',
                text1: 'Senhas não coincidem',
                text2: 'As senhas digitadas são diferentes.'
            });
            return;
        }

        if (senha.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Senha fraca',
                text2: 'A senha deve ter pelo menos 6 caracteres.'
            });
            return;
        }

        const userExists = users.find(u => u.email === email);
        if (userExists) {
            Toast.show({
                type: 'error',
                text1: 'Email já cadastrado',
                text2: 'Este email já está em uso.'
            });
            return;
        }

        const newUser = {
            nome,
            email,
            senha,
        };

        onRegister(newUser);
        
        Toast.show({
            type: 'success',
            text1: 'Cadastro realizado',
            text2: 'Agora faça login para acessar o app.'
        });
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Cadastro</Text>
                    
                    <Text style={styles.label}>Nome</Text>
                    <TextInput
                        value={nome}
                        onChangeText={setNome}
                        placeholder="Digite seu nome"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Digite seu email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        value={senha}
                        onChangeText={setSenha}
                        placeholder="Digite sua senha"
                        secureTextEntry
                        style={styles.input}
                    />

                    <Text style={styles.label}>Confirmar Senha</Text>
                    <TextInput
                        value={confirmarSenha}
                        onChangeText={setConfirmarSenha}
                        placeholder="Confirme sua senha"
                        secureTextEntry
                        style={styles.input}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleRegister}>
                        <Text style={styles.buttonText}>Cadastrar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onNavigateToLogin}>
                        <Text style={styles.linkText}>
                            Já tem uma conta? Faça login
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    formContainer: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        elevation: 3,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#27ae60',
        marginBottom: 24,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f4f4f4',
        padding: 12,
        fontSize: 16,
        borderRadius: 8,
    },
    button: {
        backgroundColor: '#27ae60',
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 24,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkText: {
        color: '#27ae60',
        textAlign: 'center',
        marginTop: 16,
        fontSize: 14,
    },
});
