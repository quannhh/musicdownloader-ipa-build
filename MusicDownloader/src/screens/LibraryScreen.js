import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    TextInput,
    Alert,
    RefreshControl,
    StatusBar,
    Animated,
    Dimensions,
} from 'react-native';
import TrackPlayer from 'react-native-track-player';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../utils/config';
import ApiService from '../services/api';
import { addTracks } from '../services/PlayerService';

const { width } = Dimensions.get('window');

const LibraryScreen = ({ navigation }) => {
    const [songs, setSongs] = useState([]);
    const [filteredSongs, setFilteredSongs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
        loadSongs();
    }, []);

    useEffect(() => {
        filterSongs();
    }, [songs, searchQuery, activeFilter, sortBy]);

    const loadSongs = async () => {
        try {
            const result = await ApiService.getSongs();
            if (result.success) {
                setSongs(result.songs);
            }
        } catch (e) {
            console.log('Failed to load songs');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSongs();
        setRefreshing(false);
    }, []);

    const filterSongs = () => {
        let filtered = [...songs];

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.title.toLowerCase().includes(query) ||
                    s.artist.toLowerCase().includes(query)
            );
        }

        // Filter by category
        if (activeFilter === 'favorites') {
            filtered = filtered.filter((s) => s.favorite);
        } else if (activeFilter === 'tiktok') {
            filtered = filtered.filter((s) => s.source === 'tiktok');
        } else if (activeFilter === 'youtube') {
            filtered = filtered.filter((s) => s.source === 'youtube');
        }

        // Sort
        if (sortBy === 'recent') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'name') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'artist') {
            filtered.sort((a, b) => a.artist.localeCompare(b.artist));
        }

        setFilteredSongs(filtered);
    };

    const playSong = async (song, index) => {
        try {
            const tracks = filteredSongs.map((s) => ({
                id: s.id,
                url: ApiService.getAudioUrl(s.audioUrl),
                title: s.title,
                artist: s.artist,
                artwork: ApiService.getThumbnailUrl(s.thumbnail),
                duration: s.duration,
                source: s.source,
            }));

            await addTracks(tracks);
            await TrackPlayer.skip(index);
            await TrackPlayer.play();
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể phát bài hát');
        }
    };

    const toggleFavorite = async (songId) => {
        try {
            const result = await ApiService.toggleFavorite(songId);
            if (result.success) {
                setSongs((prev) =>
                    prev.map((s) =>
                        s.id === songId ? { ...s, favorite: result.song.favorite } : s
                    )
                );
            }
        } catch (e) {
            console.log('Failed to toggle favorite');
        }
    };

    const deleteSong = (song) => {
        Alert.alert(
            'Xoá bài hát',
            `Bạn có chắc muốn xoá "${song.title}"?`,
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Xoá',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await ApiService.deleteSong(song.id);
                            setSongs((prev) => prev.filter((s) => s.id !== song.id));
                        } catch (e) {
                            Alert.alert('Lỗi', 'Không thể xoá bài hát');
                        }
                    },
                },
            ]
        );
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const getSourceColor = (source) => {
        const colors = {
            tiktok: '#FF0050',
            youtube: '#FF0000',
            soundcloud: '#FF5500',
            instagram: '#E1306C',
            facebook: '#1877F2',
            twitter: '#1DA1F2',
        };
        return colors[source] || COLORS.primary;
    };

    const getSourceIcon = (source) => {
        const icons = {
            tiktok: 'musical-notes',
            youtube: 'logo-youtube',
            soundcloud: 'cloud',
            instagram: 'logo-instagram',
            facebook: 'logo-facebook',
            twitter: 'logo-twitter',
        };
        return icons[source] || 'link';
    };

    const FILTERS = [
        { id: 'all', label: 'Tất cả', icon: 'apps' },
        { id: 'favorites', label: 'Yêu thích', icon: 'heart' },
        { id: 'tiktok', label: 'TikTok', icon: 'musical-notes' },
        { id: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
    ];

    const playAll = async () => {
        if (filteredSongs.length === 0) return;
        await playSong(filteredSongs[0], 0);
    };

    const renderSongItem = ({ item, index }) => (
        <TouchableOpacity
            style={styles.songItem}
            onPress={() => playSong(item, index)}
            activeOpacity={0.7}
        >
            <View style={styles.songLeft}>
                <View style={styles.thumbnailContainer}>
                    {item.thumbnail ? (
                        <Image
                            source={{ uri: ApiService.getThumbnailUrl(item.thumbnail) }}
                            style={styles.thumbnail}
                        />
                    ) : (
                        <View style={[styles.thumbnailPlaceholder, { backgroundColor: getSourceColor(item.source) + '30' }]}>
                            <Icon
                                name={getSourceIcon(item.source)}
                                size={20}
                                color={getSourceColor(item.source)}
                            />
                        </View>
                    )}
                    <View style={styles.playOverlay}>
                        <Icon name="play" size={14} color="#FFF" />
                    </View>
                </View>

                <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <View style={styles.songMeta}>
                        <Text style={styles.songArtist} numberOfLines={1}>
                            {item.artist}
                        </Text>
                        {item.duration > 0 && (
                            <Text style={styles.songDuration}>
                                · {formatDuration(item.duration)}
                            </Text>
                        )}
                    </View>
                    <View style={styles.sourceTag}>
                        <View
                            style={[
                                styles.sourceDot,
                                { backgroundColor: getSourceColor(item.source) },
                            ]}
                        />
                        <Text style={styles.sourceText}>{item.source}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.songActions}>
                <TouchableOpacity
                    onPress={() => toggleFavorite(item.id)}
                    style={styles.actionBtn}
                >
                    <Icon
                        name={item.favorite ? 'heart' : 'heart-outline'}
                        size={20}
                        color={item.favorite ? COLORS.secondary : COLORS.textMuted}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => deleteSong(item)}
                    style={styles.actionBtn}
                >
                    <Icon name="trash-outline" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>🎶 Thư viện nhạc</Text>
                    <Text style={styles.songCount}>
                        {songs.length} bài hát
                    </Text>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Icon name="search" size={18} color={COLORS.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm bài hát, nghệ sĩ..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    <FlatList
                        horizontal
                        data={FILTERS}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    activeFilter === item.id && styles.filterChipActive,
                                ]}
                                onPress={() => setActiveFilter(item.id)}
                            >
                                <Icon
                                    name={item.icon}
                                    size={14}
                                    color={
                                        activeFilter === item.id
                                            ? '#FFF'
                                            : COLORS.textSecondary
                                    }
                                />
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        activeFilter === item.id &&
                                        styles.filterChipTextActive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Play All & Sort */}
                {filteredSongs.length > 0 && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.playAllBtn} onPress={playAll}>
                            <Icon name="play" size={16} color="#FFF" />
                            <Text style={styles.playAllText}>Phát tất cả</Text>
                        </TouchableOpacity>

                        <View style={styles.sortContainer}>
                            <TouchableOpacity
                                style={styles.sortBtn}
                                onPress={() => {
                                    const sorts = ['recent', 'name', 'artist'];
                                    const current = sorts.indexOf(sortBy);
                                    setSortBy(sorts[(current + 1) % sorts.length]);
                                }}
                            >
                                <Icon name="swap-vertical" size={16} color={COLORS.textSecondary} />
                                <Text style={styles.sortText}>
                                    {sortBy === 'recent' ? 'Mới nhất' : sortBy === 'name' ? 'Tên' : 'Nghệ sĩ'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Song List */}
                <FlatList
                    data={filteredSongs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSongItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="musical-notes-outline" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Không tìm thấy bài hát' : 'Thư viện trống'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? 'Thử từ khoá khác'
                                    : 'Tải nhạc từ tab Home để bắt đầu'
                                }
                            </Text>
                        </View>
                    }
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
    },
    songCount: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        marginHorizontal: 20,
        marginVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 14,
        paddingVertical: 12,
    },
    filtersContainer: {
        paddingLeft: 20,
        marginBottom: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
    },
    filterChipText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#FFF',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    playAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    playAllText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    sortText: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 140,
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
    },
    songLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    thumbnailContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playOverlay: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    songInfo: {
        flex: 1,
        marginLeft: 12,
    },
    songTitle: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
    },
    songMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    songArtist: {
        color: COLORS.textSecondary,
        fontSize: 13,
        maxWidth: width * 0.35,
    },
    songDuration: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginLeft: 4,
    },
    sourceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    sourceDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    sourceText: {
        color: COLORS.textMuted,
        fontSize: 11,
        textTransform: 'capitalize',
    },
    songActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    actionBtn: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyText: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginTop: 8,
    },
});

export default LibraryScreen;
