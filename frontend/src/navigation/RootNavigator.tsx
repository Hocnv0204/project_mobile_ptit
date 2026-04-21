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

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector((state) => state.auth.isHydrated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [showWelcome, setShowWelcome] = React.useState(true);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

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
          <Stack.Screen name={Routes.USER_NAVIGATOR} component={MainTabNavigator} />
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
