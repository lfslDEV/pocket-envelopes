import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { atualizarFotoUsuario } from './storage';

// Ícone SVG inline como placeholder (círculo com inicial)
function AvatarPlaceholder({ inicial }) {
    return (
        <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{inicial}</Text>
        </View>
    );
}

export default function Profile({ user, onBack, onLogout, onUserUpdate }) {
    const [fotoUri, setFotoUri] = useState(user?.fotoUri ?? null);
    const [salvando, setSalvando] = useState(false);

    const inicial = user?.nome ? user.nome.charAt(0).toUpperCase() : 'U';

    const persistirFoto = async (uri) => {
        if (!user?.email) return;
        setSalvando(true);
        const res = await atualizarFotoUsuario(user.email, uri);
        setSalvando(false);
        if (res.sucesso) {
            onUserUpdate?.(res.usuario);
        } else {
            Alert.alert('Erro', res.erro);
        }
    };

    const pedirPermissaoGaleria = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permissão necessária',
                'Precisamos de acesso à galeria para escolher uma foto.',
            );
            return false;
        }
        return true;
    };

    const pedirPermissaoCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permissão necessária',
                'Precisamos de acesso à câmera para tirar uma foto.',
            );
            return false;
        }
        return true;
    };

    const abrirGaleria = async () => {
        const ok = await pedirPermissaoGaleria();
        if (!ok) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            const uri = result.assets[0].uri;
            setFotoUri(uri);
            await persistirFoto(uri);
        }
    };

    const abrirCamera = async () => {
        const ok = await pedirPermissaoCamera();
        if (!ok) return;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            const uri = result.assets[0].uri;
            setFotoUri(uri);
            await persistirFoto(uri);
        }
    };

    const removerFoto = () => {
        Alert.alert('Remover foto', 'Deseja remover a foto de perfil?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover',
                style: 'destructive',
                onPress: async () => {
                    setFotoUri(null);
                    await persistirFoto(null);
                },
            },
        ]);
    };

    const abrirOpcoes = () => {
        const opcoes = [
            { text: 'Tirar foto', onPress: abrirCamera },
            { text: 'Escolher da galeria', onPress: abrirGaleria },
        ];
        if (fotoUri) {
            opcoes.push({ text: 'Remover foto', style: 'destructive', onPress: removerFoto });
        }
        opcoes.push({ text: 'Cancelar', style: 'cancel' });
        Alert.alert('Foto de perfil', 'Como deseja atualizar a foto?', opcoes);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={abrirOpcoes} activeOpacity={0.8}>
                        {fotoUri ? (
                            <Image source={{ uri: fotoUri }} style={styles.avatarImage} />
                        ) : (
                            <AvatarPlaceholder inicial={inicial} />
                        )}
                        {salvando && (
                            <View style={styles.savingOverlay}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Text style={styles.editBadgeText}>✏️</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.editHint}>Toque para alterar a foto</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>Informações Pessoais</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nome</Text>
                        <Text style={styles.infoValue}>{user?.nome || 'Usuário'}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user?.email || 'email@exemplo.com'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Text style={styles.logoutButtonText}>Sair da Conta</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const AVATAR_SIZE = 110;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#27ae60',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 60,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    avatarPlaceholder: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: '#27ae60',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    avatarImage: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        elevation: 4,
    },
    avatarText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
    },
    savingOverlay: {
        position: 'absolute',
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#fff',
        elevation: 3,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    editBadgeText: {
        fontSize: 14,
    },
    editHint: {
        marginTop: 10,
        fontSize: 13,
        color: '#888',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    infoRow: {
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 8,
    },
    logoutButton: {
        backgroundColor: '#c0392b',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 32,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
