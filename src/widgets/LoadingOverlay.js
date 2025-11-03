// src/widgets/LoadingOverlay.js
import React from 'react';
import { View, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import AppText from '../shared/ui/AppText';

const BRAND = '#0EA5E9';

export default function LoadingOverlay({ top = 0, left = 16, right = 16, bottom = 0, loading, message, error, onRetry }) {
    return (
        <View pointerEvents="box-none" style={[styles.overlay, { top, left, right, bottom }]}>
            <View style={styles.centerBox}>
                {loading ? (
                    <>
                        <ActivityIndicator size="large" />
                        <AppText size={16} style={styles.loaderText}>{message}</AppText>
                    </>
                ) : (
                    <>
                        <AppText size={16} style={styles.error}>{error}</AppText>
                        {!!onRetry && (
                            <Pressable style={styles.retryPill} onPress={onRetry} accessibilityRole="button">
                                <AppText size={16} style={styles.retryText}>다시 시도</AppText>
                            </Pressable>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    centerBox: { alignItems: 'center', gap: 10 },
    loaderText: { color: '#6B7280', textAlign: 'center' },
    error: { color: '#ef4444', textAlign: 'center' },
    retryPill: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#EFF6FF' },
    retryText: { color: BRAND, fontWeight: '800' },
});
