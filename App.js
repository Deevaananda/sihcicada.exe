import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as PaperProvider} from 'react-native-paper';
import {MaterialIcons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import InspectionScreen from './src/screens/InspectionScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import FittingDetailsScreen from './src/screens/FittingDetailsScreen';
import AIAnalysisScreen from './src/screens/AIAnalysisScreen';
import OfflineScreen from './src/screens/OfflineScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const theme = {
  colors: {
    primary: '#1976D2', // Indian Railways Blue
    accent: '#FF6B35',   // Orange accent
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#333333',
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Scanner':
              iconName = 'qr-code-scanner';
              break;
            case 'Inventory':
              iconName = 'inventory';
              break;
            case 'Inspection':
              iconName = 'fact-check';
              break;
            case 'Reports':
              iconName = 'analytics';
              break;
            default:
              iconName = 'help';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scanner" component={QRScannerScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Inspection" component={InspectionScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Show splash screen
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{headerShown: false}}>
            {!isAuthenticated ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen 
                  name="FittingDetails" 
                  component={FittingDetailsScreen}
                  options={{headerShown: true, title: 'Fitting Details'}}
                />
                <Stack.Screen 
                  name="AIAnalysis" 
                  component={AIAnalysisScreen}
                  options={{headerShown: true, title: 'AI Analysis'}}
                />
                <Stack.Screen 
                  name="Offline" 
                  component={OfflineScreen}
                  options={{headerShown: true, title: 'Offline Mode'}}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default App;