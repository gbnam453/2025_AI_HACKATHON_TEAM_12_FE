// src/pages/InfoPage.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import AppText from '../shared/ui/AppText';
import RNBlobUtil from 'react-native-blob-util';
import { useTypography } from '../shared/model/typography';

const API_BASE = 'https://dinuri.gbnam.dev';

const BRAND = '#0EA5E9';
const RADIUS = 16;
const GAP_SM = 8;
const BTN_H = 56;
const PRIMARY_DISABLED = '#BAE6FD';

const OCR_TIMEOUT_MS = 20000;
const TTS_TIMEOUT_MS = 60000;

const LOADING_LINES = [
  '조금만 기다려요, 글자를 예쁘게 다듬는 중…',
  '종이를 톡톡 펴고 있어요…',
  '한 글자도 놓치지 않게 쓱— 훑는 중…',
  '중요한 부분에 형광펜 칠하는 중…',
  'AI가 또박또박 읽고 있어요…',
  '요약 꿀팁 모으는 중…',
];
const pickLoadingLine = () => LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)];

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function downloadMp3({ url, formBody, timeoutMs = TTS_TIMEOUT_MS }) {
  const path = `${RNBlobUtil.fs.dirs.CacheDir}/tts_${Date.now()}.mp3`;
  const req = RNBlobUtil
      .config({ path, fileCache: true, IOSBackgroundTask: true, trusty: true })
      .fetch('POST', url, { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'audio/mpeg' }, formBody);

  const timer = setTimeout(() => { try { req.cancel(); } catch (_) {} }, timeoutMs);
  try {
    const res = await req;
    const status = res.info().status;
    if (status !== 200) throw new Error(`HTTP_${status} @ ${url}`);
    const saved = res.path();
    return saved.startsWith('file://') ? saved : `file://${saved}`;
  } finally {
    clearTimeout(timer);
  }
}

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

  const [ttsUri, setTtsUri] = useState(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(!autoTts);
  const [sourceKey, setSourceKey] = useState(0);
  const playerRef = useRef(null);

  const [reloadKey, setReloadKey] = useState(0);

  const hasResult = useMemo(() => !!summary || actions.length > 0, [summary, actions]);
  const confirmDisabled = loading || (!hasResult && !errorMsg);

  const buildTts = useCallback(async ({ bulletsArg, actsArg, detectedArg, sumArg }) => {
    const payloadBullets = Array.isArray(bulletsArg) && bulletsArg.length ? bulletsArg : (sumArg ? [sumArg] : []);
    const summaryPayload = { bullets: payloadBullets, next_actions: Array.isArray(actsArg) ? actsArg : [] };
    const formBody = `summary_json=${encodeURIComponent(JSON.stringify(summaryPayload))}&mode=${encodeURIComponent('summary')}`;
    try {
      return await downloadMp3({ url: `${API_BASE}/api/tts-summary`, formBody, timeoutMs: TTS_TIMEOUT_MS });
    } catch {
      const fbText = sumArg || detectedArg || '';
      const fbBody = `text=${encodeURIComponent(fbText)}`;
      return await downloadMp3({ url: `${API_BASE}/api/tts`, formBody: fbBody, timeoutMs: TTS_TIMEOUT_MS });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1) 촬영 이미지로부터 요약 가져오기
    const runFromPhoto = async () => {
      try {
        setLoadingLine(pickLoadingLine());
        setLoading(true);
        setErrorMsg('');
        setTtsUri(null);
        setShouldPlay(false);

        const uri = photo?.path?.startsWith('file://') ? photo.path : `file://${photo?.path}`;
        const name = (photo?.path?.split('/')?.pop() || 'image.jpg').replace(/\?.*$/, '');
        const type = name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

        const form = new FormData();
        form.append('image', { uri, name, type });

        const res = await fetchWithTimeout(`${API_BASE}/api/ocr-summarize`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: form,
        }, OCR_TIMEOUT_MS);

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`OCR HTTP ${res.status} ${txt}`);
        }
        const json = await res.json();
        if (!mounted) return;

        const detected = json?.full_text || '';
        const srvBullets = Array.isArray(json?.summary?.bullets) ? json.summary.bullets : [];
        const acts = Array.isArray(json?.summary?.next_actions) ? json.summary.next_actions : [];

        const sum = srvBullets.length ? srvBullets.join(' ') : '';

        // 요약/액션을 화면에 먼저 표시
        setDetectedText(detected);
        setBullets(srvBullets);
        setSummary(sum);
        setActions(acts);
        // ✅ 요약이 보이는 즉시 로딩 인디케이터 종료
        setLoading(false);

        // 2) TTS는 백그라운드에서 조용히 진행
        if (sum || detected) {
          try {
            const fileUri = await buildTts({ bulletsArg: srvBullets, actsArg: acts, detectedArg: detected, sumArg: sum });
            if (!mounted) return;
            setTtsUri(fileUri);
            setShouldPlay(!!autoTts);
            setIsMuted(!autoTts);
            setSourceKey(k => k + 1);
          } catch (e) {
            // TTS만 실패 시에는 로딩을 다시 띄우지 않음. 중앙 에러 + 다시시도 제공.
            if (!mounted) return;
            setErrorMsg(`음성 준비에 실패했습니다.\n[원인] ${e?.message ?? ''}`);
          }
        }
      } catch (e) {
        if (!mounted) return;
        const msg = e?.name === 'AbortError' ? '요약 요청이 시간 초과되었습니다.' : '요약/음성 준비에 실패했습니다.';
        setErrorMsg(`${msg}${e?.message ? `\n[원인] ${e.message}` : ''}`);
        setTtsUri(null);
        setShouldPlay(false);
        setLoading(false); // 실패 시에도 로딩 종료
      }
    };

    // 파라미터로 받은 요약 사용
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

        // 먼저 요약 보여주고 로딩 종료
        setSummary(cleanSum);
        setActions(acts);
        setDetectedText(detected);
        setBullets(cleanSum ? [cleanSum] : []);
        setLoading(false); // ✅ 즉시 종료

        // 그 다음 TTS는 백그라운드
        if (cleanSum || detected) {
          try {
            const fileUri = await buildTts({ bulletsArg: cleanSum ? [cleanSum] : [], actsArg: acts, detectedArg: detected, sumArg: cleanSum });
            setTtsUri(fileUri);
            setShouldPlay(!!autoTts);
            setIsMuted(!autoTts);
            setSourceKey(k => k + 1);
          } catch (e) {
            setErrorMsg(`음성 준비에 실패했습니다.\n[원인] ${e?.message ?? ''}`);
          }
        }
      } catch (e) {
        const msg = e?.name === 'AbortError' ? 'TTS 요청이 시간 초과되었습니다.' : 'TTS 파일 준비에 실패했습니다.';
        setErrorMsg(`${msg}${e?.message ? `\n[원인] ${e.message}` : ''}`);
        setTtsUri(null);
        setShouldPlay(false);
        setLoading(false);
      }
    };

    if (photo) runFromPhoto();
    else if (route?.params?.summary || route?.params?.detected_text) runFromParams();
    else {
      setLoading(false);
      setErrorMsg('요약할 내용이 없습니다. 촬영 후 다시 시도해 주세요.');
    }

    return () => { mounted = false; };
  }, [
    photo,
    route?.params?.summary,
    route?.params?.actions,
    route?.params?.detected_text,
    buildTts,
    reloadKey,
    autoTts,
  ]);

  const onToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setAutoTts(!next);
  };

  const replay = () => {
    if (!ttsUri) return;
    setShouldPlay(false);
    setTimeout(() => {
      setSourceKey(k => k + 1);
      setShouldPlay(true);
    }, 40);
  };

  const retry = () => setReloadKey(k => k + 1);

  // 오버레이 중앙 배치(상단 SafeArea ~ 하단 버튼 사이)
  const footerStackHeight = BTN_H + GAP_SM + BTN_H; // 2행
  const overlayBottomInset = insets.bottom + GAP_SM + footerStackHeight;

  // 스크롤 컨텐츠가 버튼 뒤에 가려지지 않도록 하단 패딩 예약
  const contentBottomReserve = footerStackHeight + GAP_SM + insets.bottom;

  return (
      // 하단을 SafeArea로 주지 않는다(버튼을 더 아래로 내리기 위해)
      <SafeAreaView style={styles.safe} edges={['top','left','right']}>
        <View style={styles.container}>
          {/* 본문 */}
          <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: contentBottomReserve }]}
              showsVerticalScrollIndicator={false}
          >
            {hasResult ? (
                <>
                  {summary ? <AppText size={22} style={styles.summary}>{summary}</AppText> : null}
                  {actions.length > 0 ? (
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
            ) : null}
          </ScrollView>

          {/* 로딩/에러 — 중앙 오버레이 */}
          {(loading || errorMsg) && (
              <View
                  pointerEvents="box-none"
                  style={[
                    styles.overlayCenter,
                    { top: insets.top + 8, left: 16, right: 16, bottom: overlayBottomInset },
                  ]}
              >
                <View style={styles.centerBox}>
                  {loading ? (
                      <>
                        <ActivityIndicator size="large" />
                        <AppText size={16} style={styles.loaderText}>{loadingLine}</AppText>
                      </>
                  ) : (
                      <>
                        <AppText size={16} style={styles.error}>{errorMsg}</AppText>
                        <Pressable style={styles.retryPill} onPress={retry} accessibilityRole="button">
                          <AppText size={16} style={styles.retryText}>다시 시도</AppText>
                        </Pressable>
                      </>
                  )}
                </View>
              </View>
          )}

          {/* 하단 고정 버튼 — SafeArea bottom을 직접 적용해서 진짜 바닥에 붙임 */}
          <View
              style={[
                styles.footerWrap,
                { left: 16, right: 16, bottom: insets.bottom },
              ]}
              pointerEvents="box-none"
          >
            {/* 1행: 음소거 / 다시 듣기 */}
            <View style={styles.rowTwo}>
              <Pressable
                  style={[styles.bottomBtn, isMuted ? styles.muteOn : styles.secondary]}
                  onPress={onToggleMute}
                  accessibilityRole="button"
              >
                <AppText size={18} style={isMuted ? styles.muteOnText : styles.secondaryText}>
                  {isMuted ? '음소거 해제' : '음소거'}
                </AppText>
              </Pressable>

              <Pressable
                  style={[styles.bottomBtn, styles.secondary, !ttsUri && styles.btnDisabled]}
                  onPress={replay}
                  accessibilityRole="button"
                  disabled={!ttsUri}
              >
                <AppText size={18} style={styles.secondaryText}>다시 듣기</AppText>
              </Pressable>
            </View>

            {/* 2행: 확인 (촬영 버튼과 동일 색) */}
            <Pressable
                style={[styles.bottomBtn, styles.primary, confirmDisabled && styles.primaryDisabled]}
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                disabled={confirmDisabled}
            >
              <AppText size={18} style={styles.bottomBtnText}>확인</AppText>
            </Pressable>
          </View>

          {/* 오디오 플레이어 — 레이아웃 영향 없음 */}
          {ttsUri && (
              <View style={styles.playerDock} pointerEvents="none">
                <Video
                    key={sourceKey}
                    ref={playerRef}
                    source={{ uri: ttsUri }}
                    audioOnly
                    controls={false}
                    paused={!shouldPlay}
                    muted={isMuted}
                    volume={isMuted ? 0 : 1}
                    repeat={false}
                    playInBackground={false}
                    ignoreSilentSwitch="ignore"
                    onError={(e) => { console.warn('TTS play error', e); }}
                    style={styles.playerVideo}
                />
              </View>
          )}
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  container: { flex: 1, paddingHorizontal: 16, justifyContent: 'flex-start' },

  content: { paddingTop: 4, gap: 12 },
  summary: { lineHeight: 32, color: '#111', marginTop: 4, fontWeight: '800' },
  actionsList: { marginTop: 10, gap: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, marginTop: 10 },
  actionText: { color: '#111', flex: 1 },

  overlayCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: { alignItems: 'center', gap: 10 },
  loaderText: { color: '#6B7280', textAlign: 'center' },
  error: { color: '#ef4444', textAlign: 'center' },
  retryPill: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#EFF6FF' },
  retryText: { color: BRAND, fontWeight: '800' },

  footerWrap: {
    position: 'absolute',
    gap: GAP_SM,
  },
  rowTwo: { flexDirection: 'row', gap: GAP_SM },

  bottomBtn: {
    height: BTN_H,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primary: { backgroundColor: BRAND },
  primaryDisabled: { backgroundColor: PRIMARY_DISABLED },
  bottomBtnText: { fontWeight: '800', color: '#fff' },

  secondary: { backgroundColor: '#E5E7EB', flex: 1 },
  secondaryText: { color: '#111', fontWeight: '800' },

  muteOn: { backgroundColor: '#FEE2E2', flex: 1 },
  muteOnText: { color: '#991B1B', fontWeight: '800' },

  btnDisabled: { opacity: 0.5 },

  playerDock: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  playerVideo: { width: 1, height: 1 },
});
