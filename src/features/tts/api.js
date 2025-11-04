// src/features/tts/api.js
import { API_BASE } from '../../shared/config/env';
import { downloadMp3 } from './downloadMp3';

const TTS_TIMEOUT_MS = 60000;

/**
 * 실제 TTS 파일 만드는 공통 함수
 */
export async function buildTts({ bullets, acts, detected, summary }) {
    const payloadBullets =
        Array.isArray(bullets) && bullets.length ? bullets : (summary ? [summary] : []);
    const summaryPayload = {
        bullets: payloadBullets,
        next_actions: Array.isArray(acts) ? acts : [],
    };

    // 1차: 요약 전용 엔드포인트
    const formBody =
        `summary_json=${encodeURIComponent(JSON.stringify(summaryPayload))}&mode=summary`;

    try {
        return await downloadMp3({
            url: `${API_BASE}/api/tts-summary`,
            formBody,
            timeoutMs: TTS_TIMEOUT_MS,
            method: 'POST',
            // 405(GET만 허용)일 때 쿼리로 바꿔 칠 텍스트
            fallbackText: summary || detected || '',
        });
    } catch {
        // 2차: 일반 TTS
        const fbText = summary || detected || '';
        const fbBody = `text=${encodeURIComponent(fbText)}`;
        return await downloadMp3({
            url: `${API_BASE}/api/tts`,
            formBody: fbBody,
            timeoutMs: TTS_TIMEOUT_MS,
            method: 'POST',
            fallbackText: fbText,
        });
    }
}

/**
 * 예전 코드에서 쓰던 이름 유지
 * InfoPage 같은 데서 buildSummaryTts(...)로 부르고 있어도 이걸로 처리됨
 */
export const buildSummaryTts = buildTts;
