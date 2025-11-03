// src/widgets/SummaryActionsList.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '../shared/ui/AppText';

const BRAND = '#0EA5E9';

export default function SummaryActionsList({ summary, actions }) {
    return (
        <>
            {summary ? <AppText size={22} style={styles.summary}>{summary}</AppText> : null}
            {Array.isArray(actions) && actions.length > 0 ? (
                <View style={styles.actionsList}>
                    {actions.map((a, idx) => (
                        <View key={`${idx}-${a}`} style={styles.actionItem}>
                            <View style={styles.dot} />
                            <AppText size={18} style={styles.actionText}>{a}</AppText>
                        </View>
                    ))}
                </View>
            ) : null}
        </>
    );
}

const styles = StyleSheet.create({
    summary: { lineHeight: 32, color: '#111', marginTop: 4, fontWeight: '800' },
    actionsList: { marginTop: 10, gap: 10 },
    actionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, marginTop: 10 },
    actionText: { color: '#111', flex: 1 },
});
