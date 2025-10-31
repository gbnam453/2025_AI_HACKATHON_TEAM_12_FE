// src/features/tts/downloadMp3.js
import RNBlobUtil from 'react-native-blob-util';

export async function downloadMp3Post({ url, formBody, timeoutMs }) {
    const path = `${RNBlobUtil.fs.dirs.CacheDir}/tts_${Date.now()}.mp3`;
    const req = RNBlobUtil
        .config({ path, fileCache: true, IOSBackgroundTask: true, trusty: true })
        .fetch('POST', url, { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'audio/mpeg' }, formBody);

    const timer = setTimeout(() => { try { req.cancel(); } catch {} }, timeoutMs);
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
