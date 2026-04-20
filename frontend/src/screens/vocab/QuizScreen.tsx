import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Vocabulary } from '../../api/types';

const { width } = Dimensions.get('window');

interface Question {
  id: number;
  word: string;
  correctAnswer: string;
  options: string[];
}

export default function QuizScreen({ route, navigation }: any) {
  const { vocabularies = [] } = route.params as { vocabularies: Vocabulary[] };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    if (vocabularies.length < 4) {
      Alert.alert('Thông báo', 'Cần ít nhất 4 từ vựng để bắt đầu luyện tập.', [
        { text: 'Quay lại', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    generateQuestions();
  }, [vocabularies]);

  const generateQuestions = () => {
    const shuffled = [...vocabularies].sort(() => 0.5 - Math.random());
    const generated: Question[] = shuffled.map((vocab) => {
      const distractors = vocabularies
        .filter((v) => v.id !== vocab.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((v) => v.vi);
      
      const options = [vocab.vi, ...distractors].sort(() => 0.5 - Math.random());
      
      return {
        id: vocab.id,
        word: vocab.term,
        correctAnswer: vocab.vi,
        options,
      };
    });
    setQuestions(generated);
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    
    setSelectedOption(option);
    const correct = option === questions[currentQuestionIndex].correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setQuizFinished(true);
    }
  };

  if (quizFinished) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultContainer}>
          <MaterialCommunityIcons name="trophy" size={100} color="#FFD166" />
          <Text style={styles.resultTitle}>Hoàn thành!</Text>
          <Text style={styles.resultScore}>Điểm của bạn: {score}/{questions.length}</Text>
          <TouchableOpacity 
            style={styles.btnPrimary} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnPrimaryText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!questions.length) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="close" size={28} color="#1A1D26" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
        </View>
        <Text style={styles.scoreText}>Điểm: {score}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Từ này có nghĩa là gì?</Text>
          <Text style={styles.questionWord}>{currentQuestion.word}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            
            let btnStyle = styles.optionBtn;
            let textStyle = styles.optionText;

            if (selectedOption) {
              if (isCorrectOption) {
                btnStyle = [styles.optionBtn, styles.correctOption];
                textStyle = [styles.optionText, styles.whiteText];
              } else if (isSelected) {
                btnStyle = [styles.optionBtn, styles.wrongOption];
                textStyle = [styles.optionText, styles.whiteText];
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={btnStyle}
                onPress={() => handleOptionSelect(option)}
                disabled={!!selectedOption}
              >
                <Text style={textStyle}>{option}</Text>
                {selectedOption && isCorrectOption && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
                )}
                {selectedOption && isSelected && !isCorrectOption && (
                  <MaterialCommunityIcons name="close-circle" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedOption && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
            <Text style={styles.btnPrimaryText}>
              {currentQuestionIndex === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E5ED',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8E54E9',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E54E9',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  questionLabel: {
    fontSize: 14,
    color: '#70778C',
    fontWeight: '600',
    marginBottom: 12,
  },
  questionWord: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1A1D26',
  },
  optionsContainer: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D26',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  correctOption: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  wrongOption: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  footer: {
    padding: 24,
  },
  btnPrimary: {
    backgroundColor: '#1A1D26',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1D26',
    marginTop: 24,
  },
  resultScore: {
    fontSize: 20,
    color: '#70778C',
    marginTop: 8,
    marginBottom: 40,
  },
});
