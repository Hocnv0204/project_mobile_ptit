import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Routes } from '../constants/routes';

// Import Screens
import HomeScreen from '../screens/home/HomeScreen';
import VocabularyScreen from '../screens/vocab/VocabularyScreen';
import WritingNavigator from './WritingNavigator';
import DictationScreen from '../screens/dictation/DictationScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PodcastNavigator from './PodcastNavigator';
import { useI18n } from '../i18n/useI18n';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#0066FF',
  inactive: '#A0A7BA',
  background: '#FFFFFF',
};

export default function MainTabNavigator() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: '#EEF0F6',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';

          switch (route.name) {
            case Routes.HOME:
              iconName = focused ? 'home' : 'home-outline';
              break;
            case Routes.VOCABULARY:
              iconName = focused ? 'book-open-variant' : 'book-open-blank-variant';
              break;
            case Routes.WRITING:
              iconName = focused ? 'pencil' : 'pencil-outline';
              break;
            case Routes.DICTATION:
              iconName = focused ? 'headphones' : 'headphones';
              break;
            case Routes.PROFILE:
              iconName = focused ? 'account-circle' : 'account-circle-outline';
              break;
            case Routes.PODCAST:
              iconName = focused ? 'podcast' : 'podcast';
              break;
          }

          return <MaterialCommunityIcons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name={Routes.HOME} 
        component={HomeScreen} 
        options={{ tabBarLabel: t('tabs.study') }} 
      />
      <Tab.Screen 
        name={Routes.VOCABULARY} 
        component={VocabularyScreen} 
        options={{ tabBarLabel: t('tabs.vocabulary') }} 
      />
      <Tab.Screen 
        name={Routes.WRITING} 
        component={WritingNavigator} 
        options={{ tabBarLabel: t('tabs.writing') }} 
      />
      <Tab.Screen 
        name={Routes.DICTATION} 
        component={DictationScreen} 
        options={{ tabBarLabel: t('tabs.dictation') }} 
      />
      <Tab.Screen 
        name={Routes.PODCAST} 
        component={PodcastNavigator} 
        options={{ tabBarLabel: t('tabs.podcast') }} 
      />
      <Tab.Screen 
        name={Routes.PROFILE} 
        component={ProfileScreen} 
        options={{ tabBarLabel: t('tabs.account') }} 
      />
    </Tab.Navigator>
  );
}
