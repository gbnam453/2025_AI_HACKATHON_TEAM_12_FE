// src/pages/MainPage.js
import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, useWindowDimensions, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
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
  const isFocused = useIsFocused();        // ← 이 화면에 있을 때만 true
  const cameraRef = useRef(null);
  const { width } = useWindowDimensions();

  // 중복 탭 방지
  const [isCapturing, setIsCapturing] = useState(false);

  // 화면에 다시 들어오면 캡처 가능 상태로 되돌림
  useFocusEffect(
      useCallback(() => {
        setIsCapturing(false);
        return undefined;
      }, [])
  );

  const previewWidth = width - 32;
  const previewHeight = Math.round((4 / 3) * previewWidth); // 3:4 (세로형)

  const onCapture = async () => {
    if (isCapturing) return;
    if (!cameraRef.current) {
      Alert.alert('촬영 실패', '카메라가 아직 준비되지 않았어요.');
      return;
    }
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      // 사진만 넘기고 InfoPage에서 업로드
      navigation.navigate('InfoPage', { photo });
      // 여기서는 굳이 setIsCapturing(false) 안 해도 됨 (화면이 바뀌니까)
    } catch (e) {
      Alert.alert('촬영 실패', '카메라 상태를 확인해주세요.');
      setIsCapturing(false);
    }
  };

  return (
      <View style={[styles.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
        {/* 상단 로고 */}
        <View style={styles.header}>
          <Image
              source={require('../shared/assets/images/Text_dinuri.png')}
              style={styles.brandImage}
              resizeMode="contain"
              accessible
              accessibilityLabel="디누리"
          />
        </View>

        {/* 본문: 미리보기 + (유동 비율) 촬영:하단버튼 = 2:1 */}
        <View style={[styles.body, { paddingBottom: insets.bottom + GAP_MD }]}>
          {/* 미리보기 */}
          <View style={[styles.previewWindow, { width: previewWidth, height: previewHeight, marginTop: GAP_LG }]}>
            {device ? (
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isFocused}   // ← 포커스일 때만 카메라 ON, 캡처 중이라도 끄지 않음
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
              <Pressable
                  style={[styles.captureBtn, isCapturing && styles.captureBtnDisabled]}
                  accessibilityRole="button"
                  disabled={isCapturing}
                  onPress={onCapture}
              >
                <AppText size={20} tight style={styles.captureText}>
                  {isCapturing ? '처리 중…' : '촬영'}
                </AppText>
              </Pressable>
            </View>

            {/* 이용내역/설정(1) */}
            <View style={styles.rowArea}>
              <Pressable
                  style={styles.secondaryBtn}
                  accessibilityRole="button"
                  // onPress={() => navigation.navigate('HistoryPage')}
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

  header: { paddingTop: 8, paddingBottom: 4 },
  brandImage: { width: 140, height: 28, alignSelf: 'flex-start', marginLeft: -8 },

  body: { flex: 1, paddingHorizontal: 16, justifyContent: 'flex-start' },

  previewWindow: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignSelf: 'center',
  },
  previewFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  bottomArea: { flex: 1, marginTop: GAP_SM },
  captureArea: { flex: 2 },
  rowArea: {
    flex: 1,
    flexDirection: 'row',
    gap: GAP_SM,
    marginTop: GAP_SM,
    alignItems: 'stretch',
  },

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
  captureBtnDisabled: { opacity: 0.6 },
  captureText: { color: '#fff', fontWeight: '800' },

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
