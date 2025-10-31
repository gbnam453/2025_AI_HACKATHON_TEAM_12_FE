// src/features/tags/helpers.js
export const first = (arr) => (Array.isArray(arr) && arr.length ? String(arr[0]) : '');
export const ensureHttp = (u) => (u?.startsWith('http') ? u : `https://${u}`);
export const onlyDigits = (s) => (s || '').replace(/[^\d]/g, '');
export const formatPhoneForTel = (raw) => {
    const d = onlyDigits(raw);
    return d ? `tel:${d}` : '';
};

// YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD / YYYY년 M월 D일 / M월 D일
export function parseKoreanDate(s) {
    if (!s) return null;
    const str = String(s).trim();

    let m = str.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/);
    if (m) {
        const [_, y, mo, d] = m;
        return new Date(Number(y), Number(mo) - 1, Number(d), 9, 0, 0);
    }

    m = str.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (m) {
        const [_, y, mo, d] = m;
        return new Date(Number(y), Number(mo) - 1, Number(d), 9, 0, 0);
    }

    m = str.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (m) {
        const [_, mo, d] = m;
        const now = new Date();
        return new Date(now.getFullYear(), Number(mo) - 1, Number(d), 9, 0, 0);
    }

    m = str.match(/(20\d{2}[./-]\d{1,2}[./-]\d{1,2}).*(20\d{2}[./-]\d{1,2}[./-]\d{1,2})/);
    if (m) {
        const last = m[2];
        const [y, mo, d] = last.split(/[./-]/).map(Number);
        return new Date(y, mo - 1, d, 9, 0, 0);
    }
    return null;
}

export const icsDate = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}${m}${d}T${hh}${mm}${ss}`;
};

export const escapeICS = (s = '') => String(s).replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
