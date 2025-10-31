// src/pages/SettingsPage.js
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Pressable, StyleSheet } from 'react-native';
import AppText from '../widgets/AppText';
import { useTypography } from '../entities/typography';
import BackIcon from '../shared/assets/images/Button_Back.svg';
import Toggle from '../widgets/Toggle';

import pkg from '../../package.json';
import appJson from '../../app.json';

const BRAND = '#0EA5E9';
const RADIUS = 14;
const HEADER_H = 56;

const APP_VERSION =
    (appJson?.expo && appJson.expo.version) ||
    (pkg && pkg.version) ||
    'unknown';

export default function SettingsPage({ navigation }) {
  const { mode, setMode, autoTts, setAutoTts } = useTypography();

  const SizeItem = ({ value, label, hint }) => {
    const active = mode === value;
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => setMode(value)}
            style={[styles.sizeItem, active && styles.sizeItemActive]}
            hitSlop={10}
        >
          <View style={styles.sizeItemLeft}>
            <View style={[styles.radio, active && styles.radioActive]}>
              {active ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={18} style={[styles.sizeLabel, active && styles.sizeLabelActive]}>{label}</AppText>
              {hint ? <AppText size={14} style={styles.sizeHint}>{hint}</AppText> : null}
            </View>
          </View>
        </Pressable>
    );
  };

  return (
      <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
        {/* 헤더: 뒤로가기 + 제목 */}
        <View style={styles.headerRow}>
          <Pressable
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={12}
          >
            <BackIcon width={28} height={28} />
          </Pressable>
          <View style={styles.titleWrap}>
            <AppText size={24} tight style={styles.headerTitle}>설정</AppText>
          </View>
          <View style={{ width: HEADER_H }} />
        </View>

        {/* 글씨 크기 */}
        <View style={styles.section}>
          <AppText size={18} style={styles.sectionTitle}>글씨 크기</AppText>
          <AppText size={14} style={styles.sectionHelp}>글씨가 작게 보이면 ‘크게’나 ‘더 크게’를 선택하세요.</AppText>

          <View style={styles.sizeList}>
            <SizeItem value="normal" label="보통" hint="기본 크기" />
            <SizeItem value="large" label="크게" hint="가독성 향상(추천)" />
            <SizeItem value="xlarge" label="더 크게" hint="최대 크기" />
          </View>
        </View>

        {/* 나레이션 */}
        <View style={styles.section}>
          <AppText size={18} style={styles.sectionTitle}>나레이션</AppText>
          <AppText size={14} style={styles.sectionHelp}>요약을 자동으로 읽어줘요.</AppText>
          <View style={styles.toggleRow}>
            <AppText size={18} style={styles.toggleLabel}>요약 나레이션 자동 재생</AppText>
            <Toggle value={!!autoTts} onValueChange={setAutoTts} />
          </View>
        </View>

        {/* 앱 버전 */}
        <View style={styles.section}>
          <AppText size={14} style={styles.version}>앱 버전 v{APP_VERSION}</AppText>
        </View>

        {/* 하단 완료 */}
        <View style={styles.footer}>
          <Pressable
              accessibilityRole="button"
              accessibilityLabel="설정 완료"
              onPress={() => navigation.goBack()}
              style={styles.primary}
          >
            <AppText size={20} style={styles.primaryText}>완료</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  headerRow: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backBtn: {
    width: HEADER_H,
    height: HEADER_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  titleWrap: { flex: 1, height: HEADER_H, justifyContent: 'center' },
  headerTitle: { fontWeight: '800', color: '#0B0B0B', marginLeft: -10 },

  section: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 10 },
  sectionTitle: { fontWeight: '800', color: '#0B0B0B' },
  sectionHelp: { color: '#475569' },

  sizeList: { gap: 10, marginTop: 2 },
  sizeItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  sizeItemActive: { borderColor: BRAND, backgroundColor: '#E0F2FE' },
  sizeItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  radioActive: { borderColor: BRAND },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },

  sizeLabel: { color: '#0B0B0B', fontWeight: '800' },
  sizeLabelActive: { color: '#075985' },
  sizeHint: { color: '#64748B', marginTop: 2 },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: RADIUS, borderWidth: 1, borderColor: '#E2E8F0',
    paddingVertical: 14, paddingHorizontal: 16, marginTop: 6,
  },
  toggleLabel: { color: '#0B0B0B', fontWeight: '800' },

  version: { color: '#6B7280' },

  footer: { marginTop: 'auto', padding: 16 },
  primary: {
    backgroundColor: BRAND, paddingVertical: 18, minHeight: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
});
