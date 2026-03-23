import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import TrackPlayer, {
    useActiveTrack,
    useIsPlaying,
    useProgress,
} from 'react-native-track-player';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../utils/config';

const { width } = Dimensions.get('window');

const MiniPlayer = ({ onPress }) => {
    const activeTrack = useActiveTrack();
    const { playing } = useIsPlaying();
    const progress = useProgress();

    if (!activeTrack) return null;

    const progressPercent = progress.duration > 0
        ? (progress.position / progress.duration) * 100
        : 0;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            <View style={styles.content}>
                <Image
                    source={
                        activeTrack.artwork
                            ? { uri: activeTrack.artwork }
                            : require('../assets/default-album.png')
                    }
                    style={styles.artwork}
                    defaultSource={require('../assets/default-album.png')}
                />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {activeTrack.title || 'Unknown'}
                    </Text>
                    <Text style={styles.artist} numberOfLines={1}>
                        {activeTrack.artist || 'Unknown Artist'}
                    </Text>
                </View>
                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={() => TrackPlayer.skipToPrevious()}
                        style={styles.controlBtn}
                    >
                        <Icon name="play-skip-back" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => (playing ? TrackPlayer.pause() : TrackPlayer.play())}
                        style={styles.playBtn}
                    >
                        <Icon
                            name={playing ? 'pause' : 'play'}
                            size={22}
                            color={COLORS.text}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => TrackPlayer.skipToNext()}
                        style={styles.controlBtn}
                    >
                        <Icon name="play-skip-forward" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight,
        overflow: 'hidden',
    },
    progressBar: {
        height: 2,
        backgroundColor: COLORS.primary,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    artwork: {
        width: 45,
        height: 45,
        borderRadius: 8,
        backgroundColor: COLORS.backgroundCard,
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    artist: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    controlBtn: {
        padding: 8,
    },
    playBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MiniPlayer;
