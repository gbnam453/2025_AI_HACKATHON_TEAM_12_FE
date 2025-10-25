// src/pages/InfoPage.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import RNBlobUtil from 'react-native-blob-util';
import AppText from '../shared/ui/AppText';
import { useTypography } from '../shared/model/typography';
import Clipboard from '@react-native-clipboard/clipboard';

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

// ---------- net utils ----------
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

// ---------- tag helpers ----------
const first = (arr) => (Array.isArray(arr) && arr.length ? String(arr[0]) : '');
const ensureHttp = (u) => (u?.startsWith('http') ? u : `https://${u}`);
const onlyDigits = (s) => (s || '').replace(/[^\d]/g, '');
const formatPhoneForTel = (raw) => {
  const d = onlyDigits(raw);
  return d ? `tel:${d}` : '';
};

// YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD / YYYY년 M월 D일 / M월 D일
function parseKoreanDate(s) {
  if (!s) return null;
  const str = String(s).trim();

  // 1) 2025-10-26, 2025.10.26, 2025/10/26
  let m = str.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/);
  if (m) {
    const [_, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), 9, 0, 0);
  }

  // 2) YYYY년 M월 D일
  m = str.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (m) {
    const [_, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), 9, 0, 0);
  }

  // 3) M월 D일 → 올해(이미 지났으면 내년으로 가도 되지만 여기선 올해로)
  m = str.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (m) {
    const [_, mo, d] = m;
    const now = new Date();
    return new Date(now.getFullYear(), Number(mo) - 1, Number(d), 9, 0, 0);
  }

  // 4) 문자열에 날짜 범위가 있으면 마지막 날짜를 잡아봄 (간단 추출)
  m = str.match(/(20\d{2}[./-]\d{1,2}[./-]\d{1,2}).*(20\d{2}[./-]\d{1,2}[./-]\d{1,2})/);
  if (m) {
    const last = m[2];
    const [y, mo, d] = last.split(/[./-]/).map(Number);
    return new Date(y, mo - 1, d, 9, 0, 0);
  }

  return null;
}
const icsDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}`;
};
const escapeICS = (s = '') => String(s).replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

// ---------- main ----------
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
  const [tags, setTags] = useState({}); // ← 서버 tags 수신용

  const [ttsUri, setTtsUri] = useState(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(!autoTts);
  const [sourceKey, setSourceKey] = useState(0);
  const playerRef = useRef(null);

  const [reloadKey, setReloadKey] = useState(0);

  const hasResult = useMemo(() => !!summary || actions.length > 0, [summary, actions]);
  const confirmDisabled = loading || (!hasResult && !errorMsg);

  // 태그 기반 액션 버튼 목록 만들기
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

  // action handlers
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
    } catch (e) {
      Alert.alert('복사 불가', '클립보드 모듈이 없어 복사할 수 없어요.\n텍스트를 길게 눌러 복사해 주세요.');
    }
  };

  const handleAddCalendar = async () => {
    try {
      const start = parseKoreanDate(dateRaw) || new Date(Date.now() + 10 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const title = bullets?.[0] || summary || '문서 일정';
      const desc = detectedText ? detectedText.slice(0, 1000) : '';

      const ics =
          `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DINURI//KR
BEGIN:VEVENT
UID:${Date.now()}@dinuri
DTSTAMP:${icsDate(new Date())}
DTSTART:${icsDate(start)}
DTEND:${icsDate(end)}
SUMMARY:${escapeICS(title)}
DESCRIPTION:${escapeICS(desc)}
END:VEVENT
END:VCALENDAR`;

      const path = `${RNBlobUtil.fs.dirs.CacheDir}/event_${Date.now()}.ics`;
      await RNBlobUtil.fs.writeFile(path, ics, 'utf8');

      if (Platform.OS === 'ios') {
        RNBlobUtil.ios.openDocument(path);
      } else {
        await RNBlobUtil.android.actionViewIntent(path, 'text/calendar');
      }
    } catch (e) {
      Alert.alert('일정 추가 실패', '캘린더로 보낼 수 없어요.');
    }
  };

  // TTS 생성 공통(요약만 읽기). 실패 시 /api/tts 폴백
  const buildTts = useCallback(async ({ bulletsArg, actsArg, detectedArg, sumArg }) => {
    const payloadBullets = Array.isArray(bulletsArg) && bulletsArg.length ? bulletsArg : (sumArg ? [sumArg] : []);
    const summaryPayload = { bullets: payloadBullets, next_actions: Array.isArray(actsArg) ? actsArg : [] };
    const formBody = `summary_json=${encodeURIComponent(JSON.stringify(summaryPayload))}&mode=summary`;
    try {
      return await downloadMp3({ url: `${API_BASE}/api/tts-summary`, formBody, timeoutMs: TTS_TIMEOUT_MS });
    } catch {
      const fbText = sumArg || detectedArg || '';
      const fbBody = `text=${encodeURIComponent(fbText)}`;
      return await downloadMp3({ url: `${API_BASE}/api/tts`, formBody: fbBody, timeoutMs: TTS_TIMEOUT_MS });
    }
  }, []);

  // OCR → 요약 표시(로딩 해제) → TTS 백그라운드
  useEffect(() => {
    let mounted = true;

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
        const cleanSum = (srvBullets.length ? srvBullets.join(' ') : '').trim();

        // NEW: 태그 수신 시 상태 저장
        setTags(json?.tags || {});

        setDetectedText(detected);
        setBullets(srvBullets);
        setSummary(cleanSum);
        setActions(acts);

        // 요약 표시되었으니 로딩 즉시 해제
        setLoading(false);

        // TTS는 백그라운드로 다운로드
        if (cleanSum || detected) {
          buildTts({ bulletsArg: srvBullets, actsArg: acts, detectedArg: detected, sumArg: cleanSum })
              .then((fileUri) => {
                if (!mounted) return;
                setTtsUri(fileUri);
                setShouldPlay(!!autoTts);
                setIsMuted(!autoTts);
                setSourceKey((k) => k + 1);
              })
              .catch((e) => {
                if (!mounted) return;
                setErrorMsg(`TTS 파일 준비에 실패했습니다.${e?.message ? `\n[원인] ${e.message}` : ''}`);
              });
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

        // route에 tags가 오면 반영
        if (route?.params?.tags) setTags(route.params.tags);

        setSummary(cleanSum);
        setActions(acts);
        setDetectedText(detected);
        setBullets(cleanSum ? [cleanSum] : []);

        setLoading(false);

        if (cleanSum || detected) {
          buildTts({ bulletsArg: cleanSum ? [cleanSum] : [], actsArg: acts, detectedArg: detected, sumArg: cleanSum })
              .then((fileUri) => {
                setTtsUri(fileUri);
                setShouldPlay(!!autoTts);
                setIsMuted(!autoTts);
                setSourceKey((k) => k + 1);
              })
              .catch((e) => {
                setErrorMsg(`TTS 파일 준비에 실패했습니다.${e?.message ? `\n[원인] ${e.message}` : ''}`);
              });
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
  }, [
    photo,
    route?.params?.summary,
    route?.params?.actions,
    route?.params?.detected_text,
    route?.params?.tags,
    buildTts,
    reloadKey,
  ]);

  // 음소거 토글(재생/파일 재요청 X, 오디오 파이프만 뮤트)
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

  // 태그 버튼 렌더 목록 만들기 (순서: 일정, 전화, 주소, 계좌, 금액(보기용))
  const tagButtons = [];
  if (hasEvent) tagButtons.push({ key: 'event', label: '일정 추가하기', onPress: handleAddCalendar, interactive: true });
  if (hasPhone) tagButtons.push({ key: 'phone', label: '통화 하기', onPress: handleCall, interactive: true });
  if (hasUrl) tagButtons.push({ key: 'url', label: '주소 열기', onPress: handleOpenUrl, interactive: true });
  if (hasAccount) tagButtons.push({ key: 'acct', label: '계좌 복사', onPress: handleCopyAccount, interactive: true });
  if (hasAmount) tagButtons.push({ key: 'amt', label: `금액 ${amountRaw}`, onPress: null, interactive: false });

  // 오버레이/스크롤 예약 하단 높이(태그행 + 1행(음소거/다시듣기) + 1행(확인))
  const rowsCount = tagButtons.length + 2;
  const footerStackHeight = rowsCount * BTN_H + (rowsCount - 1) * GAP_SM;
  const overlayBottomInset = insets.bottom + footerStackHeight;
  const contentBottomReserve = footerStackHeight + GAP_SM + insets.bottom;

  return (
      // 하단은 SafeArea 제외(진짜 바닥 붙이기), 상단만 SafeArea
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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

          {/* 하단 고정 버튼 스택 */}
          <View
              style={[styles.footerWrap, { left: 16, right: 16, bottom: insets.bottom }]}
              pointerEvents="box-none"
          >
            {/* 태그 유도 버튼들(풀폭, 위에서부터 쌓기) */}
            {tagButtons.map(({ key, label, onPress, interactive }) => {
              const isAmount = key === 'amt';
              const pressable = interactive && !isAmount;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.bottomBtn,
                    styles.secondary
                  ]}
                  onPress={pressable ? onPress : undefined}
                  accessibilityRole={pressable ? 'button' : undefined}
                >
                  <AppText size={18} style={styles.secondaryText}>
                    {label}
                  </AppText>
                </Pressable>
              );
            })}

            {/* 1행: 음소거 / 다시 듣기 */}
            <View style={styles.rowTwo}>
              <Pressable
                  style={[styles.bottomBtn, styles.rowHalf, isMuted ? styles.muteOn : styles.secondary]}
                  onPress={onToggleMute}
                  accessibilityRole="button"
              >
                <AppText size={18} style={isMuted ? styles.muteOnText : styles.secondaryText}>
                  {isMuted ? '음소거 해제' : '음소거'}
                </AppText>
              </Pressable>

              <Pressable
                  style={[styles.bottomBtn, styles.rowHalf, styles.secondary, !ttsUri && styles.btnDisabled]}
                  onPress={replay}
                  accessibilityRole="button"
                  disabled={!ttsUri}
              >
                <AppText size={18} style={styles.secondaryText}>다시 듣기</AppText>
              </Pressable>
            </View>

            {/* 2행: 확인 */}
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

  overlayCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerBox: { alignItems: 'center', gap: 10 },
  loaderText: { color: '#6B7280', textAlign: 'center' },
  error: { color: '#ef4444', textAlign: 'center' },
  retryPill: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#EFF6FF' },
  retryText: { color: BRAND, fontWeight: '800' },

  footerWrap: { position: 'absolute', gap: GAP_SM },

  rowTwo: { flexDirection: 'row', gap: GAP_SM },
  rowHalf: { flex: 1 },

  bottomBtn: {
    height: BTN_H,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primary: { backgroundColor: BRAND },
  primaryDisabled: { backgroundColor: PRIMARY_DISABLED },
  bottomBtnText: { fontWeight: '800', color: '#fff' },

  secondary: { backgroundColor: '#E5E7EB' },
  secondaryText: { color: '#111', fontWeight: '800' },

  infoPill: { backgroundColor: '#F1F5F9' },
  infoText: { color: '#0B0B0B', fontWeight: '800' },

  muteOn: { backgroundColor: '#FEE2E2' },
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
