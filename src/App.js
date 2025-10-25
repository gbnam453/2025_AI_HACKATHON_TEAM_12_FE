import 'react-native-gesture-handler';
import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { TypographyProvider } from './shared/model/typography';

import SplashPage from './pages/SplashPage';
import MainPage from './pages/MainPage';
import InfoPage from './pages/InfoPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

// 모든 Text에 OS 폰트 스케일 무시 전역 적용
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

enableScreens();
const Stack = createStackNavigator();

export default function App() {
    return (
        <TypographyProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="SplashPage" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="SplashPage" component={SplashPage} />
                    <Stack.Screen name="MainPage" component={MainPage} />
                    <Stack.Screen name="InfoPage" component={InfoPage} />
                    <Stack.Screen name="HistoryPage" component={HistoryPage} />
                    <Stack.Screen name="SettingsPage" component={SettingsPage} />
                </Stack.Navigator>
            </NavigationContainer>
        </TypographyProvider>
    );
}
