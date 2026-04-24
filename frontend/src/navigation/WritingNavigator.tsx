import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WritingScreen from '../screens/writing/WritingScreen';
import SelectTopicScreen from '../screens/writing/SelectTopicScreen';
import SelectLessonScreen from '../screens/writing/SelectLessonScreen';
import WritingHistoryScreen from '../screens/writing/WritingHistoryScreen';
import WritingActiveLessonsScreen from '../screens/writing/WritingActiveLessonsScreen';
import { Routes } from '../constants/routes';

const Stack = createNativeStackNavigator();

export default function WritingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.WRITING_LIST} component={WritingScreen} />
      <Stack.Screen name={Routes.SELECT_TOPIC} component={SelectTopicScreen} />
      <Stack.Screen name={Routes.SELECT_LESSON} component={SelectLessonScreen} />
      <Stack.Screen name={Routes.WRITING_HISTORY} component={WritingHistoryScreen} />
      <Stack.Screen name={Routes.WRITING_ACTIVE_LESSONS} component={WritingActiveLessonsScreen} />
    </Stack.Navigator>
  );
}
