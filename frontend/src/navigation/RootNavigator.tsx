import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerifyScreen from '../screens/auth/EmailVerifyScreen';
import MainTabNavigator from './MainTabNavigator';
import { Routes } from '../constants/routes';
import { useAppDispatch, useAppSelector } from '../store';
import { hydrateAuth } from '../store/slices/authSlice';

import SelectLevelScreen from '../screens/auth/SelectLevelScreen';
import LessonDetailScreen from '../screens/vocab/LessonDetailScreen';
import VocabDetailScreen from '../screens/vocab/VocabDetailScreen';
import AddVocabScreen from '../screens/vocab/AddVocabScreen';
import FlashcardScreen from '../screens/vocab/FlashcardScreen';
import QuizScreen from '../screens/vocab/QuizScreen';
import CreateLessonScreen from '../screens/vocab/CreateLessonScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isHydrated, accessToken, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  if (!isHydrated) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {accessToken ? (
          // If logged in but hasn't selected a level, force to SelectLevelScreen
          user?.levelId ? (
            <Stack.Screen name={Routes.USER_NAVIGATOR} component={MainTabNavigator} />
          ) : (
            <Stack.Screen name={Routes.SELECT_LEVEL} component={SelectLevelScreen} />
          )
        ) : (
          <>
            <Stack.Screen name={Routes.WELCOME} options={{}}>
              {(props) => (
                <WelcomeScreen
                  {...props}
                  onGetStarted={() => props.navigation.navigate(Routes.REGISTER)}
                  onLogin={() => props.navigation.navigate(Routes.LOGIN)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name={Routes.LOGIN} component={LoginScreen} />
            <Stack.Screen name={Routes.REGISTER} component={RegisterScreen} />
            <Stack.Screen name={Routes.EMAIL_VERIFY} component={EmailVerifyScreen} />
          </>
        )}

        {/* Vocab Stack - accessible from Home/Vocab tabs */}
        <Stack.Screen name={Routes.LESSON_DETAIL} component={LessonDetailScreen} />
        <Stack.Screen name={Routes.VOCAB_DETAIL} component={VocabDetailScreen} />
        <Stack.Screen name={Routes.ADD_VOCAB} component={AddVocabScreen} />
        <Stack.Screen name={Routes.FLASHCARDS} component={FlashcardScreen} />
        <Stack.Screen name={Routes.VOCAB_QUIZ} component={QuizScreen} />
        <Stack.Screen name={Routes.CREATE_LESSON} component={CreateLessonScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
