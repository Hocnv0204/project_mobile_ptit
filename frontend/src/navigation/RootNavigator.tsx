import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerifyScreen from '../screens/auth/EmailVerifyScreen';
import { Routes } from '../constants/routes';
import { useAppDispatch } from '../store';
import { hydrateAuth } from '../store/slices/authSlice';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
