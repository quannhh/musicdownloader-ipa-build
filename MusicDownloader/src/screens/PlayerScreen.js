import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import TrackPlayer, {
    useActiveTrack,
    useIsPlaying,
    useProgress,
    RepeatMode,
} from 'react-native-track-player';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../utils/config';

const { width, height } = Dimensions.get('window');

const PlayerScreen = ({ navigation }) => {
    const activeTrack = useActiveTrack();
    const { playing } = useIsPlaying();
    const progress = useProgress();
    const [repeatMode, setRepeatMode] = useState(RepeatMode.Off);
    const [shuffled, setShuffled] = useState(false);
    const spinValue = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (playing) {
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 20000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinValue.stopAnimation();
        }
    }, [playing]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const toggleRepeatMode = async () => {
        const modes = [RepeatMode.Off, RepeatMode.Track, RepeatMode.Queue];
        const currentIndex = modes.indexOf(repeatMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        await TrackPlayer.setRepeatMode(nextMode);
        setRepeatMode(nextMode);
    };

    const getRepeatIcon = () => {
        switch (repeatMode) {
            case RepeatMode.Track:
                return 'repeat';
            case RepeatMode.Queue:
                return 'repeat';
            default:
                return 'repeat';
        }
    };

    const getRepeatColor = () => {
        return repeatMode === RepeatMode.Off ? COLORS.textMuted : COLORS.primary;
    };

    const toggleShuffle = () => {
        setShuffled(!shuffled);
    };

    if (!activeTrack) {
        return (
            <View style={styles.emptyContainer}>
                <StatusBar barStyle="light-content" />
                <Icon name="musical-notes" size={80} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>Chưa có bài hát nào</Text>
                <Text style={styles.emptySubtext}>
                    Chọn một bài hát từ thư viện để bắt đầu nghe
                </Text>
                <TouchableOpacity
                    style={styles.goLibraryBtn}
                    onPress={() => navigation.navigate('Library')}
                >
                    <Text style={styles.goLibraryText}>Đi tới thư viện</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBtn}
                >
                    <Icon name="chevron-down" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerLabel}>ĐANG PHÁT</Text>
                    <Text style={styles.headerSource} numberOfLines={1}>
                        {activeTrack.source || 'Thư viện nhạc'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.headerBtn}>
                    <Icon name="ellipsis-horizontal" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {/* Album Art */}
            <View style={styles.artworkContainer}>
                <Animated.View
                    style={[
                        styles.artworkWrapper,
                        { transform: [{ rotate: spin }] },
                    ]}
                >
                    <Image
                        source={
                            activeTrack.artwork
                                ? { uri: activeTrack.artwork }
                                : require('../assets/default-album.png')
                        }
                        style={styles.artwork}
                        defaultSource={require('../assets/default-album.png')}
                    />
                    <View style={styles.artworkHole} />
                </Animated.View>

                {/* Glow effect */}
                <View style={styles.artworkGlow} />
            </View>

            {/* Song Info */}
            <View style={styles.songInfo}>
                <View style={styles.songTitleRow}>
                    <View style={styles.songTextContainer}>
                        <Text style={styles.songTitle} numberOfLines={1}>
                            {activeTrack.title || 'Unknown'}
                        </Text>
                        <Text style={styles.songArtist} numberOfLines={1}>
                            {activeTrack.artist || 'Unknown Artist'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.favoriteBtn}>
                        <Icon name="heart-outline" size={26} color={COLORS.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <Slider
                    style={styles.slider}
                    value={progress.position}
                    minimumValue={0}
                    maximumValue={progress.duration || 1}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.surfaceLight}
                    thumbTintColor={COLORS.primary}
                    thumbStyle={styles.sliderThumb}
                    trackStyle={styles.sliderTrack}
                    onSlidingComplete={async (value) => {
                        await TrackPlayer.seekTo(value);
                    }}
                />
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
                    <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity onPress={toggleShuffle} style={styles.sideControl}>
                    <Icon
                        name="shuffle"
                        size={24}
                        color={shuffled ? COLORS.primary : COLORS.textMuted}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => TrackPlayer.skipToPrevious()}
                    style={styles.controlBtn}
                >
                    <Icon name="play-skip-back" size={32} color={COLORS.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => (playing ? TrackPlayer.pause() : TrackPlayer.play())}
                    style={styles.playBtn}
                >
                    <Icon
                        name={playing ? 'pause' : 'play'}
                        size={36}
                        color="#FFF"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => TrackPlayer.skipToNext()}
                    style={styles.controlBtn}
                >
                    <Icon name="play-skip-forward" size={32} color={COLORS.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeatMode} style={styles.sideControl}>
                    <Icon name={getRepeatIcon()} size={24} color={getRepeatColor()} />
                    {repeatMode === RepeatMode.Track && (
                        <View style={styles.repeatDot}>
                            <Text style={styles.repeatDotText}>1</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.bottomBtn}>
                    <Icon name="share-outline" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomBtn}>
                    <Icon name="list" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomBtn}>
                    <Icon name="volume-medium" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
    },
    emptySubtext: {
        color: COLORS.textMuted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    goLibraryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 25,
        paddingHorizontal: 30,
        paddingVertical: 12,
        marginTop: 24,
    },
    goLibraryText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 55,
        paddingBottom: 10,
    },
    headerBtn: {
        padding: 8,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerLabel: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
    },
    headerSource: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    artworkContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    artworkWrapper: {
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
    },
    artwork: {
        width: '100%',
        height: '100%',
        borderRadius: width * 0.35,
    },
    artworkHole: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.background,
    },
    artworkGlow: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: COLORS.primary,
        opacity: 0.05,
    },
    songInfo: {
        marginBottom: 20,
    },
    songTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    songTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    songTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    songArtist: {
        color: COLORS.textSecondary,
        fontSize: 16,
        marginTop: 4,
    },
    favoriteBtn: {
        padding: 8,
    },
    progressContainer: {
        marginBottom: 16,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderThumb: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    sliderTrack: {
        height: 4,
        borderRadius: 2,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -8,
    },
    timeText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingHorizontal: 8,
    },
    sideControl: {
        padding: 8,
        position: 'relative',
    },
    controlBtn: {
        padding: 12,
    },
    playBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 35,
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    repeatDot: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    repeatDotText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '700',
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
    },
    bottomBtn: {
        padding: 10,
    },
});

export default PlayerScreen;
