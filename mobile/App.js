import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from './context/AuthContext';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TimetableScreen from './screens/TimetableScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ExamDetailScreen from './screens/ExamDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{icon}</Text>
);

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f5',
        height: 64,
        paddingBottom: 10,
        paddingTop: 8,
      },
      tabBarActiveTintColor: '#000666',
      tabBarInactiveTintColor: '#aaa',
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.2,
      },
    }}
  >
    <Tab.Screen
      name="Timetable"
      component={TimetableScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="📅" focused={focused} />,
        tabBarLabel: 'Timetable',
      }}
    />
    <Tab.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="🔔" focused={focused} />,
        tabBarLabel: 'Alerts',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);

  useEffect(() => {
    // Handle notification tap when app is open or in background
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const examData = response.notification.request.content.data;

      if (!examData || !examData.examId) return;

      // Wait for navigation to be ready
      const waitForNav = setInterval(() => {
        if (navigationRef.current?.isReady()) {
          clearInterval(waitForNav);

          // If exam data was passed directly, navigate straight to detail
          if (examData.courseCode) {
            navigationRef.current.navigate('ExamDetail', {
              exam: {
                id: examData.examId,
                courseCode: examData.courseCode,
                courseTitle: examData.courseTitle,
                date: examData.date,
                startTime: examData.startTime,
                endTime: examData.endTime,
                venue: examData.venue,
                department: examData.department,
                level: examData.level,
                instructions: examData.instructions || '',
              }
            });
          }
        }
      }, 100);
    });

    return () => subscription.remove();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000666" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="StudentTabs" component={StudentTabs} />
            <Stack.Screen name="ExamDetail" component={ExamDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}