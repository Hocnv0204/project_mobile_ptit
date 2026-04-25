import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { GradingResponse } from '../../api/writing/types';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onNext?: () => void;
  mode?: 'practice' | 'history';
  originalText?: string;
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
  mode = 'practice',
  originalText,
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

  // Sort feedback_points: correct -> warning -> error
  const sortedFeedback = feedback_points ? [...feedback_points].sort((a, b) => {
    const order = { correct: 1, warning: 2, error: 3 };
    return (order[a.type] || 99) - (order[b.type] || 99);
  }) : [];

  const size = 70;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (accuracy_score / 100) * circumference;

  const getAccuracyColor = (score: number) => {
    if (score >= 90) return '#059669'; // Excellent
    if (score >= 70) return '#D97706'; // Good
    if (score >= 50) return '#EA580C'; // Fair
    return '#DC2626';             // Needs Improvement
  };

  const accuracyColor = getAccuracyColor(accuracy_score);

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
              <View style={styles.accuracyCircleWrapper}>
                <Svg width={size} height={size}>
                  {/* Background Circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Progress Circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={accuracyColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />
                </Svg>
                <View style={styles.accuracyTextOverlay}>
                  <Text style={[styles.accuracyText, { color: accuracyColor }]}>{accuracy_score}%</Text>
                </View>
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
            {/* Section 0: Original Sentence */}
            {originalText && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Câu gốc:</Text>
                <View style={styles.originalContainer}>
                  <Text style={styles.originalText}>{originalText}</Text>
                </View>
              </View>
            )}

            {/* Section 1: Suggestion */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bản dịch gợi ý:</Text>
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

            {/* Section 2: Feedback Details */}
            {sortedFeedback.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Phân tích chi tiết:</Text>
                {sortedFeedback.map((point, index) => {
                  const isCorrect = point.type === 'correct';
                  const isError = point.type === 'error';
                  const isWarning = point.type === 'warning';

                  let iconName: any = 'checkmark-circle';
                  let label = 'Chính xác';
                  let cardStyle = styles.cardCorrect;
                  let textColor = '#15803D';
                  let badgeBg = '#DCFCE7';

                  if (isError) {
                    iconName = 'close-circle';
                    label = 'Cần sửa';
                    cardStyle = styles.cardError;
                    textColor = '#B91C1C';
                    badgeBg = '#FEE2E2';
                  } else if (isWarning) {
                    iconName = 'alert-circle';
                    label = 'Lưu ý';
                    cardStyle = styles.cardWarning;
                    textColor = '#B45309';
                    badgeBg = '#FEF3C7';
                  }

                  return (
                    <View key={index} style={[styles.feedbackCard, cardStyle]}>
                      <View style={styles.feedbackCardHeader}>
                        <Ionicons name={iconName} size={18} color={textColor} />
                        <Text style={[styles.feedbackLabel, { color: textColor }]}>
                          {label}
                        </Text>
                      </View>

                      <View style={styles.feedbackContent}>
                        <View style={styles.badgeRow}>
                          <View style={[styles.monoBadge, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.monoText, { color: textColor }]}>
                              {point.user_text}
                            </Text>
                          </View>
                          
                          {point.correct_text && (
                            <>
                              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" style={{ marginHorizontal: 8 }} />
                              <View style={[styles.monoBadge, { backgroundColor: '#DCFCE7' }]}>
                                <Text style={[styles.monoText, { color: '#15803D' }]}>
                                  {point.correct_text}
                                </Text>
                              </View>
                            </>
                          )}
                        </View>
                        
                        <Text style={styles.explanationText}>
                          {point.explanation}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Section 3: Overall Comment */}
            {overall_comment && (
              <View style={styles.overallCommentContainer}>
                <Text style={styles.overallCommentText}>{overall_comment}</Text>
              </View>
            )}
          </ScrollView>

          {mode === 'practice' && (
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
          )}
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
  accuracyCircleWrapper: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accuracyTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 16,
    fontWeight: '800',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  diffContainer: {
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  originalContainer: {
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  originalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E40AF',
    fontWeight: '500',
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
  feedbackCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  cardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  feedbackContent: {
    marginLeft: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  monoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
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
