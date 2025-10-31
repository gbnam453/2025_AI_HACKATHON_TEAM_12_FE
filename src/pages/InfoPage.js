// src/pages/InfoPage.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';

import AppText from '../widgets/AppText';
import LoadingOverlay from '../widgets/LoadingOverlay';
import SummaryActionsList from '../widgets/SummaryActionsList';
import TagButton from '../widgets/TagButton';
import AudioPlayer from '../widgets/AudioPlayer';

import { useTypography } from '../entities/typography';
import { ocrSummarizeFromPhoto } from '../features/ocr/api';
import { buildSummaryTts } from '../features/tts/api';
import { addCalendarFrom } from '../features/calendar/export';
import { first, ensureHttp, formatPhoneForTel } from '../features/tags/helpers';

const BRAND = '#0EA5E9';
const RADIUS = 16;
const GAP_SM = 8;
const BTN_H = 56;
const PRIMARY_DISABLED = '#BAE6FD';

const LOADING_LINES = [
  '조금만 기다려요, 글자를 예쁘게 다듬는 중…',
  '종이를 톡톡 펴고 있어요…',
  '한 글자도 놓치지 않게 쓱— 훑는 중…',
  '중요한 부분에 형광펜 칠하는 중…',
  'AI가 또박또박 읽고 있어요…',
  '요약 꿀팁 모으는 중…',
];
const pickLoadingLine = () => LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)];

export default function InfoPage({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { autoTts, setAutoTts } = useTypography();

  const photo = route?.params?.photo || null;

  const [loading, setLoading] = useState(false);
  const [loadingLine, setLoadingLine] = useState(pickLoadingLine());
  const [errorMsg, setErrorMsg] = useState('');

  const [detectedText, setDetectedText] = useState('');
  const [summary, setSummary] = useState(route?.params?.summary ?? '');
  const [actions, setActions] = useState(route?.params?.actions ?? []);
  const [bullets, setBullets] = useState([]);
  const [tags, setTags] = useState({});

  const [ttsUri, setTtsUri] = useState(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(!autoTts);
  const [sourceKey, setSourceKey] = useState(0);

  const [reloadKey, setReloadKey] = useState(0);

  const hasResult = useMemo(() => !!summary || actions.length > 0, [summary, actions]);
  const confirmDisabled = loading || (!hasResult && !errorMsg);

  // 태그 기반 액션 값
  const phoneRaw = first(tags['전화번호']);
  const urlRaw = first(tags['주소/URL']);
  const amountRaw = first(tags['금액']);
  const accountRaw = first(tags['계좌']);
  const dateRaw = first(tags['기간/마감']) || first(tags['날짜']);

  const hasEvent = !!dateRaw;
  const hasPhone = !!phoneRaw;
  const hasUrl = !!urlRaw;
  const hasAccount = !!accountRaw;
  const hasAmount = !!amountRaw;

  // handlers
  const handleCall = async () => {
    const tel = formatPhoneForTel(phoneRaw);
    if (!tel) return;
    const ok = await Linking.canOpenURL(tel);
    if (ok) Linking.openURL(tel);
    else Alert.alert('통화 불가', '이 기기에서 전화를 걸 수 없어요.');
  };

  const handleOpenUrl = async () => {
    const href = ensureHttp(urlRaw);
    const ok = await Linking.canOpenURL(href);
    if (ok) Linking.openURL(href);
    else Alert.alert('열기 실패', '주소를 열 수 없어요.');
  };

  const handleCopyAccount = async () => {
    try {
      Clipboard.setString(accountRaw);
      Alert.alert('복사 완료', '계좌 번호가 클립보드에 복사되었어요.');
    } catch {
      Alert.alert('복사 불가', '클립보드 모듈이 없어 복사할 수 없어요.\n텍스트를 길게 눌러 복사해 주세요.');
    }
  };

  const handleAddCalendar = async () => {
    await addCalendarFrom({
      dateRaw,
      title: bullets?.[0] || summary || '문서 일정',
      description: detectedText,
    });
  };

  // TTS
  const buildTts = useCallback(async ({ bulletsArg, actsArg, detectedArg, sumArg }) => {
    try {
      const fileUri = await buildSummaryTts({
        bullets: bulletsArg,
        next_actions: actsArg,
        fallbackText: sumArg || detectedArg || '',
      });
      setTtsUri(fileUri);
      setShouldPlay(!!autoTts);
      setIsMuted(!autoTts);
      setSourceKey((k) => k + 1);
    } catch (e) {
      setErrorMsg(`TTS 파일 준비에 실패했습니다.${e?.message ? `\n[원인] ${e.message}` : ''}`);
    }
  }, [autoTts]);

  // 초기 로드
  useEffect(() => {
    let mounted = true;

    const runFromPhoto = async () => {
      try {
        setLoadingLine(pickLoadingLine());
        setLoading(true);
        setErrorMsg('');
        setTtsUri(null);
        setShouldPlay(false);

        const json = await ocrSummarizeFromPhoto(photo);
        if (!mounted) return;

        const detected = json?.full_text || '';
        const srvBullets = Array.isArray(json?.summary?.bullets) ? json.summary.bullets : [];
        const acts = Array.isArray(json?.summary?.next_actions) ? json.summary.next_actions : [];
        const cleanSum = (srvBullets.length ? srvBullets.join(' ') : '').trim();

        setTags(json?.tags || {});
        setDetectedText(detected);
        setBullets(srvBullets);
        setSummary(cleanSum);
        setActions(acts);

        setLoading(false);

        if (cleanSum || detected) {
          buildTts({ bulletsArg: srvBullets, actsArg: acts, detectedArg: detected, sumArg: cleanSum });
        }
      } catch (e) {
        if (!mounted) return;
        setLoading(false);
        const msg = e?.name === 'AbortError' ? '요약 요청이 시간 초과되었습니다.' : '요약/음성 준비에 실패했습니다.';
        setErrorMsg(`${msg}${e?.message ? `\n[원인] ${e.message}` : ''}`);
        setTtsUri(null);
        setShouldPlay(false);
      }
    };

    const runFromParams = async () => {
      try {
        setLoadingLine(pickLoadingLine());
        setLoading(true);
        setErrorMsg('');
        setTtsUri(null);
        setShouldPlay(false);

        const rawSum = route?.params?.summary || '';
        const cleanSum = (rawSum || '').replace(/\s*\/\s*/g, ' ').trim();
        const acts = Array.isArray(route?.params?.actions) ? route.params.actions : [];
        const detected = route?.params?.detected_text || '';

        if (route?.params?.tags) setTags(route.params.tags);

        setSummary(cleanSum);
        setActions(acts);
        setDetectedText(detected);
        setBullets(cleanSum ? [cleanSum] : []);

        setLoading(false);

        if (cleanSum || detected) {
          buildTts({ bulletsArg: cleanSum ? [cleanSum] : [], actsArg: acts, detectedArg: detected, sumArg: cleanSum });
        }
      } catch (e) {
        setLoading(false);
        const msg = e?.name === 'AbortError' ? 'TTS 요청이 시간 초과되었습니다.' : 'TTS 파일 준비에 실패했습니다.';
        setErrorMsg(`${msg}${e?.message ? `\n[원인] ${e.message}` : ''}`);
        setTtsUri(null);
        setShouldPlay(false);
      }
    };

    if (photo) runFromPhoto();
    else if (route?.params?.summary || route?.params?.detected_text) runFromParams();
    else {
      setLoading(false);
      setErrorMsg('요약할 내용이 없습니다. 촬영 후 다시 시도해 주세요.');
    }

    return () => { mounted = false; };
  }, [photo, route?.params?.summary, route?.params?.actions, route?.params?.detected_text, route?.params?.tags, buildTts, reloadKey]);

  // 음소거 토글
  const onToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setAutoTts(!next);
  };

  const replay = () => {
    if (!ttsUri) return;
    setShouldPlay(false);
    setTimeout(() => {
      setSourceKey((k) => k + 1);
      setShouldPlay(true);
    }, 40);
  };

  const retry = () => setReloadKey((k) => k + 1);

  // 태그 버튼 렌더 목록(일정, 전화, 주소, 계좌, 금액)
  const tagButtons = [];
  if (hasEvent) tagButtons.push({ key: 'event', label: '일정 추가하기', onPress: handleAddCalendar, interactive: true });
  if (hasPhone) tagButtons.push({ key: 'phone', label: '통화 하기', onPress: handleCall, interactive: true });
  if (hasUrl) tagButtons.push({ key: 'url', label: '주소 열기', onPress: handleOpenUrl, interactive: true });
  if (hasAccount) tagButtons.push({ key: 'acct', label: '계좌 복사', onPress: handleCopyAccount, interactive: true });
  if (hasAmount) tagButtons.push({ key: 'amt', label: `금액 ${amountRaw}`, onPress: null, interactive: false });

  // 하단 레이아웃 계산
  const rowsCount = tagButtons.length + 2;
  const footerStackHeight = rowsCount * BTN_H + (rowsCount - 1) * GAP_SM;
  const overlayBottomInset = insets.bottom + footerStackHeight;
  const contentBottomReserve = footerStackHeight + GAP_SM + insets.bottom;

  return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          {/* 본문 */}
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: contentBottomReserve }]} showsVerticalScrollIndicator={false}>
            {hasResult ? <SummaryActionsList summary={summary} actions={actions} /> : null}
          </ScrollView>

          {/* 로딩/에러 오버레이 */}
          {(loading || errorMsg) && (
              <LoadingOverlay
                  top={insets.top + 8}
                  left={16}
                  right={16}
                  bottom={overlayBottomInset}
                  loading={loading}
                  message={loadingLine}
                  error={errorMsg}
                  onRetry={loading ? undefined : retry}
              />
          )}

          {/* 하단 고정 버튼 스택 */}
          <View style={[styles.footerWrap, { left: 16, right: 16, bottom: insets.bottom }]} pointerEvents="box-none">
            {tagButtons.map(({ key, label, onPress, interactive }) => {
              const disabled = key === 'amt' || !interactive;
              return <TagButton key={key} label={label} onPress={disabled ? undefined : onPress} disabled={disabled} />;
            })}

            {/* 1행: 음소거 / 다시 듣기 */}
            <View style={styles.rowTwo}>
              <Pressable style={[styles.bottomBtn, styles.rowHalf, isMuted ? styles.muteOn : styles.secondary]} onPress={onToggleMute} accessibilityRole="button">
                <AppText size={18} style={isMuted ? styles.muteOnText : styles.secondaryText}>{isMuted ? '음소거 해제' : '음소거'}</AppText>
              </Pressable>

              <Pressable style={[styles.bottomBtn, styles.rowHalf, styles.secondary, !ttsUri && styles.btnDisabled]} onPress={replay} accessibilityRole="button" disabled={!ttsUri}>
                <AppText size={18} style={styles.secondaryText}>다시 듣기</AppText>
              </Pressable>
            </View>

            {/* 2행: 확인 */}
            <Pressable style={[styles.bottomBtn, styles.primary, confirmDisabled && styles.primaryDisabled]} onPress={() => navigation.goBack()} accessibilityRole="button" disabled={confirmDisabled}>
              <AppText size={18} style={styles.bottomBtnText}>확인</AppText>
            </Pressable>
          </View>

          {/* 오디오 플레이어 */}
          <AudioPlayer uri={ttsUri} shouldPlay={shouldPlay} muted={isMuted} sourceKey={sourceKey} onError={(e) => console.warn('TTS play error', e)} />
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, justifyContent: 'flex-start' },

  content: { paddingTop: 4, gap: 12 },

  footerWrap: { position: 'absolute', gap: GAP_SM },

  rowTwo: { flexDirection: 'row', gap: GAP_SM },
  rowHalf: { flex: 1 },
  bottomBtn: { height: BTN_H, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center' },

  primary: { backgroundColor: BRAND },
  primaryDisabled: { backgroundColor: PRIMARY_DISABLED },
  bottomBtnText: { fontWeight: '800', color: '#fff' },

  secondary: { backgroundColor: '#E5E7EB' },
  secondaryText: { color: '#111', fontWeight: '800' },

  muteOn: { backgroundColor: '#FEE2E2' },
  muteOnText: { color: '#991B1B', fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
});
