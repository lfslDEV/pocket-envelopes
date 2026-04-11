import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export default function Login({ onLogin, onNavigateToRegister, users }) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const handleLogin = () => {
        if (email === '' || senha === '') {
            Toast.show({
                type: 'error',
                text1: 'Campos vazios',
                text2: 'Por favor, preencha todos os campos.'
            });
            return;
        }

        const user = users.find(u => u.email === email && u.senha === senha);
        
        if (user) {
            Toast.show({
                type: 'success',
                text1: 'Login realizado',
                text2: `Bem-vindo, ${user.nome}!`
            });
            onLogin(user);
        } else {
            Toast.show({
                type: 'error',
                text1: 'Erro no login',
                text2: 'Email ou senha incorretos.'
            });
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.formContainer}>
                <Text style={styles.title}>Login</Text>
                
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

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Entrar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onNavigateToRegister}>
                    <Text style={styles.linkText}>
                        Não tem uma conta? Cadastre-se
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#f8f9fa',
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
