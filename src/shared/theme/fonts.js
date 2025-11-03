// src/shared/theme/fonts.js
import { Platform } from 'react-native';

// 파일명(확장자 제외) 그대로 사용한다.
// Android는 커스텀 폰트에 fontWeight를 함께 주면 시스템 폰트로 폴백될 수 있으므로,
// 가중치별로 "서로 다른 fontFamily"를 직접 지정하는 전략을 쓴다.
export const fonts = {
    regular: Platform.select({
        ios: 'Pretendard-Regular',
        android: 'Pretendard-Regular',
        default: 'Pretendard-Regular',
    }),
    bold: Platform.select({
        ios: 'Pretendard-Bold',
        android: 'Pretendard-Bold',
        default: 'Pretendard-Bold',
    }),
};

// style.fontWeight 대신 직접 family를 고른다.
// (Android에서 fontFamily + fontWeight를 같이 쓰면 커스텀 폰트가 깨지거나
// 굵기가 사라지는 문제가 흔하다.)
export function resolveFontFamily(inputWeight) {
    if (!inputWeight) return fonts.regular;
    const s = String(inputWeight).toLowerCase();
    if (s === 'bold') return fonts.bold;
    if (s === 'normal') return fonts.regular;
    const n = Number(s);
    return Number.isFinite(n) && n >= 600 ? fonts.bold : fonts.regular;
}
