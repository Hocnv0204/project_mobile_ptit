import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerifyScreen from '../screens/auth/EmailVerifyScreen';
import SelectLevelScreen from '../screens/auth/SelectLevelScreen';
import MainTabNavigator from './MainTabNavigator';
import LessonDetailScreen from '../screens/vocab/LessonDetailScreen';
import AddVocabAiScreen from '../screens/vocab/AddVocabAiScreen';
import AiVocabResultScreen from '../screens/vocab/AiVocabResultScreen';
import FlashcardScreen from '../screens/vocab/FlashcardScreen';
import QuizModeSelectScreen from '../screens/vocab/QuizModeSelectScreen';
import QuizSessionScreen from '../screens/vocab/QuizSessionScreen';
import FillBlankSessionScreen from '../screens/vocab/FillBlankSessionScreen';
import LessonPracticeScreen from '../screens/writing/LessonPracticeScreen';
import { Routes } from '../constants/routes';
// import { useAppDispatch, useAppSelector } from '../store';
// import { hydrateAuth } from '../store/slices/authSlice';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isHydrated, accessToken, user, hydrate } = useAuthStore();
  const [showWelcome, setShowWelcome] = React.useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showWelcome && (
          <Stack.Screen name={Routes.WELCOME} options={{}}>
            {(props) => (
              <WelcomeScreen
                {...props}
                onGetStarted={() => {
                  setShowWelcome(false);
                  setTimeout(() => props.navigation.navigate(Routes.REGISTER), 0);
                }}
                onLogin={() => {
                  setShowWelcome(false);
                }}
                onExplore={() => {
                  setShowWelcome(false);
                }}
              />
            )}
          </Stack.Screen>
        )}

        {accessToken ? (
          user?.levelId ? (
            <>
              <Stack.Screen name={Routes.USER_NAVIGATOR} component={MainTabNavigator} />
              <Stack.Screen name={Routes.SELECT_LEVEL} component={SelectLevelScreen} />
              <Stack.Screen name={Routes.LESSON_DETAIL} component={LessonDetailScreen} />
              <Stack.Screen name={Routes.ADD_VOCAB_AI} component={AddVocabAiScreen} />
              <Stack.Screen name={Routes.AI_VOCAB_RESULT} component={AiVocabResultScreen} />
              <Stack.Screen name={Routes.FLASHCARD} component={FlashcardScreen} />
              <Stack.Screen name={Routes.QUIZ_MODE_SELECT} component={QuizModeSelectScreen} />
              <Stack.Screen name={Routes.QUIZ_SESSION} component={QuizSessionScreen} />
              <Stack.Screen name={Routes.FILL_BLANK_SESSION} component={FillBlankSessionScreen} />
              <Stack.Screen name={Routes.LESSON_PRACTICE} component={LessonPracticeScreen} />
            </>
          ) : (
            <Stack.Screen name={Routes.SELECT_LEVEL} component={SelectLevelScreen} />
          )
        ) : (
          <>
            <Stack.Screen name={Routes.LOGIN} component={LoginScreen} />
            <Stack.Screen name={Routes.REGISTER} component={RegisterScreen} />
            <Stack.Screen name={Routes.EMAIL_VERIFY} component={EmailVerifyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
