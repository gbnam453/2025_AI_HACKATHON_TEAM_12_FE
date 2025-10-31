// src/features/ocr/api.js
import { API_BASE } from '../../shared/config/env';
import { fetchWithTimeout } from '../net/fetchWithTimeout';

export const OCR_TIMEOUT_MS = 20000;

export async function ocrSummarizeFromPhoto(photo) {
    if (!API_BASE) throw new Error('서버 주소가 설정되지 않았습니다. .env의 API_URL을 확인해 주세요.');

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
    return await res.json();
}
