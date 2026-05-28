import 'react-native-gesture-handler';
import './global.css';

import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppHomePage from './pages/AppHome';
import CreateProjectPage from './pages/CreateProject';
import CreateVendorPage from './pages/CreateVendor';
import DashboardPage from './pages/Dashboard';
import DonationDetailsPage from './pages/DonationDetails';
import DonationHistoryPage from './pages/DonationHistory';
import DonationTimelinePage from './pages/DonationTimeline';
import NgoProfilePage from './pages/NgoProfile';
import PendingProjectDonationsPage from './pages/PendingProjectDonations';
import ProfilePage from './pages/Profile';
import ProjectBlogPostPage from './pages/ProjectBlogPost';
import ProjectDetailsPage from './pages/ProjectDetails';
import ProjectsListPage from './pages/ProjectsList';
import RoleDetailsPage from './pages/RoleDetails';
import SearchPage from './pages/Search';
import SigninPage from './pages/Signin';
import SignupCompletedPage from './pages/SignupCompleted';
import SignupPage from './pages/Signup';
import VendorOnboardingStatusPage from './pages/VendorOnboardingStatus';
import VendorsPage from './pages/Vendors';
import { RootStackParamList } from './navigation/types';
import { hydrateAccessToken, useAccessTokenState } from './services/authStorage';
import { notificationService } from './services/notificationService';
import { useUserStore } from './stores/userStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

function NotificationSessionCoordinator() {
  const { currentUser } = useUserStore();
  const { hydrated, token } = useAccessTokenState();

  useEffect(() => {
    void hydrateAccessToken();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void notificationService.syncSession({
      accessToken: token,
      userId: currentUser?.id ?? null,
    });
  }, [currentUser?.id, hydrated, token]);

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NotificationSessionCoordinator />
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
          <Stack.Screen name="Search" component={SearchPage} />
          <Stack.Screen name="NgoProfile" component={NgoProfilePage} />
          <Stack.Screen name="ProjectsList" component={ProjectsListPage} />
          <Stack.Screen name="PendingProjectDonations" component={PendingProjectDonationsPage} />
          <Stack.Screen name="CreateProject" component={CreateProjectPage} />
          <Stack.Screen name="CreateVendor" component={CreateVendorPage} />
          <Stack.Screen name="VendorOnboardingStatus" component={VendorOnboardingStatusPage} />
          <Stack.Screen name="Vendors" component={VendorsPage} />
          <Stack.Screen name="Dashboard" component={DashboardPage} />
          <Stack.Screen name="Profile" component={ProfilePage} />
          <Stack.Screen name="DonationHistory" component={DonationHistoryPage} />
          <Stack.Screen name="DonationTimeline" component={DonationTimelinePage} />
          <Stack.Screen name="ProjectDetails" component={ProjectDetailsPage} />
          <Stack.Screen name="ProjectBlogPost" component={ProjectBlogPostPage} />
          <Stack.Screen name="DonationDetails" component={DonationDetailsPage} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
