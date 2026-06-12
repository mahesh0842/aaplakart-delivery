import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import PartnerSetupScreen from './src/screens/PartnerSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AssignedOrdersScreen from './src/screens/AssignedOrdersScreen';
import { useAuthStore } from './src/store/authStore';
import { COLORS } from './src/utils/constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = { HomeTab: 'home', OrdersTab: 'list', ProfileTab: 'person' };

// ── Bottom Tabs ──────────────────────────────────────────────────
function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICONS[route.name] || 'ellipse';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreenWrapper} options={{ title: 'Home' }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreenWrapper} options={{ title: 'Orders' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Stack Wrappers (so tabs can push OrderDetail) ───────────────
function HomeScreenWrapper() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function OrdersScreenWrapper() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="AssignedOrders" component={AssignedOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [bootStage, setBootStage] = useState('setup'); // setup → ready
  const isSetupComplete = useAuthStore((s) => s.isSetupComplete);
  const autoLogin = useAuthStore((s) => s.autoLogin);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Always try auto-login on startup for fresh token
    if (isSetupComplete()) {
      autoLogin().then(() => setBootStage('ready'));
      return;
    }
    // Not set up — show setup screen
    setBootStage('setup');
  }, []);

  if (bootStage === 'setup') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <PartnerSetupScreen onComplete={() => setBootStage('ready')} />
        <Toast />
      </SafeAreaProvider>
    );
  }

  if (bootStage !== 'ready') {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <HomeTabs />
      </NavigationContainer>
      <Toast />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
});

