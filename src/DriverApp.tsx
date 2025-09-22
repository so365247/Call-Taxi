// DriverApp.tsx
import { JSX, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Intro from './Intro';
import Main from './Main';
import Login from './Login';
import Register from './Register';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[background remote message]', remoteMessage);
});

function DriverApp(): JSX.Element {
  console.log('-- DriverApp()');

  const Stack = createStackNavigator();

  const getFcmToken = async () => {
    const fcmToken = await messaging().getToken();
    await AsyncStorage.setItem('fcmToken', fcmToken);
    console.log('>> FcmToken = ' + fcmToken);
  };

  useEffect(() => {
    getFcmToken();

    messaging().onMessage(remoteMessage => {
      console.log('[remote message] ', JSON.stringify(remoteMessage));
      let title = '';
      let body = '';

      if (remoteMessage.notification && remoteMessage.notification.title) {
        title = remoteMessage.notification.title;
      }

      if (remoteMessage.notification && remoteMessage.notification.body) {
        body = remoteMessage.notification.body;
      }

      if (remoteMessage) {
        Alert.alert(title, body, [{ text: '확인', style: 'cancel' }]);
      }
    });
  });

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Intro"
          component={Intro}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{ headerShown: true, title: '회원가입' }}
        />
        <Stack.Screen
          name="Main"
          component={Main}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default DriverApp;
