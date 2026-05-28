import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './context/AuthContext';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import BookDetailScreen from './screens/BookDetailScreen';
import MyBooksScreen from './screens/MyBooksScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const MyBooksStack = createStackNavigator();
const AuthStack = createStackNavigator();

export const theme = {
  bg: '#FFFDF5',
  text: '#454545',
  textLight: '#888',
  primary: '#454545',
  primaryDark: '#353431',
  accent: '#F6EDDD',
  border: '#F6EDDD',
  white: '#fff',
  error: '#c0392b',
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFDF5' },
        headerTintColor: '#454545',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitle: '',
        animation: 'slide_from_right',
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Reading Tracker' }} />
      <HomeStack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Details', headerShown: true }} />
      <HomeStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

function MyBooksStackNavigator() {
  return (
    <MyBooksStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFDF5' },
        headerTintColor: '#454545',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitle: '',
        animation: 'slide_from_right',
      }}
    >
      <MyBooksStack.Screen name="MyBooks" component={MyBooksScreen} options={{ title: 'My Books' }} />
      <MyBooksStack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Details' }} />
    </MyBooksStack.Navigator>
  );
}

function MainTabs() {
  const { token } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#454545',
        tabBarInactiveTintColor: '#bbb',
        tabBarStyle: { backgroundColor: '#FFFDF5', borderTopColor: '#F6EDDD' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'MyBooksTab') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      {token && (
        <Tab.Screen name="MyBooksTab" component={MyBooksStackNavigator} options={{ title: 'My Books' }} />
      )}
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile', headerShown: false }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFDF5' }}>
        <ActivityIndicator size="large" color="#454545" />
      </View>
    );
  }
  return <MainTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#FFFDF5" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
