import 'react-native-gesture-handler';
import './global.css';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppHomePage from './pages/AppHome';
import DonationDetailsPage from './pages/DonationDetails';
import ProjectDetailsPage from './pages/ProjectDetails';
import RoleDetailsPage from './pages/RoleDetails';
import SigninPage from './pages/Signin';
import SignupCompletedPage from './pages/SignupCompleted';
import SignupPage from './pages/Signup';
import { RootStackParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Signup"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Signup" component={SignupPage} />
          <Stack.Screen name="RoleDetails" component={RoleDetailsPage} />
          <Stack.Screen name="SignupCompleted" component={SignupCompletedPage} />
          <Stack.Screen name="Signin" component={SigninPage} />
          <Stack.Screen name="AppHome" component={AppHomePage} />
          <Stack.Screen name="ProjectDetails" component={ProjectDetailsPage} />
          <Stack.Screen name="DonationDetails" component={DonationDetailsPage} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
