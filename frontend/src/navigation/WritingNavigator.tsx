import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WritingScreen from '../screens/writing/WritingScreen';
import SelectLessonScreen from '../screens/writing/SelectLessonScreen';
import { Routes } from '../constants/routes';

const Stack = createNativeStackNavigator();

export default function WritingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.WRITING_LIST} component={WritingScreen} />
      <Stack.Screen name={Routes.SELECT_LESSON} component={SelectLessonScreen} />
    </Stack.Navigator>
  );
}
