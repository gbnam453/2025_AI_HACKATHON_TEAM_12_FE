import RNBlobUtil from 'react-native-blob-util';

const DEFAULT_TTS_TIMEOUT = 60000;

/**
 * 다운로드 유틸
 * - 기본: POST (formBody 사용)
 * - method === 'GET' 이거나 405가 뜨면: GET 쿼리 방식으로 재시도
 * - RNBlobUtil 실패 시 JS fetch로 폴백
 */
export async function downloadMp3({
                                      url,
                                      formBody,
                                      timeoutMs = DEFAULT_TTS_TIMEOUT,
                                      method = 'POST',
                                      fallbackText,      // 405일 때 /api/tts?text=... 로 바꿔 칠 때 사용
                                  }) {
    const path = `${RNBlobUtil.fs.dirs.CacheDir}/tts_${Date.now()}.mp3`;

    // 내부 공통 다운로드 실행기
    const runRNBlob = async (m, targetUrl, body) => {
        const req = RNBlobUtil
            .config({
                path,
                fileCache: true,
                IOSBackgroundTask: true,
                // trusty: true // ❌ 금지
            })
            .fetch(m, targetUrl, {
                Accept: 'audio/mpeg',
                ...(m === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
            }, body);

        const timer = setTimeout(() => { try { req.cancel(); } catch {} }, timeoutMs);
        try {
            const res = await req;
            const status = res.info().status;
            if (status === 200) {
                const saved = res.path();
                return saved.startsWith('file://') ? saved : `file://${saved}`;
            }
            // 상태코드를 에러 메시지에 포함
            const bodyTxt = await res.text().catch(() => '');
            const err = new Error(`HTTP_${status}${bodyTxt ? ` ${bodyTxt}` : ''}`);
            err.status = status;
            throw err;
        } finally {
            clearTimeout(timer);
        }
    };

    const runFetch = async (m, targetUrl, body) => {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const r = await fetch(targetUrl, {
                method: m,
                headers: {
                    Accept: 'audio/mpeg',
                    ...(m === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
                },
                body: m === 'POST' ? body : undefined,
                signal: controller.signal,
            });
            if (!r.ok) {
                const txt = await r.text().catch(() => '');
                const err = new Error(`HTTP_${r.status}${txt ? ` ${txt}` : ''}`);
                err.status = r.status;
                throw err;
            }
            const buf = await r.arrayBuffer();
            const u8 = new Uint8Array(buf);
            let bin = '';
            for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
            const base64 = global.btoa ? global.btoa(bin) : RNBlobUtil.base64.encode(bin);
            await RNBlobUtil.fs.writeFile(path, base64, 'base64');
            return `file://${path}`;
        } finally {
            clearTimeout(t);
        }
    };

    // 1차: RNBlobUtil (지연·메모리 효율)
    try {
        return await runRNBlob(method, url, method === 'POST' ? formBody : undefined);
    } catch (e1) {
        // 405라면 서버가 이 엔드포인트에서 해당 메서드 미허용 → GET /api/tts?text=... 로 재시도
        if (e1?.status === 405 && fallbackText) {
            const ttsGetUrl = url.includes('/api/tts-summary')
                ? url.replace('/api/tts-summary', `/api/tts?text=${encodeURIComponent(fallbackText)}`)
                : (url.includes('/api/tts') ? `${url.split('?')[0]}?text=${encodeURIComponent(fallbackText)}` : url);

            try {
                return await runRNBlob('GET', ttsGetUrl);
            } catch (e1b) {
                // RNBlobUtil GET도 실패 → JS fetch GET 폴백
                try {
                    return await runFetch('GET', ttsGetUrl);
                } catch (e1c) {
                    // 마지막 에러 던지기
                    throw e1c;
                }
            }
        }
        // RNBlobUtil POST 실패 → JS fetch로 같은 메서드/URL 1회 폴백
        try {
            return await runFetch(method, url, method === 'POST' ? formBody : undefined);
        } catch (e2) {
            // JS fetch도 실패 → 405라면 여기서도 GET 재시도
            if (e2?.status === 405 && fallbackText) {
                const ttsGetUrl = url.includes('/api/tts-summary')
                    ? url.replace('/api/tts-summary', `/api/tts?text=${encodeURIComponent(fallbackText)}`)
                    : (url.includes('/api/tts') ? `${url.split('?')[0]}?text=${encodeURIComponent(fallbackText)}` : url);
                return await runFetch('GET', ttsGetUrl);
            }
            throw e2;
        }
    }
}

export default downloadMp3;
