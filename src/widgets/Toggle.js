// src/widgets/Toggle.js
import React, { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Animated, Easing, View } from 'react-native';

const BRAND = '#0EA5E9';

export default function Toggle({ value, onValueChange, disabled = false }) {
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: value ? 1 : 0,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start();
    }, [value, anim]);

    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 26] });
    const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#CBD5E1', BRAND] });

    const onPress = () => { if (!disabled) onValueChange?.(!value); };

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="switch"
            accessibilityState={{ checked: value, disabled }}
            style={({ pressed }) => [styles.toggleBase, { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }]}
            hitSlop={10}
        >
            <Animated.View style={[styles.toggleTrack, { backgroundColor: bgColor }]}>
                <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    toggleBase: { width: 64, height: 38 },
    toggleTrack: { flex: 1, borderRadius: 19, padding: 3, justifyContent: 'center' },
    toggleThumb: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff',
        elevation: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
    },
});
