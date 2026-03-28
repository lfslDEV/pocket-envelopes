import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraComponent({ visivel, onClose, onSavePhoto }) {
  const [facing, setFacing] = useState('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  async function pedirPermissaoCamera() {
    try {
      const cam = await requestCameraPermission();
      if (!cam.granted) {
        Alert.alert('Permissão', 'Você precisa liberar a câmera.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível solicitar a permissão.');
    }
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    try {
      if (!cameraRef.current) return;
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      if (photo?.uri) {
        setPhotoUri(photo.uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  }

  if (!visivel) return null;

  // Se não houver permissão
  if (!cameraPermission?.granted) {
    return (
      <Modal visible={visivel} transparent={false} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>Precisamos do acesso à câmera para os recibos.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={pedirPermissaoCamera}>
            <Text style={styles.permissionButtonText}>Permitir acesso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.permissionButton, {marginTop: 10, backgroundColor: '#c0392b'}]} onPress={onClose}>
            <Text style={styles.permissionButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (photoUri) {
    return (
      <Modal visible={visivel} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recibo Capturado</Text>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setPhotoUri(null)}>
                <Text style={styles.modalButtonText}>Tirar Outra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#27ae60'}]} onPress={() => {
                onSavePhoto(photoUri);
                setPhotoUri(null); // Limpa para a próxima vez
              }}>
                <Text style={styles.modalButtonText}>Salvar Recibo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visivel} transparent={false} animationType="slide">
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Anexar Recibo</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonFlip} onPress={toggleCameraFacing}>
            <Text style={{fontSize: 24}}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonTake} onPress={takePicture}>
             <View style={styles.innerButtonTake} />
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  message: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  permissionButton: { backgroundColor: '#222', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  permissionButtonText: { color: '#fff', fontWeight: 'bold' },
  camera: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 40, width: '100%', paddingHorizontal: 20 },
  closeBtn: { backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 10, borderRadius: 8 },
  buttonContainer: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonFlip: { position: 'absolute', left: 40, backgroundColor: 'rgba(255,255,255,0.3)', padding: 10, borderRadius: 30 },
  buttonTake: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  innerButtonTake: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  previewImage: { width: '100%', height: 400, borderRadius: 12, backgroundColor: '#eee' },
  modalButtons: { flexDirection: 'row', marginTop: 16, gap: 12 },
  modalButton: { backgroundColor: '#222', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  modalButtonText: { color: '#fff', fontWeight: 'bold' }
});