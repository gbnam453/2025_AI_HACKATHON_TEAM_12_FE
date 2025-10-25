import React, { useRef } from 'react';
import { View, StyleSheet, Alert, useWindowDimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import AppText from '../shared/ui/AppText';

const RADIUS = 16;
const BRAND = '#0EA5E9';
const GAP_SM = 8;   // 작은 여백
const GAP_MD = 12;  // 중간 여백
const GAP_LG = 20;  // 로고와 미리보기 사이 큰 여백

export default function MainPage({ navigation }) {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('back');
  const cameraRef = useRef(null);
  const { width } = useWindowDimensions();

  const previewWidth = width - 32;
  const previewHeight = Math.round((4 / 3) * previewWidth); // 3:4 (세로형)

  const onCapture = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      navigation.navigate('InfoPage', {
        summary: '임시 요약: 청구 24,800원 · 기한 10월 31일.',
        photo,
      });
    } catch {
      Alert.alert('촬영 실패', '카메라 상태를 확인해주세요.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      {/* 상단 로고 */}
      <View style={styles.header}>
        <AppText size={22} style={styles.brand}>디누리</AppText>
      </View>

      {/* 본문: 미리보기 + (유동 비율) 촬영:하단버튼 = 2:1 */}
      <View style={[styles.body, { paddingBottom: insets.bottom + GAP_MD }]}>
        {/* 미리보기: 로고 하단에 붙이되 적당한 여백 부여 */}
        <View style={[styles.previewWindow, { width: previewWidth, height: previewHeight, marginTop: GAP_LG }]}>
          {device ? (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive
              photo
            />
          ) : (
            <View style={styles.previewFallback}>
              <AppText size={16} style={{ color: '#999' }}>카메라 준비 중…</AppText>
            </View>
          )}
        </View>

        {/* 하단 영역: 2:1 비율 */}
        <View style={styles.bottomArea}>
          {/* 촬영(2) */}
          <View style={styles.captureArea}>
            <Pressable style={styles.captureBtn} accessibilityRole="button" onPress={onCapture}>
              <AppText size={20} tight style={styles.captureText}>촬영</AppText>
            </Pressable>
          </View>

          {/* 이용내역/설정(1) */}
          <View style={styles.rowArea}>
            <Pressable
              style={styles.secondaryBtn}
              accessibilityRole="button"
              onPress={() => navigation.navigate('HistoryPage')}
            >
              <AppText size={20} tight style={styles.secondaryText}>이용내역</AppText>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              accessibilityRole="button"
              onPress={() => navigation.navigate('SettingsPage')}
            >
              <AppText size={20} tight style={styles.secondaryText}>설정</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  brand: { fontWeight: '800', color: BRAND },

  // 본문 레이아웃: 미리보기는 상단, 하단은 유동 비율(촬영2 : 하단 버튼1)
  body: { flex: 1, paddingHorizontal: 16, justifyContent: 'flex-start' },

  // 카메라 뷰(창문)
  previewWindow: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignSelf: 'center',
  },
  previewFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // 하단 비율 영역
  bottomArea: { flex: 1, marginTop: GAP_SM },
  captureArea: { flex: 2 },
  rowArea: {
    flex: 1,
    flexDirection: 'row',
    gap: GAP_SM,
    marginTop: GAP_SM,
    alignItems: 'stretch',
  },

  // 촬영 버튼: 부모 높이 100% 채워서 유동적으로 커짐
  captureBtn: {
    backgroundColor: BRAND,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    height: '100%',
    minHeight: 96,
    paddingVertical: 12,
  },
  captureText: { color: '#fff', fontWeight: '800' },

  // 하단 두 버튼: 부모(rowArea) 높이를 가득 채움
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  secondaryText: { color: '#111', fontWeight: '700' },
});
