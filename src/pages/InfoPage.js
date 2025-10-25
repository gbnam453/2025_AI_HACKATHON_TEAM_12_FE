import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../shared/ui/AppText';

export default function InfoPage({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const summary = route?.params?.summary ?? '임시 요약을 불러오는 중입니다.';

    return (
        <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
            <View style={[styles.container, { paddingBottom: 16 + insets.bottom }]}>
                <View>
                    <AppText size={28} style={styles.title}>한 줄 요약</AppText>
                    <AppText size={22} style={styles.summary}>{summary}</AppText>
                </View>

                <View style={styles.actions}>
                    <Pressable style={[styles.btn, styles.secondary]} onPress={() => navigation.navigate('MainPage')}>
                        <AppText size={18} style={[styles.btnText, styles.secondaryText]}>재촬영</AppText>
                    </Pressable>
                    <Pressable style={[styles.btn, styles.primary]} onPress={() => navigation.navigate('SplashPage')}>
                        <AppText size={18} style={styles.btnText}>완료</AppText>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, padding: 24, justifyContent: 'space-between' },
    title: { fontWeight: '800', color: '#111' },
    summary: { lineHeight: 32, color: '#111', marginTop: 16 },
    actions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    btn: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, minWidth: 140, alignItems: 'center' },
    primary: { backgroundColor: '#0EA5E9' },
    secondary: { backgroundColor: '#E5E7EB' },
    btnText: { fontWeight: '800', color: '#fff' },
    secondaryText: { color: '#111' },
});
