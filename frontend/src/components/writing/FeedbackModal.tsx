import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradingResponse } from '../../api/writing/types';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onNext?: () => void;
  feedbackData: {
    message?: string;
    code?: number;
    data: GradingResponse;
  } | null;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onNext,
  feedbackData,
}) => {
  if (!feedbackData || !feedbackData.data) return null;

  const { data } = feedbackData;
  const {
    accuracy_score,
    accuracy_label,
    diff,
    feedback_points,
    overall_comment,
  } = data;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.accuracyContainer}>
              <View style={styles.accuracyCircle}>
                <Text style={styles.accuracyText}>{accuracy_score}%</Text>
              </View>
              <View>
                <Text style={styles.accuracyTitle}>Accuracy</Text>
                <Text style={styles.accuracyLabel}>{accuracy_label}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Section 1: Suggestion */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggestion:</Text>
              <View style={styles.diffContainer}>
                <Text style={styles.diffText}>
                  {diff.map((item, index) => {
                    if (item.type === 'keep') {
                      return (
                        <Text key={index} style={styles.diffKeep}>
                          {item.text}
                        </Text>
                      );
                    } else if (item.type === 'delete') {
                      return (
                        <Text key={index} style={styles.diffDelete}>
                          {item.text}
                        </Text>
                      );
                    } else if (item.type === 'insert') {
                      return (
                        <Text key={index} style={styles.diffInsert}>
                          {item.text}
                        </Text>
                      );
                    }
                    return null;
                  })}
                </Text>
              </View>
            </View>

            {/* Section 2: Suggested Improvements */}
            {feedback_points && feedback_points.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggested improvements:</Text>
                {feedback_points.map((point, index) => (
                  <View key={index} style={styles.feedbackItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.feedbackExplanation}>
                      {point.explanation.split(new RegExp(`(${point.user_text}|${point.correct_text})`, 'g')).map((part, i) => {
                        if (part === point.user_text) {
                          return <Text key={i} style={styles.highlightError}>{part}</Text>;
                        }
                        if (part === point.correct_text) {
                          return <Text key={i} style={styles.highlightCorrect}>{part}</Text>;
                        }
                        return part;
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Section 3: Overall Comment */}
            {overall_comment && (
              <View style={styles.overallCommentContainer}>
                <Text style={styles.overallCommentText}>{overall_comment}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                accuracy_score >= 70 ? styles.retryButton : styles.fullWidthButton,
              ]}
              onPress={onClose}
            >
              <Text
                style={[
                  styles.buttonText,
                  accuracy_score >= 70 ? styles.retryButtonText : styles.fullWidthButtonText,
                ]}
              >
                Thử lại
              </Text>
            </TouchableOpacity>

            {accuracy_score >= 70 && (
              <TouchableOpacity
                style={[styles.button, styles.nextButton]}
                onPress={onNext}
              >
                <Text style={[styles.buttonText, styles.nextButtonText]}>
                  Chuyển câu tiếp
                </Text>
              </TouchableOpacity>
            )}
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
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accuracyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  accuracyTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  accuracyLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  diffContainer: {
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  diffText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#111827',
  },
  diffKeep: {
    color: '#111827',
  },
  diffDelete: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    textDecorationLine: 'line-through',
  },
  diffInsert: {
    color: '#059669',
    backgroundColor: '#D1FAE5',
    fontWeight: 'bold',
  },
  feedbackItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginTop: 8,
    marginRight: 10,
  },
  feedbackExplanation: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  highlightError: {
    color: '#DC2626',
    fontWeight: '700',
  },
  highlightCorrect: {
    color: '#059669',
    fontWeight: '700',
  },
  overallCommentContainer: {
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D1D5DB',
  },
  overallCommentText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  retryButtonText: {
    color: '#4B5563',
  },
  nextButton: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
  },
  fullWidthButton: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidthButtonText: {
    color: '#FFFFFF',
  },
});

export default FeedbackModal;
