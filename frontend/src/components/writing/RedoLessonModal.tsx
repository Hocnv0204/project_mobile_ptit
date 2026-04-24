import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface RedoLessonModalProps {
  visible: boolean;
  onRedo: () => void;
  onCancel: () => void;
}

const RedoLessonModal: React.FC<RedoLessonModalProps> = ({
  visible,
  onRedo,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={60} color={Colors.primary} />
          </View>
          
          <Text style={styles.title}>Chúc mừng!</Text>
          <Text style={styles.message}>
            Bạn đã hoàn thành bài tập này. Bạn có muốn làm lại bài tập này không?
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Không</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.redoButton]}
              onPress={onRedo}
            >
              <Text style={styles.redoButtonText}>Làm lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  redoButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
  },
  redoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default RedoLessonModal;
