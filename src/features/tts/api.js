// src/features/tts/api.js
import { API_BASE } from '../../shared/config/env';
import { downloadMp3Post } from './downloadMp3';

export const TTS_TIMEOUT_MS = 60000;

export async function buildSummaryTts({ bullets = [], next_actions = [], fallbackText = '' }) {
    if (!API_BASE) throw new Error('서버 주소가 설정되지 않았습니다. .env의 API_URL을 확인해 주세요.');

    const payloadBullets = Array.isArray(bullets) && bullets.length ? bullets : (fallbackText ? [fallbackText] : []);
    const summaryPayload = { bullets: payloadBullets, next_actions: Array.isArray(next_actions) ? next_actions : [] };
    const formBody = `summary_json=${encodeURIComponent(JSON.stringify(summaryPayload))}&mode=summary`;

    try {
        return await downloadMp3Post({ url: `${API_BASE}/api/tts-summary`, formBody, timeoutMs: TTS_TIMEOUT_MS });
    } catch {
        const fbBody = `text=${encodeURIComponent(fallbackText || (payloadBullets.join(' ') || ''))}`;
        return await downloadMp3Post({ url: `${API_BASE}/api/tts`, formBody: fbBody, timeoutMs: TTS_TIMEOUT_MS });
    }
}
