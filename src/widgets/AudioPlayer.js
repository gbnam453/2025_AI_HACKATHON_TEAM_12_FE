// src/widgets/AudioPlayer.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';

export default function AudioPlayer({ uri, shouldPlay, muted, volume = 1, onError, sourceKey }) {
    if (!uri) return null;
    return (
        <View style={styles.dock} pointerEvents="none">
            <Video
                key={sourceKey}
                source={{ uri }}
                audioOnly
                controls={false}
                paused={!shouldPlay}
                muted={muted}
                volume={muted ? 0 : volume}
                repeat={false}
                playInBackground={false}
                ignoreSilentSwitch="ignore"
                onError={onError}
                style={styles.video}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    dock: { position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, opacity: 0, overflow: 'hidden' },
    video: { width: 1, height: 1 },
});
