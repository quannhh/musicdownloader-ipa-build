import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
    RefreshControl,
    Animated,
    Dimensions,
    Clipboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/config';
import ApiService from '../services/api';

const { width } = Dimensions.get('window');

const SOURCES = [
    { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#FF0050' },
    { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
    { id: 'soundcloud', name: 'SoundCloud', icon: 'cloud', color: '#FF5500' },
    { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
    { id: 'other', name: 'Other URL', icon: 'link', color: COLORS.primary },
];

const HomeScreen = ({ navigation }) => {
    const [url, setUrl] = useState('');
    const [customTitle, setCustomTitle] = useState('');
    const [customArtist, setCustomArtist] = useState('');
    const [loading, setLoading] = useState(false);
    const [recentSongs, setRecentSongs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [serverStatus, setServerStatus] = useState('checking');
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
        checkServer();
        loadRecentSongs();
    }, []);

    const checkServer = async () => {
        try {
            await ApiService.healthCheck();
            setServerStatus('connected');
        } catch {
            setServerStatus('disconnected');
        }
    };

    const loadRecentSongs = async () => {
        try {
            const result = await ApiService.getSongs();
            if (result.success) {
                setRecentSongs(result.songs.slice(0, 5));
            }
        } catch (e) {
            console.log('Failed to load songs');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await checkServer();
        await loadRecentSongs();
        setRefreshing(false);
    }, []);

    const pasteFromClipboard = async () => {
        try {
            const text = await Clipboard.getString();
            if (text) {
                setUrl(text);
            }
        } catch (e) {
            Alert.alert('Error', 'Cannot access clipboard');
        }
    };

    const handleDownload = async () => {
        if (!url.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập link!');
            return;
        }

        if (serverStatus !== 'connected') {
            Alert.alert('Lỗi', 'Không thể kết nối server. Kiểm tra lại kết nối!');
            return;
        }

        setLoading(true);
        try {
            const result = await ApiService.downloadFromUrl(
                url.trim(),
                customTitle.trim() || undefined,
                customArtist.trim() || undefined
            );

            if (result.success) {
                Alert.alert(
                    '🎉 Tải thành công!',
                    `"${result.song.title}" đã được thêm vào thư viện nhạc!`,
                    [
                        { text: 'OK' },
                        {
                            text: 'Nghe ngay',
                            onPress: () => navigation.navigate('Library'),
                        },
                    ]
                );
                setUrl('');
                setCustomTitle('');
                setCustomArtist('');
                loadRecentSongs();
            } else {
                Alert.alert('Lỗi', result.error || 'Tải không thành công');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể kết nối server. Kiểm tra lại!');
        }
        setLoading(false);
    };

    const getSourceIcon = (sourceUrl) => {
        const source = SOURCES.find(s =>
            sourceUrl && sourceUrl.toLowerCase().includes(s.id)
        );
        return source || SOURCES[SOURCES.length - 1];
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Vừa xong';
        if (mins < 60) return `${mins} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        return `${days} ngày trước`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>🎵 Music Downloader</Text>
                            <Text style={styles.subtitle}>
                                Tải nhạc từ TikTok, YouTube & hơn thế nữa
                            </Text>
                        </View>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: serverStatus === 'connected' ? COLORS.success : COLORS.error }
                        ]} />
                    </View>

                    {/* Server Status Banner */}
                    {serverStatus === 'disconnected' && (
                        <TouchableOpacity style={styles.warningBanner} onPress={checkServer}>
                            <Icon name="warning" size={20} color={COLORS.warning} />
                            <Text style={styles.warningText}>
                                Server chưa kết nối. Nhấn để thử lại
                            </Text>
                            <Icon name="refresh" size={18} color={COLORS.warning} />
                        </TouchableOpacity>
                    )}

                    {/* Supported Sources */}
                    <View style={styles.sourcesContainer}>
                        <Text style={styles.sectionTitle}>Nguồn hỗ trợ</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {SOURCES.map((source) => (
                                <View key={source.id} style={styles.sourceChip}>
                                    <Icon name={source.icon} size={16} color={source.color} />
                                    <Text style={styles.sourceChipText}>{source.name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* URL Input Card */}
                    <View style={styles.inputCard}>
                        <View style={styles.inputHeader}>
                            <Icon name="link" size={20} color={COLORS.primary} />
                            <Text style={styles.inputLabel}>Nhập link bài hát</Text>
                        </View>

                        <View style={styles.urlInputContainer}>
                            <TextInput
                                style={styles.urlInput}
                                placeholder="Dán link TikTok, YouTube, SoundCloud..."
                                placeholderTextColor={COLORS.textMuted}
                                value={url}
                                onChangeText={setUrl}
                                autoCapitalize="none"
                                autoCorrect={false}
                                multiline={false}
                            />
                            <TouchableOpacity
                                style={styles.pasteBtn}
                                onPress={pasteFromClipboard}
                            >
                                <Icon name="clipboard" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Advanced Options */}
                        <TouchableOpacity
                            style={styles.advancedToggle}
                            onPress={() => setShowAdvanced(!showAdvanced)}
                        >
                            <Text style={styles.advancedToggleText}>
                                Tuỳ chỉnh thông tin bài hát
                            </Text>
                            <Icon
                                name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={COLORS.textMuted}
                            />
                        </TouchableOpacity>

                        {showAdvanced && (
                            <View style={styles.advancedContainer}>
                                <TextInput
                                    style={styles.advancedInput}
                                    placeholder="Tên bài hát (tuỳ chọn)"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={customTitle}
                                    onChangeText={setCustomTitle}
                                />
                                <TextInput
                                    style={styles.advancedInput}
                                    placeholder="Nghệ sĩ (tuỳ chọn)"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={customArtist}
                                    onChangeText={setCustomArtist}
                                />
                            </View>
                        )}

                        {/* Download Button */}
                        <TouchableOpacity
                            style={[
                                styles.downloadBtn,
                                loading && styles.downloadBtnDisabled,
                            ]}
                            onPress={handleDownload}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#FFF" size="small" />
                                    <Text style={styles.downloadBtnText}>
                                        Đang tải xuống...
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.loadingContainer}>
                                    <Icon name="download" size={22} color="#FFF" />
                                    <Text style={styles.downloadBtnText}>
                                        Tải xuống & Thêm vào thư viện
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Quick Tips */}
                    <View style={styles.tipsContainer}>
                        <Text style={styles.sectionTitle}>💡 Mẹo sử dụng</Text>
                        <View style={styles.tipCard}>
                            <Icon name="copy" size={18} color={COLORS.accent} />
                            <Text style={styles.tipText}>
                                Copy link từ TikTok/YouTube → Dán vào đây → Tải xuống
                            </Text>
                        </View>
                        <View style={styles.tipCard}>
                            <Icon name="musical-note" size={18} color={COLORS.secondary} />
                            <Text style={styles.tipText}>
                                App tự động chuyển video thành file MP3 chất lượng cao
                            </Text>
                        </View>
                        <View style={styles.tipCard}>
                            <Icon name="wifi" size={18} color={COLORS.success} />
                            <Text style={styles.tipText}>
                                Đảm bảo iPhone và máy tính cùng mạng WiFi
                            </Text>
                        </View>
                    </View>

                    {/* Recent Downloads */}
                    {recentSongs.length > 0 && (
                        <View style={styles.recentContainer}>
                            <View style={styles.recentHeader}>
                                <Text style={styles.sectionTitle}>📥 Tải gần đây</Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Library')}
                                >
                                    <Text style={styles.seeAllText}>Xem tất cả →</Text>
                                </TouchableOpacity>
                            </View>
                            {recentSongs.map((song) => {
                                const source = getSourceIcon(song.sourceUrl);
                                return (
                                    <View key={song.id} style={styles.recentItem}>
                                        <View style={[styles.recentIcon, { backgroundColor: source.color + '20' }]}>
                                            <Icon name={source.icon} size={18} color={source.color} />
                                        </View>
                                        <View style={styles.recentInfo}>
                                            <Text style={styles.recentTitle} numberOfLines={1}>
                                                {song.title}
                                            </Text>
                                            <Text style={styles.recentMeta}>
                                                {song.artist} · {formatDate(song.createdAt)}
                                            </Text>
                                        </View>
                                        <Icon name="checkmark-circle" size={20} color={COLORS.success} />
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    <View style={{ height: 120 }} />
                </Animated.View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 60,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 8,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.warning + '15',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    warningText: {
        flex: 1,
        color: COLORS.warning,
        fontSize: 13,
    },
    sourcesContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    sourceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        gap: 6,
    },
    sourceChipText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    inputCard: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    urlInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    urlInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    pasteBtn: {
        padding: 14,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.surfaceLight,
    },
    advancedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 4,
    },
    advancedToggleText: {
        color: COLORS.textMuted,
        fontSize: 13,
    },
    advancedContainer: {
        gap: 10,
        marginBottom: 10,
    },
    advancedInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        color: COLORS.text,
        fontSize: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    downloadBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    downloadBtnDisabled: {
        backgroundColor: COLORS.primaryDark,
        opacity: 0.8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    downloadBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    tipsContainer: {
        marginBottom: 24,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        gap: 12,
    },
    tipText: {
        flex: 1,
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    recentContainer: {
        marginBottom: 20,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    seeAllText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        gap: 12,
    },
    recentIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentInfo: {
        flex: 1,
    },
    recentTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    recentMeta: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
});

export default HomeScreen;
