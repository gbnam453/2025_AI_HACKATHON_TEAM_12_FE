// src/features/calendar/export.js
import RNBlobUtil from 'react-native-blob-util';
import { icsDate, escapeICS, parseKoreanDate } from '../tags/helpers';
import { Platform, Alert } from 'react-native';

export async function addCalendarFrom({ dateRaw, title, description }) {
    try {
        const start = parseKoreanDate(dateRaw) || new Date(Date.now() + 10 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DINURI//KR
BEGIN:VEVENT
UID:${Date.now()}@dinuri
DTSTAMP:${icsDate(new Date())}
DTSTART:${icsDate(start)}
DTEND:${icsDate(end)}
SUMMARY:${escapeICS(title || '문서 일정')}
DESCRIPTION:${escapeICS((description || '').slice(0, 1000))}
END:VEVENT
END:VCALENDAR`;

        const path = `${RNBlobUtil.fs.dirs.CacheDir}/event_${Date.now()}.ics`;
        await RNBlobUtil.fs.writeFile(path, ics, 'utf8');

        if (Platform.OS === 'ios') RNBlobUtil.ios.openDocument(path);
        else await RNBlobUtil.android.actionViewIntent(path, 'text/calendar');
    } catch {
        Alert.alert('일정 추가 실패', '캘린더로 보낼 수 없어요.');
    }
}
