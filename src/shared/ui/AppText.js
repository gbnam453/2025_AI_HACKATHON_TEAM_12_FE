// src/shared/ui/AppText.js
import React from 'react';
import { Text, Platform, StyleSheet } from 'react-native';
import { useTypography } from '../model/typography';
import { resolveFontFamily } from '../theme/fonts';

const ANDROID_TITLE_LINE_EXTRA = 2;
const ANDROID_TITLE_MARGIN_TOP = -1;

export default function AppText({
                                    size = 16,
                                    tight = false,
                                    style,
                                    children,
                                    weight, // (선택) 'normal' | 'bold' | 100~900
                                    ...rest
                                }) {
    const { scale } = useTypography();
    const computedSize = Math.round(size * scale);

    // style을 평탄화해서 fontWeight를 뽑아오고, Text에 전달할 때는 제거한다.
    const flat = StyleSheet.flatten(style) || {};
    const pickedWeight = weight ?? flat.fontWeight; // prop이 우선
    const family = resolveFontFamily(pickedWeight);

    const androidFix =
        Platform.OS === 'android'
            ? {
                includeFontPadding: false,
                textAlignVertical: 'center',
                ...(tight
                    ? {
                        lineHeight: computedSize + ANDROID_TITLE_LINE_EXTRA,
                        marginTop: ANDROID_TITLE_MARGIN_TOP,
                    }
                    : null),
            }
            : null;

    // fontWeight는 제거하고, 우리가 고른 family만 적용
    const { fontWeight: _ignore, ...restFlat } = flat;

    return (
        <Text
            allowFontScaling={false}
            style={[
                { fontSize: computedSize, fontFamily: family },
                androidFix,
                restFlat,
            ]}
            {...rest}
        >
            {children}
        </Text>
    );
}
