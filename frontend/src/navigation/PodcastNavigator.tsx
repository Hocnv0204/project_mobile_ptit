import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PodcastScreen from '../screens/podcast/PodcastScreen';

const Stack = createNativeStackNavigator();

export default function PodcastNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PodcastMain" component={PodcastScreen} />
    </Stack.Navigator>
  );
}
