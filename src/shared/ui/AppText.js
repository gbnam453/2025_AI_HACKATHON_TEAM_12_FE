import React from 'react';
import { Text, Platform } from 'react-native';
import { useTypography } from '../model/typography';

// 안드로이드 제목 정렬용 보정값
const ANDROID_TITLE_LINE_EXTRA = 2;   // lineHeight 여유(클리핑 방지)
const ANDROID_TITLE_MARGIN_TOP  = -1; // 살짝 위로 이동(시각 중앙 보정)

export default function AppText({ size = 16, tight = false, style, children, ...rest }) {
    const { scale } = useTypography();
    const computed = Math.round(size * scale);

    const androidFix =
        Platform.OS === 'android'
            ? {
                includeFontPadding: false,
                textAlignVertical: 'center',
                ...(tight
                    ? {
                        lineHeight: computed + ANDROID_TITLE_LINE_EXTRA,
                        marginTop: ANDROID_TITLE_MARGIN_TOP,
                    }
                    : null),
            }
            : null;

    return (
        <Text
            allowFontScaling={false}
            style={[{ fontSize: computed }, androidFix, style]}
            {...rest}
        >
            {children}
        </Text>
    );
}
