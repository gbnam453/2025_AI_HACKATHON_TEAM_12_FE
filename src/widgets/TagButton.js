// src/widgets/TagButton.js
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import AppText from '../shared/ui/AppText';

export default function TagButton({ label, onPress, disabled = false, variant = 'secondary' }) {
    return (
        <Pressable
            style={[styles.btn, variant === 'primary' ? styles.primary : styles.secondary, disabled && styles.disabled]}
            onPress={onPress}
            accessibilityRole="button"
            disabled={disabled}
        >
            <AppText size={18} style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>
                {label}
            </AppText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    primary: { backgroundColor: '#0EA5E9' },
    primaryText: { color: '#fff', fontWeight: '800' },
    secondary: { backgroundColor: '#E5E7EB' },
    secondaryText: { color: '#111', fontWeight: '800' },
    disabled: { opacity: 0.5 },
});
