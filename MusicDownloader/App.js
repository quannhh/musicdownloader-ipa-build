import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TrackPlayer from 'react-native-track-player';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MiniPlayer from './src/components/MiniPlayer';
import { setupPlayer } from './src/services/PlayerService';
import { COLORS } from './src/utils/config';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = ({ navigation }) => {
    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        if (route.name === 'Home') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Library') {
                            iconName = focused ? 'library' : 'library-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        }
                        return <Icon name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: COLORS.primary,
                    tabBarInactiveTintColor: COLORS.textMuted,
                    tabBarStyle: {
                        backgroundColor: COLORS.backgroundLight,
                        borderTopColor: COLORS.surface,
                        borderTopWidth: 1,
                        paddingTop: 5,
                        paddingBottom: 25,
                        height: 80,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginTop: 2,
                    },
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ tabBarLabel: 'Tải nhạc' }}
                />
                <Tab.Screen
                    name="Library"
                    component={LibraryScreen}
                    options={{ tabBarLabel: 'Thư viện' }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ tabBarLabel: 'Cài đặt' }}
                />
            </Tab.Navigator>
            <MiniPlayer
                onPress={() => navigation.navigate('Player')}
            />
        </View>
    );
};

const App = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function init() {
            try {
                await setupPlayer();
            } catch (e) {
                console.log('Player setup error:', e);
            }
            setIsReady(true);
        }
        init();
    }, []);

    if (!isReady) {
        return (
            <View style={styles.loadingContainer}>
                <Icon name="musical-notes" size={60} color={COLORS.primary} />
                <Text style={styles.loadingTitle}>Music Downloader</Text>
                <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                    style={{ marginTop: 20 }}
                />
            </View>
        );
    }

    return (
        <NavigationContainer
            theme={{
                dark: true,
                colors: {
                    primary: COLORS.primary,
                    background: COLORS.background,
                    card: COLORS.backgroundLight,
                    text: COLORS.text,
                    border: COLORS.surface,
                    notification: COLORS.secondary,
                },
            }}
        >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen
                    name="Player"
                    component={PlayerScreen}
                    options={{
                        presentation: 'modal',
                        gestureEnabled: true,
                        gestureDirection: 'vertical',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingTitle: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '700',
        marginTop: 16,
    },
});

export default App;
