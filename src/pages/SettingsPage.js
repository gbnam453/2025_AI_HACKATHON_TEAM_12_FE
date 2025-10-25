import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import AppText from '../shared/ui/AppText';
import { useTypography } from '../shared/model/typography';
import BackIcon from '../assets/images/Button_Back.svg';

import pkg from '../../package.json';
import appJson from '../../app.json';

const BRAND = '#0EA5E9';
const RADIUS = 14;
const HEADER_H = 56;

const APP_VERSION =
  (appJson?.expo && appJson.expo.version) ||
  (pkg && pkg.version) ||
  'unknown';

/**
 * Custom Toggle (no native Switch). Animated thumb & background.
 * — 크기 확대(시니어용), 대비 강화
 */
function Toggle({ value, onValueChange, disabled = false }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // backgroundColor interpolation requires false
    }).start();
  }, [value, anim]);

  // 64x38 트랙, 썸 32, 패딩 3 → 이동량 26
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 26],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#CBD5E1', BRAND], // 더 진한 비활성 대비
  });

  const onPress = () => {
    if (disabled) return;
    onValueChange?.(!value);
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={({ pressed }) => [
        styles.toggleBase,
        { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
      ]}
      hitSlop={10}
    >
      <Animated.View style={[styles.toggleTrack, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export default function SettingsPage({ navigation }) {
  const { mode, setMode } = useTypography();
  const [autoTts, setAutoTts] = useState(true);

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
      {/* 헤더: 뒤로가기 + 제목(왼쪽 정렬, 더 큰 터치 영역) */}
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

        {/* 가로 3분할 대신, 터치가 쉬운 세로 리스트로 변경 */}
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
          <Toggle value={autoTts} onValueChange={setAutoTts} />
        </View>
      </View>

      {/* 앱 버전 */}
      <View style={styles.section}>
        <AppText size={14} style={styles.version}>앱 버전 v{APP_VERSION}</AppText>
      </View>

      {/* 하단: 완료 버튼(큰 터치 영역) */}
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
  titleWrap: {
    flex: 1,
    height: HEADER_H,
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    color: '#0B0B0B',
    marginLeft: -10,
  },

  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  sectionTitle: { fontWeight: '800', color: '#0B0B0B' },
  sectionHelp: { color: '#475569' },

  // 세로형 큰 버튼 리스트
  sizeList: { gap: 10, marginTop: 2 },
  sizeItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  sizeItemActive: {
    borderColor: BRAND,
    backgroundColor: '#E0F2FE',
  },
  sizeItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioActive: { borderColor: BRAND },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },

  sizeLabel: { color: '#0B0B0B', fontWeight: '800' },
  sizeLabelActive: { color: '#075985' },
  sizeHint: { color: '#64748B', marginTop: 2 },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  toggleLabel: { color: '#0B0B0B', fontWeight: '800' },

  // Custom toggle (larger)
  toggleBase: { width: 64, height: 38 },
  toggleTrack: {
    flex: 1,
    borderRadius: 19,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 1, // Android shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },

  version: { color: '#6B7280' },

  footer: { marginTop: 'auto', padding: 16 },
  primary: {
    backgroundColor: BRAND,
    paddingVertical: 18,
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
});
