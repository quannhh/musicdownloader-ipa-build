import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    StatusBar,
    Linking,
    Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_BASE_URL } from '../utils/config';
import ApiService from '../services/api';

const SettingsScreen = () => {
    const [serverUrl, setServerUrl] = useState(API_BASE_URL);
    const [serverStatus, setServerStatus] = useState('unknown');
    const [songCount, setSongCount] = useState(0);
    const [autoPlay, setAutoPlay] = useState(true);
    const [highQuality, setHighQuality] = useState(true);

    useEffect(() => {
        checkServer();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('settings');
            if (saved) {
                const settings = JSON.parse(saved);
                setAutoPlay(settings.autoPlay ?? true);
                setHighQuality(settings.highQuality ?? true);
            }
        } catch (e) { }
    };

    const saveSettings = async (key, value) => {
        try {
            const saved = await AsyncStorage.getItem('settings');
            const settings = saved ? JSON.parse(saved) : {};
            settings[key] = value;
            await AsyncStorage.setItem('settings', JSON.stringify(settings));
        } catch (e) { }
    };

    const checkServer = async () => {
        setServerStatus('checking');
        try {
            const result = await ApiService.healthCheck();
            if (result.status === 'ok') {
                setServerStatus('connected');
            }
            const songs = await ApiService.getSongs();
            if (songs.success) {
                setSongCount(songs.songs.length);
            }
        } catch {
            setServerStatus('disconnected');
        }
    };

    const clearAllSongs = () => {
        Alert.alert(
            'Xoá tất cả bài hát',
            'Bạn có chắc muốn xoá toàn bộ thư viện nhạc? Hành động này không thể hoàn tác.',
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Xoá tất cả',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await ApiService.getSongs();
                            if (result.success) {
                                for (const song of result.songs) {
                                    await ApiService.deleteSong(song.id);
                                }
                                setSongCount(0);
                                Alert.alert('Thành công', 'Đã xoá tất cả bài hát');
                            }
                        } catch (e) {
                            Alert.alert('Lỗi', 'Không thể xoá');
                        }
                    },
                },
            ]
        );
    };

    const SettingItem = ({ icon, iconColor, title, subtitle, onPress, rightComponent }) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={[styles.settingIcon, { backgroundColor: (iconColor || COLORS.primary) + '20' }]}>
                <Icon name={icon} size={20} color={iconColor || COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightComponent || (
                onPress && <Icon name="chevron-forward" size={18} color={COLORS.textMuted} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>⚙️ Cài đặt</Text>
                </View>

                {/* Server Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kết nối Server</Text>
                    <View style={styles.card}>
                        <View style={styles.serverStatusRow}>
                            <View style={styles.serverStatusLeft}>
                                <View
                                    style={[
                                        styles.statusIndicator,
                                        {
                                            backgroundColor:
                                                serverStatus === 'connected'
                                                    ? COLORS.success
                                                    : serverStatus === 'checking'
                                                        ? COLORS.warning
                                                        : COLORS.error,
                                        },
                                    ]}
                                />
                                <View>
                                    <Text style={styles.statusText}>
                                        {serverStatus === 'connected'
                                            ? 'Đã kết nối'
                                            : serverStatus === 'checking'
                                                ? 'Đang kiểm tra...'
                                                : 'Mất kết nối'}
                                    </Text>
                                    <Text style={styles.serverUrlText}>{serverUrl}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.refreshBtn}
                                onPress={checkServer}
                            >
                                <Icon name="refresh" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Library */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thư viện</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="musical-notes"
                            iconColor={COLORS.primary}
                            title="Tổng số bài hát"
                            subtitle={`${songCount} bài hát trong thư viện`}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="trash"
                            iconColor={COLORS.error}
                            title="Xoá tất cả bài hát"
                            subtitle="Xoá toàn bộ thư viện nhạc"
                            onPress={clearAllSongs}
                        />
                    </View>
                </View>

                {/* Playback */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Phát nhạc</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="play-circle"
                            iconColor={COLORS.success}
                            title="Tự động phát"
                            subtitle="Tự động phát bài tiếp theo"
                            rightComponent={
                                <Switch
                                    value={autoPlay}
                                    onValueChange={(v) => {
                                        setAutoPlay(v);
                                        saveSettings('autoPlay', v);
                                    }}
                                    trackColor={{ false: COLORS.surface, true: COLORS.primary + '80' }}
                                    thumbColor={autoPlay ? COLORS.primary : COLORS.textMuted}
                                />
                            }
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="diamond"
                            iconColor={COLORS.accent}
                            title="Chất lượng cao"
                            subtitle="Tải nhạc chất lượng tốt nhất"
                            rightComponent={
                                <Switch
                                    value={highQuality}
                                    onValueChange={(v) => {
                                        setHighQuality(v);
                                        saveSettings('highQuality', v);
                                    }}
                                    trackColor={{ false: COLORS.surface, true: COLORS.primary + '80' }}
                                    thumbColor={highQuality ? COLORS.primary : COLORS.textMuted}
                                />
                            }
                        />
                    </View>
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="information-circle"
                            iconColor={COLORS.primary}
                            title="Music Downloader"
                            subtitle="Phiên bản 1.0.0"
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="heart"
                            iconColor={COLORS.secondary}
                            title="Hỗ trợ nguồn"
                            subtitle="TikTok, YouTube, SoundCloud, Instagram, Facebook, Twitter..."
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="code-slash"
                            iconColor={COLORS.accent}
                            title="Sử dụng yt-dlp"
                            subtitle="Công cụ tải nhạc mạnh mẽ & miễn phí"
                        />
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hướng dẫn cài đặt</Text>
                    <View style={styles.card}>
                        <View style={styles.instructionItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.instructionText}>
                                Cài đặt yt-dlp trên máy tính: pip install yt-dlp
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.instructionText}>
                                Cài đặt ffmpeg trên máy tính
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.instructionText}>
                                Chạy server: cd backend && node server.js
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>4</Text>
                            </View>
                            <Text style={styles.instructionText}>
                                Kết nối iPhone và máy tính cùng WiFi
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>5</Text>
                            </View>
                            <Text style={styles.instructionText}>
                                Copy link từ TikTok/YouTube và dán vào app
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: 16,
        overflow: 'hidden',
    },
    serverStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    serverStatusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
    },
    serverUrlText: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    refreshBtn: {
        padding: 8,
        backgroundColor: COLORS.primary + '15',
        borderRadius: 10,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
    },
    settingSubtitle: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.surfaceLight,
        marginLeft: 62,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        gap: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    instructionText: {
        flex: 1,
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 20,
    },
});

export default SettingsScreen;
